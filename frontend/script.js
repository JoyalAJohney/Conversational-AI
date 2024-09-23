let socket;
let audioContext;  // For playback (22050 Hz)
let sourceNode;
let audioQueue = [];
let isPlaying = false;
let audioChunks = [];
let isAudioComplete = false;

function initializePlaybackAudioContext() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 22050  // Increased to match typical audio sample rates
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

        document.getElementById('startButton').disabled = true;
        document.getElementById('stopButton').disabled = false;
    } catch (error) {
        console.error('Error starting recording:', error);
    }
}

async function stopRecording() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close(1000, "Client initiated closure");
    }
    stopAudioPlayback()
    document.getElementById('startButton').disabled = false;
    document.getElementById('stopButton').disabled = true;
}


function initializeWebSocket() {
    socket = new WebSocket('ws://localhost:8000/ws');
    socket.onopen = () => console.log('WebSocket connected');
    socket.onmessage = handleWebSocketMessage;
    socket.onerror = error => console.error('WebSocket error:', error);
}




async function handleWebSocketMessage(event) {
    if (typeof event.data === 'string') {
        document.getElementById('output').innerHTML += event.data + '<br>';
        
        if (event.data === "END_OF_AUDIO") {
            console.log("End of audio stream");
            isAudioComplete = true;
            await processCompleteAudio();
        }
    } else if (event.data instanceof Blob) {
        const arrayBuffer = await event.data.arrayBuffer();
        audioChunks.push(arrayBuffer);
    }
}

function stopAudioPlayback() {
    if (audioContext) {
        audioContext.close().then(() => {
            audioContext = null;
        });
    }
}


// Test
async function processCompleteAudio() {
    if (!isAudioComplete) return;

    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 22050 });
    }

    // Concatenate all audio chunks
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
        console.log("Complete AudioBuffer: ", audioBuffer);
        playAudio(audioBuffer);
    } catch (error) {
        console.error('Error decoding complete audio data:', error);
    }

    // Reset for next audio stream
    audioChunks = [];
    isAudioComplete = false;
}

function playAudio(audioBuffer) {
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start(0);
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('startButton').addEventListener('click', startRecording);
    document.getElementById('stopButton').addEventListener('click', stopRecording);
});