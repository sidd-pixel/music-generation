import time
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.routes import generate, health
from app.utils.logger import get_logger

logger = get_logger("app")
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ───────────────────────────────────────────────────────
    Path("tmp").mkdir(exist_ok=True)
    Path("logs").mkdir(exist_ok=True)

    logger.info("=" * 55)
    logger.info("  🎵  AI Music Generator starting up")
    logger.info(f"  ENV        : {settings.env}")
    logger.info(f"  Model      : {settings.musicgen_model}")
    logger.info(f"  Groq       : {'✅ configured' if settings.groq_api_key else '⚠️  missing'}")
    logger.info(f"  ElevenLabs : {'✅ configured' if settings.eleven_api_key else '⚠️  missing'}")
    logger.info(f"  Max jobs   : {settings.max_concurrent_jobs}")
    logger.info("=" * 55)

    yield

    # ── Shutdown ──────────────────────────────────────────────────────
    logger.info("Server shutting down")


def create_app() -> FastAPI:
    app = FastAPI(
        title="AI Music Generator",
        description=(
            "Generates lyrics via Groq, background music via local MusicGen, "
            "spoken-word voice via ElevenLabs, then merges them into a single MP3."
        ),
        version="1.0.0",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # ── Request ID + timing middleware ────────────────────────────────
    @app.middleware("http")
    async def request_middleware(request: Request, call_next):
        req_id = str(uuid.uuid4())[:8]
        request.state.req_id = req_id
        t0 = time.time()
        logger.debug(f"[{req_id}] → {request.method} {request.url.path}")

        response = await call_next(request)

        elapsed = round((time.time() - t0) * 1000, 1)
        logger.debug(f"[{req_id}] ← {response.status_code} ({elapsed}ms)")
        response.headers["X-Request-Id"] = req_id
        response.headers["X-Response-Time"] = f"{elapsed}ms"
        return response

    # ── Global exception handler ──────────────────────────────────────
    @app.exception_handler(Exception)
    async def global_error_handler(request: Request, exc: Exception):
        logger.exception(f"Unhandled error on {request.url.path}: {exc}")
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error", "detail": str(exc)},
        )

    # ── Routes ────────────────────────────────────────────────────────
    app.include_router(health.router, prefix="/health", tags=["Health"])
    app.include_router(generate.router, prefix="/generate", tags=["Generate"])

    return app
