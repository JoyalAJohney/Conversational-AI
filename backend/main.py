import os
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from .websocket import websocket_endpoint

app = FastAPI()

# Mount the frontend folder as static files
app.mount("/static", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "../frontend")), name="static")

app.add_api_websocket_route("/ws", websocket_endpoint)


@app.get("/")
async def serve_homepage():
    return FileResponse(os.path.join(os.path.dirname(__file__), "../frontend", "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)