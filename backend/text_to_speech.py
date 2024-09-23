import asyncio
import os
import time
import requests
from elevenlabs import VoiceSettings, Voice
from elevenlabs.client import ElevenLabs

# Eleven Labs Config
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
elevenlabs_client = ElevenLabs(api_key=ELEVENLABS_API_KEY)

# Deepgram Config
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
DEEPGRAM_MODEL_NAME = "aura-asteria-en" 



def elevenlabs_tts_stream(text: str):
    audio_stream = elevenlabs_client.generate(
        model="eleven_multilingual_v2",
        stream=True,
        voice=Voice(
            voice_id="XrExE9yKIg1WjnnlVkGX", #Matilda
            settings=VoiceSettings(
                stability=0.0,
                similarity_boost=1.0,
                style=0.0,
                use_speaker_boost=True,
            )
        ),
        text=text,
    )

    for chunk in audio_stream:
        yield chunk

async def deepgram_tts_stream(text: str):
    DEEPGRAM_URL = f"https://api.deepgram.com/v1/speak?model={DEEPGRAM_MODEL_NAME}"
    # linear16&sample_rate=24000"
    headers = {
        "Authorization": f"Token {DEEPGRAM_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "text": text
    }

    audio_file_path = "output.mp3"

    with open(audio_file_path, 'wb') as file_stream:
        response = requests.post(DEEPGRAM_URL, headers=headers, json=payload, stream=True)
        for chunk in response.iter_content(chunk_size=1024):
            if chunk:
                file_stream.write(chunk)
                yield chunk

    # with requests.post(DEEPGRAM_URL, stream=True, headers=headers, json=payload) as r:
    #     for chunk in r.iter_content(chunk_size=1024):
    #         if chunk:
    #             yield chunk


async def stream_audio_to_websocket(websocket, text: str, tts_engine):
    start_time = time.time()
    first_chunk_time = None

    stream_func = deepgram_tts_stream

    try:
        async for chunk in stream_func(text):
            if first_chunk_time is None:
                first_chunk_time = time.time()
                ttfb = int((first_chunk_time - start_time) * 1000)
                print(f"Time to first byte (TTFB): {ttfb}ms")
            
            await websocket.send_bytes(chunk)

        await asyncio.sleep(0.1) # Add a small delay to ensure all audio chunks are sent
        await websocket.send_text("END_OF_AUDIO")

        end_time = time.time()
        total_time = int((end_time - start_time) * 1000)
        print(f"Total TTS time: {total_time}ms")

    except Exception as e:
        print(f"Error streaming audio to websocket: {e}")
        