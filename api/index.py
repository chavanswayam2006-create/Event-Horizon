import sys
from pathlib import Path

# Ensure backend directory is in sys.path for runtime module resolution
backend_dir = Path(__file__).resolve().parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

try:
    from backend.app.main import app
except (ImportError, ModuleNotFoundError):
    from app.main import app  # type: ignore[import-not-found]

__all__ = ["app"]
