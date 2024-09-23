from dotenv import load_dotenv
import os
from pathlib import Path


# Get the root directory of the project
ROOT_DIR = Path(__file__).resolve().parent.parent

# Load .env from the root directory
load_dotenv(ROOT_DIR / ".env")


GROQ_API_KEY = os.getenv("GROQ_API_KEY")
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")

if not GROQ_API_KEY or not DEEPGRAM_API_KEY:
    raise ValueError("GROQ_API_KEY or DEEPGRAM_API_KEY is not set")