from django.shortcuts import render

from apps.patients.models import Patient
from apps.consultations.models import Consultation


def dashboard(request):

    # =========================
    # GET SELECTED PATIENT
    # =========================

    patient_id = request.GET.get("patient_id")

    patient = None

    if patient_id:

        try:
            patient = Patient.objects.get(
                id=patient_id
            )

        except Patient.DoesNotExist:
            patient = None


    # =========================
    # DEFAULT PATIENT
    # =========================

    if patient is None:

        patient = Patient.objects.filter(
            full_name__iexact="Ramesh Kunwar"
        ).first()


    # If Ramesh does not exist,
    # use the first patient

    if patient is None:

        patient = Patient.objects.first()


    # =========================
    # GET ALL PATIENTS
    # =========================

    patients = Patient.objects.all().order_by(
        "full_name"
    )


    # =========================
    # GET PATIENT CONSULTATIONS
    # =========================

    consultations = []

    if patient:

        consultations = Consultation.objects.filter(
            patient=patient
        ).order_by("-created_at")


    # =========================
    # GET LATEST CONSULTATION
    # =========================

    latest_consultation = None

    if consultations:

        latest_consultation = consultations[0]


    # =========================
    # SEND DATA TO DASHBOARD
    # =========================

    context = {

        "patient": patient,

        "patients": patients,

        "consultations": consultations,

        "latest_consultation": latest_consultation,

    }


    return render(
        request,
        "dashboard.html",
        context
    )