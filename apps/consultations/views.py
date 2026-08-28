from django.shortcuts import render
from django.http import JsonResponse

from .models import Consultation


def dashboard(request):

    consultations = Consultation.objects.all().order_by("-created_at")

    patient = None

    if consultations.exists():
        patient = consultations.first().patient

    return render(
        request,
        "dashboard.html",
        {
            "patient": patient,
            "consultations": consultations,
        }
    )


def get_consultation(request, consultation_id):

    if request.method != "GET":

        return JsonResponse(
            {
                "error": "Only GET requests are allowed."
            },
            status=405
        )

    try:

        consultation = Consultation.objects.get(
            id=consultation_id
        )

    except Consultation.DoesNotExist:

        return JsonResponse(
            {
                "error": "Consultation not found."
            },
            status=404
        )

    return JsonResponse({

        "consultation_id": consultation.id,

        "transcript": consultation.transcript,

        "chief_complaints": consultation.chief_complaints,

        "diagnosis": consultation.diagnosis,

        "vitals": consultation.vitals,

        "prescriptions": consultation.prescriptions

    })