from __future__ import annotations
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

@dataclass
class Job:
    id: str
    status: "queued" | "running" | "done" | "failed"
    created_at: datetime
    updated_at: datetime
    result: dict[str, Any] | None = None
    error: str | None = None

class JobStore:
    def __init__(self):
        self._jobs: dict[str, Job] = {}

    def create(self) -> Job:
        job = Job(
            id=str(uuid.uuid4())[:8],
            status="queued",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        self._jobs[job.id] = job
        return job

    def get(self, job_id: str) -> Job | None:
        return self._jobs.get(job_id)

    def update(self, job_id: str, **kwargs) -> Job | None:
        job = self._jobs.get(job_id)
        if not job:
            return None
        for k, v in kwargs.items():
            setattr(job, k, v)
        job.updated_at = datetime.utcnow()
        return job

store = JobStore()
