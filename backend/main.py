from fastapi import FastAPI
from websocket import websocket_endpoint

app = FastAPI()

app.add_api_websocket_route("/ws", websocket_endpoint)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)