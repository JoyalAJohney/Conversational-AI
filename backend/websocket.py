
from fastapi import WebSocket
from llm_processor import LLMProcessor
from starlette.websockets import WebSocketState
from text_to_speech import stream_audio_to_websocket
from deepgram_handler import create_deepgram_client, initialize_connection, send_audio, stop_connection



async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    language_model_processor = LLMProcessor()

    
    async def on_transcript(transcript: str):
        print(f"User: {transcript}")
        llm_response = await language_model_processor.generate_response(transcript)
        await websocket.send_text(f"Full LLM Response: {llm_response}")
        await stream_audio_to_websocket(websocket, llm_response)


    deepgram_client = create_deepgram_client()
    connection = await initialize_connection(deepgram_client, on_transcript)

    try:
        while True:
            data = await websocket.receive_bytes()
            if isinstance(data, bytes):
                await send_audio(connection, data)
            elif isinstance(data, dict) and data.get('type') == 'websocket.disconnect':
                print("Client initiated websocket closure")
                break
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        if connection:
            await stop_connection(connection) 
        if websocket.client_state == WebSocketState.CONNECTED:
            await websocket.close(code=1000)
