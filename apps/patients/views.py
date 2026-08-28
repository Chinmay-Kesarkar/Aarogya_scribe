from django.shortcuts import render

from apps.patients.models import Patient
from apps.consultations.models import Consultation


def dashboard(request):

    # =========================
    # GET DEMO PATIENT
    # =========================

    patient = Patient.objects.filter(
        full_name__iexact="Ramesh Kunwar"
    ).first()

    # If Ramesh does not exist, use first patient
    if patient is None:
        patient = Patient.objects.first()


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

        "consultations": consultations,

        "latest_consultation": latest_consultation,

    }


    return render(
        request,
        "dashboard.html",
        context
    )