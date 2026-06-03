import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
CHROMA_PATH = os.getenv("CHROMA_PATH", "./chroma_db")
DATA_DIR = os.getenv("DATA_DIR", "./data")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not set in .env")
