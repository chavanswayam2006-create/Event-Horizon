"""
Root entrypoint for Vercel deployment and standard ASGI runners.
Exposes the FastAPI application instance from app.main.
"""
from app.main import app

__all__ = ["app"]
