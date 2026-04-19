import uvicorn
from dotenv import load_dotenv

load_dotenv()

from app import create_app
from config import get_settings

settings = get_settings()
app = create_app()

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=(settings.env == "development"),
        log_level="info",
        access_log=True,
    )
