# Aarogya Scribe

> An AI-powered ambient medical documentation assistant that listens to a doctor-patient consultation, transcribes the conversation, and extracts structured clinical information.

## Overview

Aarogya Scribe is a Django-based medical documentation application designed to reduce the manual effort involved in creating clinical notes.

The application records a consultation through the browser microphone and uses AI to:

- Transcribe the consultation
- Identify chief complaints
- Extract explicitly mentioned diagnoses
- Extract vital signs
- Identify prescribed medicines
- Store the consultation in a database
- Display the extracted information in a clinical dashboard

The goal is to demonstrate how AI can assist healthcare professionals with clinical documentation while keeping the doctor in control of the final record.

---

## Features

- Browser-based audio recording
- AI-powered speech-to-text transcription
- Clinical information extraction using an LLM
- Chief complaint extraction
- Diagnosis extraction
- Vital sign extraction
- Prescription extraction
- Consultation history
- Patient management
- Django backend
- SQLite database for development
- Responsive clinical dashboard
- REST-style API endpoint for audio processing
- Environment-variable based API key configuration

---

## Tech Stack

### Backend

- Python
- Django
- Django REST Framework
- SQLite

### AI

- Groq API
- Whisper for audio transcription
- LLM-based clinical information extraction

### Frontend

- HTML
- CSS
- JavaScript
- Browser MediaRecorder API

---

## Project Structure

```text
Aarogya_scribe/
│
├── apps/
│   ├── consultations/
│   │   ├── migrations/
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── models.py
│   │   ├── tests.py
│   │   └── views.py
│   │
│   ├── patients/
│   │   ├── migrations/
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── models.py
│   │   ├── tests.py
│   │   └── views.py
│   │
│   └── transcription/
│       ├── migrations/
│       ├── admin.py
│       ├── apps.py
│       ├── models.py
│       ├── tests.py
│       ├── urls.py
│       └── views.py
│
├── core/
│   ├── settings.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
│
├── static/
│   ├── css/
│   │   └── dashboard.css
│   └── js/
│       └── dashboard.js
│
├── templates/
│   └── dashboard.html
│
├── media/
│
├── manage.py
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

---

# Getting Started

## 1. Clone the repository

Clone this repository to your local machine:

```bash
git clone <repository-url>
```

Then enter the project directory:

```bash
cd Aarogya_scribe
```

---

## 2. Create a virtual environment

### Windows

```powershell
python -m venv venv
```

Activate it using PowerShell:

```powershell
.\venv\Scripts\Activate.ps1
```

If PowerShell blocks script execution, you can use the virtual environment's Python directly instead:

```powershell
.\venv\Scripts\python.exe manage.py runserver
```

---

## 3. Install dependencies

Install the packages from `requirements.txt`:

```powershell
pip install -r requirements.txt
```

---

## 4. Configure environment variables

Create a file named:

```text
.env
```

in the root directory of the project.

Add your Groq API key:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Do not commit your `.env` file to GitHub.

Your API key is private and should never be exposed publicly.

---

## 5. Run database migrations

Run:

```powershell
python manage.py migrate
```

If you are using the virtual environment directly:

```powershell
.\venv\Scripts\python.exe manage.py migrate
```

---

## 6. Start the development server

Run:

```powershell
python manage.py runserver
```

Or:

```powershell
.\venv\Scripts\python.exe manage.py runserver
```

The application will be available on your local Django development server.

Open the address shown by Django in your browser.

---

# How It Works

The application follows this basic workflow:

```text
Doctor starts consultation
          ↓
Browser microphone records audio
          ↓
Audio sent to Django backend
          ↓
Groq Whisper transcribes audio
          ↓
Transcript sent to LLM
          ↓
Clinical information extracted
          ↓
Structured consultation saved
          ↓
Dashboard displays clinical record
```

---

## Clinical Information Extraction

The AI extracts information explicitly mentioned during the consultation.

### Chief Complaints

Example:

```text
cough
fever
```

### Diagnosis

Example:

```text
viral fever
```

### Vitals

Example:

```text
Blood Pressure: 130 over 85
SpO2: 97%
```

### Prescription

Example:

```text
Paracetamol
500 mg
Twice daily
3 days
```

The extraction prompt is designed to prevent the AI from inventing medical information that was not mentioned in the consultation.

---

# API

The frontend sends recorded audio to the transcription endpoint:

```text
POST /api/transcription/upload/
```

The request contains the recorded audio as multipart form data.

Example field:

```text
audio = consultation.webm
```

The backend processes the audio and returns structured data similar to:

```json
{
    "message": "Audio transcribed and consultation saved successfully.",
    "consultation_id": 1,
    "patient_id": 1,
    "patient_name": "Ramesh",
    "filename": "consultation.webm",
    "transcript": "The patient has cough and fever...",
    "chief_complaints": [
        "cough",
        "fever"
    ],
    "diagnosis": [
        "viral fever"
    ],
    "vitals": {
        "blood_pressure": "130 over 85",
        "spo2": "97%"
    },
    "prescriptions": [
        {
            "medicine": "paracetamol",
            "dose": "500 mg",
            "frequency": "twice daily",
            "duration": "3 days"
        }
    ]
}
```

---

# Important Notes

## API Key

A Groq API key is required for transcription and AI processing.

Never upload your `.env` file to GitHub.

The project uses environment variables so that API credentials remain outside the source code.

---

## Medical Disclaimer

Aarogya Scribe is a software demonstration and documentation-assistance project.

It is not intended to:

- Diagnose patients independently
- Replace a qualified healthcare professional
- Provide medical advice
- Recommend medications
- Make autonomous clinical decisions

The AI is intended to extract information explicitly present in a consultation and assist with documentation.

Clinical information should always be reviewed by an appropriately qualified healthcare professional.

---

# Development

Create new migrations after changing Django models:

```powershell
python manage.py makemigrations
```

Apply migrations:

```powershell
python manage.py migrate
```

Run the development server:

```powershell
python manage.py runserver
```

Run tests:

```powershell
python manage.py test
```

---

# Environment Variables

The project currently expects:

| Variable | Description |
|---|---|
| `GROQ_API_KEY` | API key used for Groq transcription and AI processing |

---

# Contributing

Contributions are welcome.

A basic contribution workflow:

1. Fork the repository.
2. Create a new branch.
3. Make your changes.
4. Test your changes locally.
5. Commit your changes.
6. Open a pull request.

Example:

```bash
git checkout -b feature/my-feature
git add .
git commit -m "Add my feature"
git push origin feature/my-feature
```

---

# Future Improvements

Potential improvements include:

- Patient selection instead of relying on a demo patient
- Authentication and role-based access
- Better consultation history
- PDF clinical report generation
- Editable AI-generated clinical records
- Improved prescription display
- Support for multiple languages
- Better error handling
- Audio recording indicators
- Real-time transcription
- Integration with healthcare standards such as FHIR
- Production database support
- Deployment configuration
- Automated testing
- Improved security and privacy controls

---

# Author

Developed as a hackathon project.

**Aarogya Scribe — Ambient AI Assistant for Clinical Documentation**

---

## License

This project is currently intended as a hackathon / educational project.

Add an appropriate open-source license before accepting external contributions or using the project commercially.