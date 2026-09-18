import os
from dotenv import load_dotenv

load_dotenv()

DEFAULT_MODEL = os.getenv("OPENROUTER_MODEL", "deepseek/deepseek-v4-flash-0731:free")
