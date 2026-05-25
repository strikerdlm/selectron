from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .models import HealthResponse
from .routers import fit, validate, sensitivity, conditions

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(title="Selectron Calibration API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(fit.router, prefix="/fit", tags=["fit"])
app.include_router(validate.router, prefix="/validate", tags=["validate"])
app.include_router(sensitivity.router, prefix="/sensitivity", tags=["sensitivity"])
app.include_router(conditions.router, prefix="/conditions", tags=["conditions"])

@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(status="ok", version="0.1.0")
