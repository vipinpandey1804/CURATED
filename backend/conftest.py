"""
Root-level conftest: load .env BEFORE pytest-django initialises Django settings.
This file is at backend/ level so it runs before any other conftest.
"""
from pathlib import Path
from dotenv import load_dotenv

# Must run before pytest-django imports Django settings
load_dotenv(Path(__file__).resolve().parent / ".env")
