const micButton = document.getElementById("micButton");
const statusText = document.getElementById("statusText");
const hintText = document.getElementById("hintText");
const waveform = document.getElementById("waveform");
const transcriptBox = document.getElementById("transcriptBox");

const visitHistoryTitle = document.querySelector(".visit-title");

let mediaRecorder;
let audioChunks = [];
let isRecording = false;


// =========================
// ADD NEW CONSULTATION
// TO VISIT HISTORY
// =========================

function addConsultationToHistory(result) {

    if (!visitHistoryTitle) {
        return;
    }


    // Create the history card
    const historyCard = document.createElement("div");

    historyCard.className = "clinical-card";


    // Current date
    const today = new Date();

    const date = today.toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );


    // Create consultation summary
    let summary = "Consultation";


    if (
        result.chief_complaints &&
        result.chief_complaints.length > 0
    ) {

        summary = result.chief_complaints.join(", ");

    }
    else if (
        result.diagnosis &&
        result.diagnosis.length > 0
    ) {

        summary = result.diagnosis.join(", ");

    }


    historyCard.innerHTML = `
        <strong>${date}</strong>
        <br>
        ${summary}
    `;


    // Insert newest consultation
    // immediately below "Visit History"
    visitHistoryTitle.insertAdjacentElement(
        "afterend",
        historyCard
    );

}


// =========================
// MICROPHONE BUTTON
// =========================

micButton.addEventListener("click", async () => {


    // =========================
    // START RECORDING
    // =========================

    if (!isRecording) {

        try {

            const stream =
                await navigator.mediaDevices.getUserMedia({
                    audio: true
                });


            mediaRecorder =
                new MediaRecorder(stream);


            audioChunks = [];


            mediaRecorder.ondataavailable = (event) => {

                audioChunks.push(event.data);

            };


            mediaRecorder.onstop = async () => {

                const audioBlob =
                    new Blob(
                        audioChunks,
                        {
                            type: "audio/webm"
                        }
                    );


                console.log(
                    "Recording created:",
                    audioBlob
                );


                // =========================
                // PREPARE AUDIO
                // =========================

                const formData =
                    new FormData();


                formData.append(
                    "audio",
                    audioBlob,
                    "consultation.webm"
                );


                try {

                    // =========================
                    // SEND AUDIO TO DJANGO
                    // =========================

                    const response =
                        await fetch(
                            "/api/transcription/upload/",
                            {
                                method: "POST",
                                body: formData
                            }
                        );


                    const result =
                        await response.json();


                    console.log(
                        "Django response:",
                        result
                    );


                    // =========================
                    // CHECK FOR API ERROR
                    // =========================

                    if (!response.ok) {

                        console.error(
                            "Server error:",
                            result
                        );

                        alert(
                            result.error ||
                            "Something went wrong."
                        );

                        return;
                    }


                    // =========================
                    // SHOW CHIEF COMPLAINTS
                    // =========================

                    const complaintsCard =
                        document.querySelector(
                            ".clinical-section:first-of-type .clinical-card"
                        );


                    if (
                        result.chief_complaints &&
                        result.chief_complaints.length > 0
                    ) {

                        complaintsCard.innerHTML =
                            result.chief_complaints
                                .map(
                                    complaint =>
                                        `• ${complaint}`
                                )
                                .join("<br>");

                    }
                    else {

                        complaintsCard.innerText =
                            "No complaints mentioned.";

                    }


                    // =========================
                    // SHOW VITALS
                    // =========================

                    const vitalsCard =
                        document.querySelector(
                            ".clinical-section:nth-of-type(2) .clinical-card"
                        );


                    if (result.vitals) {

                        const bloodPressure =
                            result.vitals.blood_pressure ||
                            "—";


                        const spo2 =
                            result.vitals.spo2 ||
                            "—";


                        vitalsCard.innerHTML =
                            `BP &nbsp; ${bloodPressure} &nbsp;&nbsp; SpO₂ &nbsp; ${spo2}`;

                    }


                    // =========================
                    // SHOW DIAGNOSIS
                    // =========================

                    const diagnosisCard =
                        document.querySelector(
                            ".clinical-section:nth-of-type(3) .clinical-card"
                        );


                    if (
                        result.diagnosis &&
                        result.diagnosis.length > 0
                    ) {

                        diagnosisCard.innerHTML =
                            result.diagnosis
                                .map(
                                    diagnosis =>
                                        `• ${diagnosis}`
                                )
                                .join("<br>");

                    }
                    else {

                        diagnosisCard.innerText =
                            "No diagnosis mentioned.";

                    }


                    // =========================
                    // SHOW PRESCRIPTIONS
                    // =========================

                    const prescriptionCard =
                        document.querySelector(
                            ".clinical-section:nth-of-type(4) .clinical-card"
                        );


                    if (
                        result.prescriptions &&
                        result.prescriptions.length > 0
                    ) {

                        prescriptionCard.innerHTML =
                            result.prescriptions
                                .map(prescription => {

                                    if (
                                        typeof prescription === "object" &&
                                        prescription !== null
                                    ) {

                                        const medicine =
                                            prescription.medicine ||
                                            "Medicine";


                                        const dose =
                                            prescription.dose ||
                                            "";


                                        const frequency =
                                            prescription.frequency ||
                                            "";


                                        const duration =
                                            prescription.duration ||
                                            "";


                                        return `
                                            • ${medicine}
                                            ${dose ? ` - ${dose}` : ""}
                                            ${frequency ? ` - ${frequency}` : ""}
                                            ${duration ? ` - ${duration}` : ""}
                                        `;

                                    }


                                    return `• ${prescription}`;

                                })
                                .join("<br>");

                    }
                    else {

                        prescriptionCard.innerText =
                            "No prescription mentioned.";

                    }


                    // =========================
                    // SHOW TRANSCRIPT
                    // =========================

                    if (result.transcript) {

                        statusText.innerText =
                            "Consultation Transcribed";


                        transcriptBox.innerText =
                            result.transcript;


                        hintText.innerText =
                            "Transcript captured successfully.";

                    }


                    // =========================
                    // ADD TO VISIT HISTORY
                    // =========================

                    if (result.consultation_id) {

                        addConsultationToHistory(
                            result
                        );

                    }


                } catch (error) {

                    console.error(
                        "Upload failed:",
                        error
                    );

                    alert(
                        "Upload failed. Please try again."
                    );

                }


                // =========================
                // STOP MICROPHONE
                // =========================

                stream
                    .getTracks()
                    .forEach(track => {
                        track.stop();
                    });

            };


            // =========================
            // START MEDIA RECORDER
            // =========================

            mediaRecorder.start();

            isRecording = true;


            // =========================
            // SHOW WAVEFORM
            // =========================

            waveform.style.display =
                "flex";


            // =========================
            // CHANGE BUTTON
            // =========================

            micButton.innerHTML =
                "⏹️";


            micButton.style.background =
                "#ff5f63";


            // =========================
            // CHANGE TEXT
            // =========================

            statusText.innerText =
                "Recording...";


            hintText.innerText =
                "Tap the button to stop the consultation.";


        } catch (error) {

            console.error(
                error
            );

            alert(
                "Microphone permission is required."
            );

        }

    }


    // =========================
    // STOP RECORDING
    // =========================

    else {

        mediaRecorder.stop();

        isRecording = false;


        // =========================
        // HIDE WAVEFORM
        // =========================

        waveform.style.display =
            "none";


        // =========================
        // RESET BUTTON
        // =========================

        micButton.innerHTML =
            "🎙️";


        micButton.style.background =
            "#eeeeee";


        // =========================
        // CHANGE TEXT
        // =========================

        statusText.innerText =
            "Consultation Recorded";


        hintText.innerText =
            "Processing transcription...";

    }

});