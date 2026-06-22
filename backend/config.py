import os
from dotenv import load_dotenv

load_dotenv()

DEFAULT_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemma-4-31b-it:free")
