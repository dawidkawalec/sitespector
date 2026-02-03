"""
Main FastAPI application for SiteSpector.
"""

from datetime import datetime
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import logging
from app.config import settings
from app.database import init_db, close_db
from app.routers import auth, audits
from app.schemas import HealthCheck, ErrorResponse

# Configure logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="SiteSpector API",
    description="AI-powered website audit tool API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# Exception Handlers
# ============================================

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError
) -> JSONResponse:
    """Handle validation errors."""
    errors = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error["loc"])
        errors.append({
            "field": field,
            "message": error["msg"]
        })
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "details": errors
        }
    )


@app.exception_handler(Exception)
async def global_exception_handler(
    request: Request,
    exc: Exception
) -> JSONResponse:
    """Handle all uncaught exceptions."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    if settings.DEBUG:
        detail = str(exc)
    else:
        detail = "An internal error occurred"
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "detail": detail
        }
    )


# ============================================
# Lifecycle Events
# ============================================

@app.on_event("startup")
async def startup_event() -> None:
    """Initialize application on startup."""
    logger.info("Starting SiteSpector API...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Debug mode: {settings.DEBUG}")
    
    # Initialize database (if needed)
    # await init_db()
    
    logger.info("✅ SiteSpector API started successfully")


@app.on_event("shutdown")
async def shutdown_event() -> None:
    """Cleanup on shutdown."""
    logger.info("Shutting down SiteSpector API...")
    await close_db()
    logger.info("✅ SiteSpector API shut down successfully")


# ============================================
# Routes
# ============================================

@app.get("/", tags=["Root"])
async def root() -> dict:
    """Root endpoint."""
    return {
        "message": "SiteSpector API",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", response_model=HealthCheck, tags=["Health"])
async def health_check() -> dict:
    """
    Health check endpoint.
    
    Returns system status and database connectivity.
    """
    # TODO: Add actual database connectivity check
    database_status = "healthy"
    
    return {
        "status": "healthy",
        "version": "2.0.0",
        "database": database_status,
        "timestamp": datetime.utcnow()
    }


@app.get("/api/logs/worker", tags=["Monitoring"])
async def get_worker_logs(lines: int = 100):
    """
    Get recent worker logs for monitoring.
    
    Query params:
        lines: Number of recent lines to return (default: 100, max: 1000)
    """
    import subprocess
    
    if lines > 1000:
        lines = 1000
    
    try:
        result = subprocess.run(
            ["docker", "logs", "sitespector-worker", "--tail", str(lines)],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        return {
            "service": "worker",
            "lines": lines,
            "logs": result.stdout + result.stderr,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to get worker logs: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to retrieve logs", "detail": str(e)}
        )


@app.get("/api/logs/backend", tags=["Monitoring"])
async def get_backend_logs(lines: int = 100):
    """
    Get recent backend logs for monitoring.
    
    Query params:
        lines: Number of recent lines to return (default: 100, max: 1000)
    """
    import subprocess
    
    if lines > 1000:
        lines = 1000
    
    try:
        result = subprocess.run(
            ["docker", "logs", "sitespector-backend", "--tail", str(lines)],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        return {
            "service": "backend",
            "lines": lines,
            "logs": result.stdout + result.stderr,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to get backend logs: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Failed to retrieve logs", "detail": str(e)}
        )


@app.get("/api/system/status", tags=["Monitoring"])
async def get_system_status():
    """
    Check health of all critical services: Screaming Frog, Lighthouse, Worker, Database.
    
    Returns status for each service with timestamp.
    """
    import subprocess
    
    status = {
        "timestamp": datetime.utcnow().isoformat(),
        "version": "2.0.0",
        "services": {}
    }
    
    # Check Screaming Frog
    try:
        result = subprocess.run(
            ["docker", "exec", "sitespector-screaming-frog", "screamingfrogseospider", "--help"],
            capture_output=True,
            text=True,
            timeout=5
        )
        # SF returns exit code 1 with --help but it's actually working if we see Usage in output
        is_online = "Usage: ScreamingFrogSEOSpider" in result.stdout or "Usage: ScreamingFrogSEOSpider" in result.stderr
        status["services"]["screaming_frog"] = {
            "status": "online" if is_online else "offline",
            "version": "Commercial/CLI" if is_online else None,
            "error": None if is_online else (result.stderr or "Not responding")
        }
    except Exception as e:
        status["services"]["screaming_frog"] = {
            "status": "error",
            "error": str(e)
        }
    
    # Check Lighthouse
    try:
        result = subprocess.run(
            ["docker", "exec", "sitespector-lighthouse", "lighthouse", "--version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        status["services"]["lighthouse"] = {
            "status": "online" if result.returncode == 0 else "offline",
            "version": result.stdout.strip() if result.returncode == 0 else None,
            "error": result.stderr if result.returncode != 0 else None
        }
    except Exception as e:
        status["services"]["lighthouse"] = {
            "status": "error",
            "error": str(e)
        }
    
    # Check Worker
    try:
        result = subprocess.run(
            ["docker", "exec", "sitespector-worker", "pgrep", "-f", "worker.py"],
            capture_output=True,
            text=True,
            timeout=5
        )
        status["services"]["worker"] = {
            "status": "online" if result.returncode == 0 else "offline",
            "pid": result.stdout.strip() if result.returncode == 0 else None
        }
    except Exception as e:
        status["services"]["worker"] = {
            "status": "error",
            "error": str(e)
        }
    
    # Check Database
    try:
        result = subprocess.run(
            ["docker", "exec", "sitespector-postgres", "pg_isready", "-U", "sitespector_user"],
            capture_output=True,
            text=True,
            timeout=5
        )
        status["services"]["database"] = {
            "status": "online" if result.returncode == 0 else "offline",
            "message": result.stdout.strip() if result.returncode == 0 else result.stderr
        }
    except Exception as e:
        status["services"]["database"] = {
            "status": "error",
            "error": str(e)
        }
    
    return status


# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(audits.router, prefix="/api")


# ============================================
# Middleware
# ============================================

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all HTTP requests."""
    logger.info(f"{request.method} {request.url.path}")
    
    response = await call_next(request)
    
    logger.info(
        f"{request.method} {request.url.path} - "
        f"Status: {response.status_code}"
    )
    
    return response


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG,
    )

