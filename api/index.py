import sys
import os

# Ensure the root project directory is on sys.path
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

# Set VERCEL environment flag
os.environ["VERCEL"] = "1"

from backend.app.main import app

# Export app for Vercel ASGI serverless handler
handler = app
