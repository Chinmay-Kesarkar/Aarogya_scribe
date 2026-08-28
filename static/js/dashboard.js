// =====================================================
// AAROGYA SCRIBE - DASHBOARD JAVASCRIPT
// =====================================================


// =====================================================
// ELEMENTS
// =====================================================

const micButton = document.getElementById("micButton");
const statusText = document.getElementById("statusText");
const hintText = document.getElementById("hintText");
const waveform = document.getElementById("waveform");
const transcriptBox = document.getElementById("transcriptBox");

const visitHistoryTitle =
    document.querySelector(".visit-title");


// =====================================================
// VARIABLES
// =====================================================

let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let recordingStartTime = 0;

// =====================================================
// LIVE AUDIO VISUALIZER
// =====================================================

let audioContext = null;
let analyser = null;
let microphoneSource = null;
let animationFrameId = null;

const waveformBars =
    document.querySelectorAll("#waveform span");

// =====================================================
// START LIVE WAVEFORM
// =====================================================

function startLiveWaveform(stream) {

    try {

        audioContext =
            new (window.AudioContext ||
                window.webkitAudioContext)();

        analyser =
            audioContext.createAnalyser();

        analyser.fftSize = 256;

        analyser.smoothingTimeConstant = 0.75;

        microphoneSource =
            audioContext.createMediaStreamSource(stream);

        microphoneSource.connect(analyser);

        const dataArray =
            new Uint8Array(analyser.fftSize);


        function drawWaveform() {

            if (!isRecording) {
                return;
            }

            analyser.getByteTimeDomainData(dataArray);


            const bars =
                waveformBars.length;


            for (let i = 0; i < bars; i++) {

                const start =
                    Math.floor(
                        (i / bars) *
                        dataArray.length
                    );

                const end =
                    Math.floor(
                        ((i + 1) / bars) *
                        dataArray.length
                    );


                let sum = 0;
                let peak = 0;


                for (let j = start; j < end; j++) {

                    const value =
                        Math.abs(
                            dataArray[j] - 128
                        ) / 128;

                    sum += value;

                    peak =
                        Math.max(
                            peak,
                            value
                        );
                }


                const average =
                    sum / Math.max(1, end - start);


                const intensity =
                    Math.min(
                        1,
                        average * 3 +
                        peak * 0.7
                    );


                const minHeight = 6;
                const maxHeight = 64;


                const height =
                    minHeight +
                    intensity *
                    (maxHeight - minHeight);


                waveformBars[i].style.height =
                    `${height}px`;
            }


            animationFrameId =
                requestAnimationFrame(
                    drawWaveform
                );
        }


        if (
            audioContext.state ===
            "suspended"
        ) {
            audioContext.resume();
        }


        drawWaveform();

    }

    catch (error) {

        console.error(
            "Waveform error:",
            error
        );
    }
}

// =====================================================
// STOP LIVE WAVEFORM
// =====================================================

function stopLiveWaveform() {

    if (animationFrameId) {

        cancelAnimationFrame(
            animationFrameId
        );

        animationFrameId = null;
    }


    if (microphoneSource) {

        microphoneSource.disconnect();

        microphoneSource = null;
    }


    if (audioContext) {

        audioContext.close();

        audioContext = null;
    }


    waveformBars.forEach(
        bar => {
            bar.style.height = "8px";
        }
    );
}


// =====================================================
// DISPLAY CLINICAL DATA
// =====================================================

function displayClinicalData(result) {

    // -------------------------------------------------
    // CHIEF COMPLAINTS
    // -------------------------------------------------

    const complaintsCard =
        document.getElementById("chiefComplaints");

    if (complaintsCard) {

        if (
            result.chief_complaints &&
            result.chief_complaints.length > 0
        ) {

            complaintsCard.innerHTML =
                result.chief_complaints
                    .map(complaint => `• ${complaint}`)
                    .join("<br>");

        } else {

            complaintsCard.innerText =
                "No complaints mentioned.";
        }
    }


    // -------------------------------------------------
    // VITALS
    // -------------------------------------------------

    const vitalsCard =
        document.getElementById("vitalsCard");

    if (vitalsCard) {

        const bloodPressure =
            result.vitals?.blood_pressure || "—";

        const spo2 =
            result.vitals?.spo2 || "—";

        vitalsCard.innerHTML =
            `BP &nbsp; ${bloodPressure}
             &nbsp;&nbsp;
             SpO₂ &nbsp; ${spo2}`;
    }


    // -------------------------------------------------
    // DIAGNOSIS
    // -------------------------------------------------

    const diagnosisCard =
        document.getElementById("diagnosisCard");

    if (diagnosisCard) {

        if (
            result.diagnosis &&
            result.diagnosis.length > 0
        ) {

            diagnosisCard.innerHTML =
                result.diagnosis
                    .map(diagnosis => `• ${diagnosis}`)
                    .join("<br>");

        } else {

            diagnosisCard.innerText =
                "No diagnosis mentioned.";
        }
    }


    // -------------------------------------------------
    // PRESCRIPTIONS
    // -------------------------------------------------

    const prescriptionCard =
        document.getElementById("prescriptionCard");

    if (prescriptionCard) {

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
                                prescription.dose || "";

                            const frequency =
                                prescription.frequency || "";

                            const duration =
                                prescription.duration || "";

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

        } else {

            prescriptionCard.innerText =
                "No prescription mentioned.";
        }
    }
}


// =====================================================
// DISPLAY TRANSCRIPT
// =====================================================

function displayTranscript(result) {

    if (result.transcript) {

        statusText.innerText =
            "Consultation Transcribed";

        transcriptBox.innerText =
            result.transcript;

        hintText.innerText =
            "Transcript captured successfully.";
    }
}


// =====================================================
// LOAD PREVIOUS CONSULTATION
// =====================================================

async function loadConsultation(consultationId) {

    console.log(
        "Loading consultation:",
        consultationId
    );


    try {

        const response =
            await fetch(
                `/api/transcription/consultation/${consultationId}/`
            );


        const result =
            await response.json();


        console.log(
            "Consultation details:",
            result
        );


        if (!response.ok) {

            console.error(
                "Failed to load consultation:",
                result
            );

            alert(
                result.error ||
                "Could not load consultation."
            );

            return;
        }


        // -------------------------------------------------
        // TRANSCRIPT
        // -------------------------------------------------

        if (result.transcript) {

            transcriptBox.innerText =
                result.transcript;

            statusText.innerText =
                "Previous Consultation";

            hintText.innerText =
                "Previous consultation loaded.";
        }


        // -------------------------------------------------
        // CLINICAL DATA
        // -------------------------------------------------

        displayClinicalData(result);

    }

    catch (error) {

        console.error(
            "Failed to load consultation:",
            error
        );

        alert(
            "Could not load consultation."
        );
    }
}


// =====================================================
// ADD NEW CONSULTATION TO VISIT HISTORY
// =====================================================

function addConsultationToHistory(result) {

    if (!visitHistoryTitle) {
        return;
    }


    const historyCard =
        document.createElement("div");


    historyCard.className =
        "clinical-card visit-card";


    historyCard.dataset.consultationId =
        result.consultation_id;


    // -------------------------------------------------
    // DATE
    // -------------------------------------------------

    const today = new Date();

    const date =
        today.toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );


    // -------------------------------------------------
    // SUMMARY
    // -------------------------------------------------

    let summary =
        "Consultation";


    if (
        result.chief_complaints &&
        result.chief_complaints.length > 0
    ) {

        summary =
            result.chief_complaints.join(", ");

    }

    else if (
        result.diagnosis &&
        result.diagnosis.length > 0
    ) {

        summary =
            result.diagnosis.join(", ");
    }


    // -------------------------------------------------
    // HTML
    // -------------------------------------------------

    historyCard.innerHTML = `
        <strong>${date}</strong>
        <br>
        ${summary}
    `;


    // -------------------------------------------------
    // ADD TO TOP
    // -------------------------------------------------

    visitHistoryTitle.insertAdjacentElement(
        "afterend",
        historyCard
    );


    // -------------------------------------------------
    // CLICK EVENT
    // -------------------------------------------------

    historyCard.addEventListener(
        "click",
        () => {

            loadConsultation(
                result.consultation_id
            );
        }
    );
}


// =====================================================
// AUDIO FORMAT
// =====================================================

function getSupportedMimeType() {

    const mimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus"
    ];


    for (const mimeType of mimeTypes) {

        if (
            MediaRecorder.isTypeSupported(mimeType)
        ) {

            console.log(
                "Using audio format:",
                mimeType
            );

            return mimeType;
        }
    }


    console.log(
        "Using browser default audio format."
    );


    return "";
}


// =====================================================
// MICROPHONE BUTTON
// =====================================================

micButton.addEventListener(
    "click",
    async () => {


        // =================================================
        // START RECORDING
        // =================================================

        if (!isRecording) {

            try {

                console.log(
                    "Requesting microphone..."
                );


                const stream =
                    await navigator.mediaDevices.getUserMedia({
                        audio: {
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true
                        }
                    });


                console.log(
                    "Microphone permission granted."
                );


                const mimeType =
                    getSupportedMimeType();


                if (mimeType) {

                    mediaRecorder =
                        new MediaRecorder(
                            stream,
                            {
                                mimeType: mimeType,
                                audioBitsPerSecond: 128000
                            }
                        );

                } else {

                    mediaRecorder =
                        new MediaRecorder(stream);
                }


                audioChunks = [];


                // -------------------------------------------------
                // AUDIO DATA
                // -------------------------------------------------

                mediaRecorder.ondataavailable =
                    (event) => {

                        if (event.data.size > 0) {

                            audioChunks.push(
                                event.data
                            );
                        }
                    };


                // -------------------------------------------------
                // RECORDING STOPPED
                // -------------------------------------------------

                mediaRecorder.onstop =
                    async () => {

                        console.log(
                            "Recording stopped."
                        );


                        const recordingDuration =
                            (Date.now() -
                                recordingStartTime) /
                            1000;


                        console.log(
                            "Recording duration:",
                            recordingDuration.toFixed(2),
                            "seconds"
                        );


                        // -------------------------------------------------
                        // CREATE AUDIO
                        // -------------------------------------------------

                        const audioBlob =
                            new Blob(
                                audioChunks,
                                {
                                    type:
                                        mediaRecorder.mimeType ||
                                        "audio/webm"
                                }
                            );


                        console.log(
                            "Final audio size:",
                            audioBlob.size,
                            "bytes"
                        );


                        // -------------------------------------------------
                        // VALIDATE AUDIO
                        // -------------------------------------------------

                        if (audioBlob.size < 5000) {

                            alert(
                                "The recording contains little or no audio. Please check your microphone and try again."
                            );

                            stream
                                .getTracks()
                                .forEach(
                                    track =>
                                        track.stop()
                                );

                            return;
                        }


                        if (recordingDuration < 1.5) {

                            alert(
                                "Please record the consultation for at least a few seconds."
                            );

                            stream
                                .getTracks()
                                .forEach(
                                    track =>
                                        track.stop()
                                );

                            return;
                        }


                        // -------------------------------------------------
                        // FORM DATA
                        // -------------------------------------------------

                        const formData =
                            new FormData();


                        formData.append(
                            "audio",
                            audioBlob,
                            "consultation.webm"
                        );


                        // -------------------------------------------------
                        // UI
                        // -------------------------------------------------

                        statusText.innerText =
                            "Processing consultation...";

                        hintText.innerText =
                            "Transcribing audio with AI...";


                        try {

                            console.log(
                                "Uploading audio to Django..."
                            );


                            // -------------------------------------------------
                            // SEND TO DJANGO
                            // -------------------------------------------------

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


                            // -------------------------------------------------
                            // SERVER ERROR
                            // -------------------------------------------------

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


                            // -------------------------------------------------
                            // DISPLAY DATA
                            // -------------------------------------------------

                            displayClinicalData(
                                result
                            );


                            displayTranscript(
                                result
                            );


                            // -------------------------------------------------
                            // ADD TO VISIT HISTORY
                            // -------------------------------------------------

                            if (
                                result.consultation_id
                            ) {

                                addConsultationToHistory(
                                    result
                                );
                            }

                        }

                        catch (error) {

                            console.error(
                                "Upload failed:",
                                error
                            );

                            alert(
                                "Upload failed. Please try again."
                            );
                        }


                        // -------------------------------------------------
                        // STOP MICROPHONE
                        // -------------------------------------------------

                        stream
                            .getTracks()
                            .forEach(
                                track =>
                                    track.stop()
                            );
                    };


                // =================================================
                // START RECORDING
                // =================================================

                mediaRecorder.start(1000);

                recordingStartTime =
                    Date.now();

                isRecording = true;


                console.log(
                    "Recording started"
                );

                startLiveWaveform(stream);


                // -------------------------------------------------
                // UI
                // -------------------------------------------------

                waveform.style.display =
                    "flex";


                micButton.innerHTML =
                    "⏹️";


                micButton.style.background =
                    "#ff5f63";


                statusText.innerText =
                    "Recording...";


                hintText.innerText =
                    "Speak normally. Tap the button when finished.";

            }

            catch (error) {

                console.error(
                    "Microphone error:",
                    error
                );

                alert(
                    "Microphone permission is required."
                );
            }
        }


        // =================================================
        // STOP RECORDING
        // =================================================

        else {

            if (
                mediaRecorder &&
                mediaRecorder.state !== "inactive"
            ) {

                console.log(
                    "Stopping recording..."
                );

                mediaRecorder.stop();
            }


            isRecording = false;

                isRecording = false;

                stopLiveWaveform();

                waveform.style.display =
                    "none";


            waveform.style.display =
                "none";


            micButton.innerHTML =
                "🎙️";


            micButton.style.background =
                "#eeeeee";


            statusText.innerText =
                "Consultation Recorded";


            hintText.innerText =
                "Processing transcription...";
        }
    }
);


// =====================================================
// EXISTING VISIT HISTORY CARDS
// =====================================================

const visitCards =
    document.querySelectorAll(
        ".visit-card"
    );


visitCards.forEach(
    (card) => {

        card.addEventListener(
            "click",
            async () => {

                const consultationId =
                    card.dataset.consultationId;


                console.log(
                    "Selected consultation:",
                    consultationId
                );


                if (!consultationId) {

                    console.error(
                        "No consultation ID found on this card."
                    );

                    return;
                }


                await loadConsultation(
                    consultationId
                );
            }
        );
    }
);
// =========================
// SEE MORE / SEE LESS
// =========================

const seeMoreButton = document.getElementById("seeMoreButton");

if (seeMoreButton) {

    seeMoreButton.addEventListener("click", function () {

        const visitCards = document.querySelectorAll(".visit-card");

        const isExpanded =
            seeMoreButton.textContent.trim() === "See Less";


        if (!isExpanded) {

            // SHOW ALL
            visitCards.forEach(function (card) {
                card.style.display = "block";
            });

            seeMoreButton.textContent = "See Less";

        } else {

            // SHOW ONLY FIRST 3
            visitCards.forEach(function (card, index) {

                if (index < 3) {
                    card.style.display = "block";
                } else {
                    card.style.display = "none";
                }

            });

            seeMoreButton.textContent = "See More";

        }

    });

}