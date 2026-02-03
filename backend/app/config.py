"""
Configuration management for SiteSpector backend.
"""

from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://sitespector_user:sitespector_password@localhost:5432/sitespector_db",
        description="PostgreSQL database URL",
    )

    # Authentication
    JWT_SECRET: str = Field(
        default="change-this-to-a-secure-random-string-minimum-32-chars",
        description="Secret key for JWT token generation",
    )
    JWT_ALGORITHM: str = Field(default="HS256", description="JWT algorithm")
    JWT_EXPIRATION_DAYS: int = Field(default=7, description="JWT token expiration in days")
    BCRYPT_COST: int = Field(default=12, description="Bcrypt hashing cost factor")

    GEMINI_API_KEY: str = Field(default="", description="Google Gemini API key")
    
    # Claude AI (Deprecated, kept for compatibility if needed)
    CLAUDE_API_KEY: str = Field(default="", description="Anthropic Claude API key")
    CLAUDE_MODEL: str = Field(
        default="claude-sonnet-4-20250514", description="Claude model version"
    )
    CLAUDE_MAX_TOKENS: int = Field(default=8000, description="Max tokens for Claude responses")
    CLAUDE_TEMPERATURE: float = Field(default=0.3, description="Claude temperature")

    # Application
    ENVIRONMENT: str = Field(default="development", description="Environment (development/production)")
    
    # Screaming Frog Credentials
    SCREAMING_FROG_USER: str = Field(default="", description="SF License User")
    SCREAMING_FROG_KEY: str = Field(default="", description="SF License Key")
    DEBUG: bool = Field(default=True, description="Debug mode")
    API_VERSION: str = Field(default="v1", description="API version")
    APP_NAME: str = Field(default="SiteSpector", description="Application name")
    APP_URL: str = Field(default="http://localhost:3000", description="Frontend URL")

    # API Configuration
    API_HOST: str = Field(default="0.0.0.0", description="API host")
    API_PORT: int = Field(default=8000, description="API port")
    API_WORKERS: int = Field(default=4, description="Number of API workers")
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:3001"],
        description="CORS allowed origins",
    )

    # Rate Limiting
    RATE_LIMIT_REGISTER: str = Field(default="5/hour", description="Register endpoint rate limit")
    RATE_LIMIT_LOGIN: str = Field(default="10/hour", description="Login endpoint rate limit")
    RATE_LIMIT_AUDIT_CREATE: str = Field(
        default="5/hour", description="Audit creation rate limit"
    )
    RATE_LIMIT_GET: str = Field(default="60/minute", description="GET endpoints rate limit")

    # Worker Configuration
    WORKER_POLL_INTERVAL: int = Field(
        default=10, description="Worker polling interval in seconds"
    )
    WORKER_MAX_CONCURRENT_AUDITS: int = Field(
        default=3, description="Maximum concurrent audits"
    )
    AUDIT_TIMEOUT_MINUTES: int = Field(default=10, description="Audit timeout in minutes")

    # External Services
    SCREAMING_FROG_CONTAINER: str = Field(
        default="screaming-frog", description="Screaming Frog container name"
    )
    SCREAMING_FROG_MAX_PAGES: int = Field(
        default=500, description="Max pages to crawl with Screaming Frog"
    )

    LIGHTHOUSE_CONTAINER: str = Field(
        default="lighthouse", description="Lighthouse container name"
    )
    LIGHTHOUSE_TIMEOUT: int = Field(default=60, description="Lighthouse timeout in seconds")

    # File Storage
    PDF_STORAGE_PATH: str = Field(default="/tmp/audits", description="PDF storage path")
    PDF_CACHE_ENABLED: bool = Field(default=True, description="Enable PDF caching")
    PDF_MAX_SIZE_MB: int = Field(default=10, description="Maximum PDF size in MB")

    # Logging
    LOG_LEVEL: str = Field(default="INFO", description="Logging level")
    LOG_FORMAT: str = Field(default="json", description="Log format (json/text)")
    LOG_FILE: str = Field(default="logs/sitespector.log", description="Log file path")

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


# Global settings instance
settings = Settings()

