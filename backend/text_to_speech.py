import asyncio
import os
import time
import requests
from config import DEEPGRAM_API_KEY


# Deepgram Config
DEEPGRAM_MODEL_NAME = "aura-asteria-en" 
DEEPGRAM_TTS_ENDPOINT = f"https://api.deepgram.com/v1/speak?model={DEEPGRAM_MODEL_NAME}"


async def deepgram_tts_stream(text: str):
    headers = {
        "Authorization": f"Token {DEEPGRAM_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "text": text
    }

    with requests.post(DEEPGRAM_TTS_ENDPOINT, stream=True, headers=headers, json=payload) as r:
        for chunk in r.iter_content(chunk_size=1024):
            if chunk:
                yield chunk



async def stream_audio_to_websocket(websocket, text: str):
    start_time = time.time()
    first_chunk_time = None

    stream_func = deepgram_tts_stream

    try:
        async for chunk in stream_func(text):
            if first_chunk_time is None:
                first_chunk_time = time.time()
                ttfb = int((first_chunk_time - start_time) * 1000)
                print(f"TTS: Time to first byte (TTFB): {ttfb}ms")
            
            await websocket.send_bytes(chunk)

        await asyncio.sleep(0.1) # Add a small delay to ensure all audio chunks are sent

        end_time = time.time()
        total_time = int((end_time - start_time) * 1000)
        print(f"Total TTS time: {total_time}ms")

        return total_time

    except Exception as e:
        print(f"Error streaming audio to websocket: {e}")
        return 0
        