from django.contrib import admin
from django.urls import path, include
from apps.patients.views import dashboard


urlpatterns = [
    path("", dashboard, name="dashboard"),
    path("admin/", admin.site.urls),
    path("api/transcription/", include("apps.transcription.urls")),
]