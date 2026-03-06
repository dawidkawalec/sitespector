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

    # Authentication (Legacy JWT - will be deprecated)
    JWT_SECRET: str = Field(
        default="change-this-to-a-secure-random-string-minimum-32-chars",
        description="Secret key for JWT token generation (legacy)",
    )
    JWT_ALGORITHM: str = Field(default="HS256", description="JWT algorithm")
    JWT_EXPIRATION_DAYS: int = Field(default=7, description="JWT token expiration in days")
    BCRYPT_COST: int = Field(default=12, description="Bcrypt hashing cost factor")

    # Supabase (New Auth Provider)
    SUPABASE_URL: str = Field(default="", description="Supabase project URL")
    SUPABASE_ANON_KEY: str = Field(default="", description="Supabase anon/public key")
    SUPABASE_SERVICE_KEY: str = Field(default="", description="Supabase service role key (secret)")

    # Stripe Billing
    STRIPE_SECRET_KEY: str = Field(default="", description="Stripe secret key")
    STRIPE_PUBLISHABLE_KEY: str = Field(default="", description="Stripe publishable key")
    STRIPE_WEBHOOK_SECRET: str = Field(default="", description="Stripe webhook signing secret")
    STRIPE_PRICE_ID_PRO: str = Field(default="", description="Stripe price ID for Pro plan")
    STRIPE_PRICE_ID_ENTERPRISE: str = Field(default="", description="Stripe price ID for Enterprise plan")

    GEMINI_API_KEY: str = Field(default="", description="Google Gemini API key")
    GEMINI_API_KEY_FALLBACK: str = Field(default="", description="Google Gemini API key (fallback)")
    GEMINI_API_KEYS: str = Field(
        default="",
        description="Optional comma-separated list of Gemini API keys (in addition to GEMINI_API_KEY)",
    )

    # Qdrant (RAG vector store)
    QDRANT_HOST: str = Field(default="qdrant", description="Qdrant host (docker service name)")
    QDRANT_PORT: int = Field(default=6333, description="Qdrant port")
    QDRANT_URL: str = Field(default="", description="Optional full Qdrant URL (overrides host/port)")
    
    # Frontend URL (for redirects, Stripe)
    FRONTEND_URL: str = Field(default="https://sitespector.app", description="Frontend URL")
    
    # Claude AI (Deprecated, kept for compatibility if needed)
    CLAUDE_API_KEY: str = Field(default="", description="Anthropic Claude API key")
    CLAUDE_MODEL: str = Field(
        default="claude-sonnet-4-20250514", description="Claude model version"
    )
    CLAUDE_MAX_TOKENS: int = Field(default=8000, description="Max tokens for Claude responses")
    CLAUDE_TEMPERATURE: float = Field(default=0.3, description="Claude temperature")

    # Security
    ADMIN_API_TOKEN: str = Field(default="", description="Admin API token for monitoring endpoints (generate with: openssl rand -hex 32)")
    IMPERSONATION_JWT_SECRET: str = Field(
        default="change-this-impersonation-secret-minimum-32-chars",
        description="Secret key for admin impersonation session tokens",
    )
    IMPERSONATION_TTL_MINUTES: int = Field(
        default=30,
        description="Default TTL (minutes) for admin impersonation session tokens",
    )

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
    LIGHTHOUSE_TIMEOUT: int = Field(default=180, description="Lighthouse timeout in seconds")

    # Senuto SEO Platform
    SENUTO_EMAIL: str = Field(default="", description="Senuto account email for API auth")
    SENUTO_PASSWORD: str = Field(default="", description="Senuto account password for API auth")
    SENUTO_API_URL: str = Field(default="https://api.senuto.com/api", description="Senuto API base URL")
    SENUTO_DEFAULT_COUNTRY_ID: int = Field(default=200, description="Senuto default country ID (200=Polska baza 2.0)")
    SENUTO_DEFAULT_FETCH_MODE: str = Field(default="subdomain", description="Senuto default fetch mode (subdomain/domain)")
    SENUTO_TIMEOUT: int = Field(default=60, description="Senuto API request timeout in seconds")

    # File Storage
    PDF_STORAGE_PATH: str = Field(default="/tmp/audits", description="PDF storage path")
    PDF_CACHE_ENABLED: bool = Field(default=True, description="Enable PDF caching")
    PDF_MAX_SIZE_MB: int = Field(default=10, description="Maximum PDF size in MB")
    CHAT_ATTACHMENTS_PATH: str = Field(
        default="/data/chat-attachments",
        description="Path inside container for persisted chat attachments",
    )
    CHAT_ATTACHMENT_MAX_SIZE_MB: int = Field(default=10, description="Maximum chat attachment size in MB")

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

