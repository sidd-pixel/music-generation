import logging
import sys
from pathlib import Path

LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)

FMT = "%(asctime)s [%(levelname)s] %(name)s — %(message)s"
DATE_FMT = "%H:%M:%S"


def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger

    logger.setLevel(logging.DEBUG)

    # Console handler
    ch = logging.StreamHandler(sys.stdout)
    ch.setLevel(logging.DEBUG)
    ch.setFormatter(logging.Formatter(FMT, datefmt=DATE_FMT))
    logger.addHandler(ch)

    # File handler — errors only
    fh = logging.FileHandler(LOG_DIR / "error.log")
    fh.setLevel(logging.ERROR)
    fh.setFormatter(logging.Formatter(FMT))
    logger.addHandler(fh)

    # File handler — everything
    fha = logging.FileHandler(LOG_DIR / "combined.log")
    fha.setLevel(logging.DEBUG)
    fha.setFormatter(logging.Formatter(FMT))
    logger.addHandler(fha)

    return logger
