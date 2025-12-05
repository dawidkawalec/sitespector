"""
Tests for authentication endpoints.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import User


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    """Test successful user registration."""
    response = await client.post(
        "/api/auth/register",
        json={"email": "newuser@example.com", "password": "Test1234"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert "id" in data
    assert data["subscription_tier"] == "free"
    assert data["audits_count"] == 0


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient, test_user: User):
    """Test registration with existing email."""
    response = await client.post(
        "/api/auth/register",
        json={"email": test_user.email, "password": "Test1234"},
    )

    assert response.status_code == 409
    assert "already registered" in response.json()["detail"]


@pytest.mark.asyncio
async def test_register_invalid_password(client: AsyncClient):
    """Test registration with invalid password."""
    # Too short
    response = await client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "short"},
    )
    assert response.status_code == 422

    # No digit
    response = await client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "NoDigitHere"},
    )
    assert response.status_code == 422

    # No uppercase
    response = await client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "nouppercase1"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, test_user: User):
    """Test successful login."""
    response = await client.post(
        "/api/auth/login",
        json={"email": test_user.email, "password": "Test1234"},
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient, test_user: User):
    """Test login with invalid credentials."""
    # Wrong password
    response = await client.post(
        "/api/auth/login",
        json={"email": test_user.email, "password": "WrongPassword1"},
    )
    assert response.status_code == 401

    # Non-existent user
    response = await client.post(
        "/api/auth/login",
        json={"email": "nonexistent@example.com", "password": "Test1234"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user(client: AsyncClient, test_user: User, auth_headers: dict):
    """Test getting current user info."""
    response = await client.get("/api/auth/me", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user.email
    assert data["id"] == str(test_user.id)


@pytest.mark.asyncio
async def test_get_current_user_unauthorized(client: AsyncClient):
    """Test getting current user without authentication."""
    response = await client.get("/api/auth/me")
    assert response.status_code == 403  # No auth header


@pytest.mark.asyncio
async def test_get_current_user_invalid_token(client: AsyncClient):
    """Test getting current user with invalid token."""
    response = await client.get(
        "/api/auth/me", headers={"Authorization": "Bearer invalid_token"}
    )
    assert response.status_code == 401

