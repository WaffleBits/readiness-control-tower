from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.analytics import ReadinessAnalytics


class WhatIfRequest(BaseModel):
    expedite_parts_days: int = Field(default=0, ge=0, le=14)
    restore_systems: list[str] = Field(default_factory=list)
    add_available_maintainers: int = Field(default=0, ge=0, le=20)


app = FastAPI(
    title="Readiness Control Tower API",
    version="0.1.0",
    description="Synthetic mission readiness analytics API.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def analytics() -> ReadinessAnalytics:
    return ReadinessAnalytics()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/readiness")
def readiness() -> dict:
    return analytics().dashboard()


@app.get("/api/assets")
def assets() -> list[dict]:
    return analytics().asset_risks()


@app.get("/api/root-causes")
def root_causes() -> list[dict]:
    return analytics().root_causes()


@app.get("/api/timeline")
def timeline() -> list[dict]:
    return analytics().timeline()


@app.post("/api/what-if")
def what_if(request: WhatIfRequest) -> dict:
    return analytics().what_if(
        expedite_parts_days=request.expedite_parts_days,
        restore_systems=request.restore_systems,
        add_available_maintainers=request.add_available_maintainers,
    )

