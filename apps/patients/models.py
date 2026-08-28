from django.db import models

class Patient(models.Model):
    full_name = models.CharField(max_length=200)
    mobile = models.CharField(max_length=15, blank=True)
    abha_id = models.CharField(max_length=50, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.full_name