from django.urls import path

from .views import upload_audio
from apps.consultations.views import get_consultation


urlpatterns = [

    path(
        "upload/",
        upload_audio,
        name="upload_audio"
    ),

    path(
        "consultation/<int:consultation_id>/",
        get_consultation,
        name="get_consultation"
    ),

]