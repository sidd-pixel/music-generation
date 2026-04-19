import asyncio
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Coroutine, Dict, Optional

from config import get_settings
from logger import get_logger

logger = get_logger("queue")
settings = get_settings()


class JobStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    DONE = "done"
    FAILED = "failed"


@dataclass
class JobRecord:
    job_id: str
    status: JobStatus = JobStatus.QUEUED
    result: Any = None
    error: Optional[str] = None
    created_at: float = field(default_factory=time.time)
    started_at: Optional[float] = None
    finished_at: Optional[float] = None

    def duration(self) -> Optional[float]:
        if self.started_at and self.finished_at:
            return round(self.finished_at - self.started_at, 2)
        return None


class JobQueue:
    def __init__(self, max_concurrent: int, timeout: float):
        self._sem = asyncio.Semaphore(max_concurrent)
        self._timeout = timeout
        self._jobs: Dict[str, JobRecord] = {}

    async def enqueue(self, job_id: str, fn: Callable[[], Coroutine]) -> Any:
        record = JobRecord(job_id=job_id)
        self._jobs[job_id] = record

        async with self._sem:
            record.status = JobStatus.RUNNING
            record.started_at = time.time()
            logger.info(f"Job {job_id} started")

            try:
                result = await asyncio.wait_for(fn(), timeout=self._timeout)
                record.status = JobStatus.DONE
                record.result = result
                logger.info(f"Job {job_id} completed in {record.duration()}s")
                return result
            except asyncio.TimeoutError:
                err = f"Job {job_id} timed out after {self._timeout}s"
                record.status = JobStatus.FAILED
                record.error = err
                logger.error(err)
                raise TimeoutError(err)
            except Exception as exc:
                record.status = JobStatus.FAILED
                record.error = str(exc)
                record.finished_at = time.time()
                logger.error(f"Job {job_id} failed: {exc}")
                raise
            finally:
                record.finished_at = time.time()

    def get_job(self, job_id: str) -> Optional[JobRecord]:
        return self._jobs.get(job_id)

    def stats(self) -> dict:
        jobs = list(self._jobs.values())
        return {
            "total": len(jobs),
            "queued": sum(1 for j in jobs if j.status == JobStatus.QUEUED),
            "running": sum(1 for j in jobs if j.status == JobStatus.RUNNING),
            "done": sum(1 for j in jobs if j.status == JobStatus.DONE),
            "failed": sum(1 for j in jobs if j.status == JobStatus.FAILED),
        }


# Singleton
job_queue = JobQueue(
    max_concurrent=settings.max_concurrent_jobs,
    timeout=float(settings.job_timeout_seconds),
)
