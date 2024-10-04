let socket;
let audioContext;
let sourceNode;
let audioQueue = [];
let isPlaying = false;
let audioChunks = [];
let isAudioComplete = false;
let recognition;
let currentAudioSource = null;
let recorder;
let isRecording = false;

let aiAnimation;
const micButton = document.getElementById('mic-button');
const statusText = document.getElementById('status-text');

document.addEventListener('DOMContentLoaded', () => {
    // Initialize AI voice Lottie animation
    aiAnimation = lottie.loadAnimation({
        container: document.getElementById('ai-animation-container'),
        renderer: 'svg',
        loop: true,
        autoplay: false,
        path: 'https://lottie.host/7dade4ef-7cf3-4fcb-b9d6-e80be2475409/qXJrrtTNBS.json'
    });

    micButton.addEventListener('click', toggleRecording);
});

function toggleRecording() {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

function initializePlaybackAudioContext() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 22050
    });
}

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: { 
                sampleRate: 16000,
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true
            } 
        });

        window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new window.SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = event => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');
            if (transcript.trim().length > 0) {
                updateStatusText("User is speaking");
            }
        };

        recognition.onend = () => {
            console.log("Speech recognition ended");
            updateStatusText("");
        };

        recorder = new RecordRTC(stream, {
            type: 'audio',
            mimeType: 'audio/webm',
            recorderType: RecordRTC.StereoAudioRecorder,
            timeSlice: 250,
            desiredSampRate: 16000,
            numberOfAudioChannels: 1,
            bufferSize: 4096,
            ondataavailable: (blob) => {
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(blob);
                }
            }
        });

        initializeWebSocket();
        recorder.startRecording();
        recognition.start();

        isRecording = true;
        micButton.classList.add('recording');
    } catch (error) {
        console.error('Error starting recording:', error);
    }
}

function updateStatusText(text) {
    statusText.textContent = text;
    statusText.classList.toggle('visible', text !== "");
}

async function stopRecording() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close(1000, "Client initiated closure");
    }
    stopAudioPlayback();
    recognition.stop();
    isRecording = false;
    micButton.classList.remove('recording');
    updateStatusText("");
}

function initializeWebSocket() {
    socket = new WebSocket('ws://localhost:8000/ws');
    socket.onopen = () => console.log('WebSocket connected');
    socket.onmessage = handleWebSocketMessage;
    socket.onerror = error => console.error('WebSocket error:', error);
}

async function handleWebSocketMessage(event) {
    if (typeof event.data === 'string') {
        if (event.data === "END_OF_AUDIO") {
            isAudioComplete = true;
            await processCompleteAudio();
        }
    } else if (event.data instanceof Blob) {
        const arrayBuffer = await event.data.arrayBuffer();
        audioChunks.push(arrayBuffer);
    }
}

function stopAudioPlayback() {
    if (currentAudioSource) {
        currentAudioSource.stop();
        currentAudioSource.disconnect();
        currentAudioSource = null;
    }
    aiAnimation.stop();
    updateStatusText("");
}

async function processCompleteAudio() {
    if (!isAudioComplete) return;

    stopAudioPlayback();
    initializePlaybackAudioContext();

    const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
    const completeAudioBuffer = new ArrayBuffer(totalLength);
    const uint8Array = new Uint8Array(completeAudioBuffer);
    let offset = 0;
    for (const chunk of audioChunks) {
        uint8Array.set(new Uint8Array(chunk), offset);
        offset += chunk.byteLength;
    }

    try {
        const audioBuffer = await audioContext.decodeAudioData(completeAudioBuffer);
        playAudio(audioBuffer);
    } catch (error) {
        console.error('Error decoding complete audio data:', error);
    }

    audioChunks = [];
    isAudioComplete = false;
}

function playAudio(audioBuffer) {
    initializePlaybackAudioContext();
    
    if (currentAudioSource) {
        currentAudioSource.stop();
        currentAudioSource.disconnect();
    }

    currentAudioSource = audioContext.createBufferSource();
    currentAudioSource.buffer = audioBuffer;
    currentAudioSource.connect(audioContext.destination);
    currentAudioSource.start(0);

    currentAudioSource.onended = () => {
        currentAudioSource = null;
        aiAnimation.stop();
        updateStatusText("");
    };

    // Start the AI animation and update status text
    aiAnimation.play();
    updateStatusText("AI is speaking");
}