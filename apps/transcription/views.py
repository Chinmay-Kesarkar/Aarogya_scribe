from apps.patients.models import Patient
from apps.consultations.models import Consultation

from django.http import JsonResponse
from django.core.files.storage import default_storage
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt

from groq import Groq

import json


@csrf_exempt
def upload_audio(request):

    if request.method != "POST":
        return JsonResponse(
            {"error": "Only POST requests are allowed."},
            status=405
        )

    audio_file = request.FILES.get("audio")

    if not audio_file:
        return JsonResponse(
            {"error": "No audio file received."},
            status=400
        )


    # =========================
    # SAVE AUDIO LOCALLY
    # =========================

    file_path = f"consultations/{audio_file.name}"

    saved_path = default_storage.save(
        file_path,
        audio_file
    )

    full_path = default_storage.path(saved_path)


    try:

        # =========================
        # CONNECT TO GROQ
        # =========================

        client = Groq(
            api_key=settings.GROQ_API_KEY
        )


        # =========================
        # STEP 1: TRANSCRIBE AUDIO
        # =========================

        with open(full_path, "rb") as audio:

            transcription = client.audio.transcriptions.create(
                file=(audio_file.name, audio),
                model="whisper-large-v3-turbo",
                response_format="json"
            )

        transcript = transcription.text


        # =========================
        # STEP 2: EXTRACT
        # CLINICAL DATA
        # =========================

        ai_response = client.chat.completions.create(

            model="openai/gpt-oss-20b",

            messages=[
                {
                    "role": "system",
                    "content": """
You are a medical documentation assistant.

Read the consultation transcript and extract ONLY information
that is explicitly mentioned.

Extract:

1. The patient's chief complaints.
2. Any diagnosis explicitly stated by the doctor.
3. Any vital signs explicitly mentioned.
4. Any medicines explicitly prescribed by the doctor.

Return ONLY valid JSON in this exact format:

{
    "chief_complaints": [
        "complaint 1",
        "complaint 2"
    ],
    "diagnosis": [
        "diagnosis 1",
        "diagnosis 2"
    ],
    "vitals": {
        "blood_pressure": "",
        "spo2": ""
    },
    "prescriptions": [
        {
            "medicine": "",
            "dose": "",
            "frequency": "",
            "duration": ""
        }
    ]
}

Rules:

- Do not invent symptoms.
- Do not invent diagnoses.
- Do not invent vital signs.
- Do not invent medicines.
- Only extract information explicitly mentioned in the transcript.
- Only include a diagnosis if the doctor explicitly states it.
- If blood pressure is not mentioned, use an empty string.
- If SpO2 is not mentioned, use an empty string.
- Only include medicines explicitly prescribed by the doctor.
- If a medicine's dose is not mentioned, use an empty string.
- If the frequency is not mentioned, use an empty string.
- If the duration is not mentioned, use an empty string.
- If no prescription is mentioned, return an empty prescriptions array.
- Do not provide medical advice.
- Do not recommend additional medicines.
"""
                },

                {
                    "role": "user",
                    "content": transcript
                }
            ],

            temperature=0
        )


        # =========================
        # GET AI RESPONSE
        # =========================

        ai_text = ai_response.choices[0].message.content.strip()

        print("AI response:", ai_text)


        # =========================
        # CONVERT AI JSON
        # =========================

        clinical_data = json.loads(ai_text)


        # =========================
        # EXTRACT CHIEF COMPLAINTS
        # =========================

        chief_complaints = clinical_data.get(
            "chief_complaints",
            []
        )


        # =========================
        # EXTRACT DIAGNOSIS
        # =========================

        diagnosis = clinical_data.get(
            "diagnosis",
            []
        )


        # =========================
        # EXTRACT VITALS
        # =========================

        vitals = clinical_data.get(
            "vitals",
            {}
        )

        blood_pressure = vitals.get(
            "blood_pressure",
            ""
        )

        spo2 = vitals.get(
            "spo2",
            ""
        )


        # =========================
        # EXTRACT PRESCRIPTIONS
        # =========================

        prescriptions = clinical_data.get(
            "prescriptions",
            []
        )


    except Exception as error:

        print("AI / Transcription error:", error)

        return JsonResponse(
            {
                "error": "Transcription or AI processing failed.",
                "details": str(error)
            },
            status=500
        )


    # =========================
    # FIND DEMO PATIENT
    # =========================

    patient = Patient.objects.filter(
        full_name__iexact="Ramesh Kunwar"
    ).first()


    # =========================
    # IF PATIENT DOES NOT EXIST
    # USE FIRST AVAILABLE PATIENT
    # =========================

    if patient is None:

        patient = Patient.objects.first()


    # =========================
    # NO PATIENT IN DATABASE
    # =========================

    if patient is None:

        return JsonResponse(
            {
                "error": "No patient exists in the database. Please create a patient first."
            },
            status=404
        )


    print(
        "Using patient:",
        patient.id,
        patient.full_name
    )


    # =========================
    # SAVE CONSULTATION
    # =========================

    consultation = Consultation.objects.create(

        patient=patient,

        status="completed",

        transcript=transcript,

        chief_complaints=chief_complaints,

        vitals={
            "blood_pressure": blood_pressure,
            "spo2": spo2
        },

        diagnosis=diagnosis,

        prescriptions=prescriptions
    )


    print(
        "Consultation saved:",
        consultation.id
    )


    # =========================
    # SEND RESPONSE TO FRONTEND
    # =========================

    return JsonResponse({

        "message": "Audio transcribed and consultation saved successfully.",

        "consultation_id": consultation.id,

        "patient_id": patient.id,

        "patient_name": patient.full_name,

        "filename": audio_file.name,

        "transcript": transcript,

        "chief_complaints": chief_complaints,

        "diagnosis": diagnosis,

        "vitals": {
            "blood_pressure": blood_pressure,
            "spo2": spo2
        },

        "prescriptions": prescriptions

    })