from django.db import models
from apps.patients.models import Patient


class Consultation(models.Model):
    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="consultations"
    )

    status = models.CharField(
        max_length=30,
        default="draft"
    )

    transcript = models.TextField(
        blank=True
    )

    chief_complaints = models.JSONField(
        default=list,
        blank=True
    )

    vitals = models.JSONField(
        default=dict,
        blank=True
    )

    diagnosis = models.JSONField(
        default=list,
        blank=True
    )

    prescriptions = models.JSONField(
        default=list,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return f"{self.patient.full_name} - {self.created_at:%d %b %Y}"