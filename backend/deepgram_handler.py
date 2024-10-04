import time
from .config import DEEPGRAM_API_KEY
from deepgram import (
    DeepgramClient,
    DeepgramClientOptions,
    LiveTranscriptionEvents,
    LiveOptions
)

start_time = None


def create_deepgram_client():
    config = DeepgramClientOptions(options={"keepalive": "true"})
    return DeepgramClient(DEEPGRAM_API_KEY, config)



async def initialize_connection(client, on_transcript_callback):
    connection = client.listen.asynclive.v("1")
    print('Listening...')

    transcript = ""

    async def on_message(self, result, **kwargs):
        nonlocal transcript
        global start_time

        sentence = result.channel.alternatives[0].transcript

        if result.is_final:
            transcript += sentence + " "
            if result.speech_final:
                full_sentence = transcript.strip()
                if len(full_sentence) > 0:

                    # Logging End time for STT
                    end_time = time.time()
                    total_time = int((end_time - start_time) * 1000) if start_time else 0
                    print(f"Total STT time: {total_time}ms")

                    await on_transcript_callback(transcript.strip(), total_time)
                    transcript = ""
                    print("")
    
    
    async def on_error(self, error, **kwargs):
        print(f"Error: {error}")
    

    # Attaching handlers
    connection.on(LiveTranscriptionEvents.Transcript, on_message)
    connection.on(LiveTranscriptionEvents.Error, on_error)

    options = LiveOptions(
        model="nova-2",
        language="en-US",
        # Raw audio format details
        encoding="linear16",
        channels=1,
        sample_rate=16000,
        endpointing=True,
    )

    await connection.start(options)
    return connection



async def send_audio(connection, audio_data):
    global start_time
    if connection:
        start_time = time.time()
        await connection.send(audio_data)


async def stop_connection(connection):
    if connection:
        await connection.finish()