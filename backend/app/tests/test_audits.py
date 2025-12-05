"""
Tests for audit endpoints.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import User, Audit, AuditStatus


@pytest.mark.asyncio
async def test_create_audit(client: AsyncClient, test_user: User, auth_headers: dict):
    """Test creating a new audit."""
    response = await client.post(
        "/api/audits",
        json={
            "url": "https://example.com",
            "competitors": ["https://competitor1.com", "https://competitor2.com"],
        },
        headers=auth_headers,
    )

    assert response.status_code == 201
    data = response.json()
    assert data["url"] == "https://example.com"
    assert data["status"] == "pending"
    assert len(data["competitors"]) == 2
    assert data["user_id"] == str(test_user.id)


@pytest.mark.asyncio
async def test_create_audit_unauthorized(client: AsyncClient):
    """Test creating audit without authentication."""
    response = await client.post(
        "/api/audits",
        json={"url": "https://example.com", "competitors": []},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_audit_invalid_url(client: AsyncClient, auth_headers: dict):
    """Test creating audit with invalid URL."""
    response = await client.post(
        "/api/audits",
        json={"url": "not-a-valid-url", "competitors": []},
        headers=auth_headers,
    )
    # Should still accept and normalize
    assert response.status_code == 201


@pytest.mark.asyncio
async def test_list_audits(
    client: AsyncClient,
    test_user: User,
    auth_headers: dict,
    db_session: AsyncSession,
):
    """Test listing user's audits."""
    # Create test audits
    audit1 = Audit(user_id=test_user.id, url="https://example1.com")
    audit2 = Audit(user_id=test_user.id, url="https://example2.com")
    db_session.add_all([audit1, audit2])
    await db_session.commit()

    response = await client.get("/api/audits", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2


@pytest.mark.asyncio
async def test_list_audits_pagination(
    client: AsyncClient,
    test_user: User,
    auth_headers: dict,
    db_session: AsyncSession,
):
    """Test audit list pagination."""
    # Create multiple audits
    for i in range(5):
        audit = Audit(user_id=test_user.id, url=f"https://example{i}.com")
        db_session.add(audit)
    await db_session.commit()

    response = await client.get(
        "/api/audits?page=1&page_size=2", headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 5
    assert len(data["items"]) == 2
    assert data["page"] == 1
    assert data["page_size"] == 2


@pytest.mark.asyncio
async def test_get_audit(
    client: AsyncClient,
    test_user: User,
    auth_headers: dict,
    db_session: AsyncSession,
):
    """Test getting a specific audit."""
    audit = Audit(
        user_id=test_user.id,
        url="https://example.com",
        status=AuditStatus.COMPLETED,
        overall_score=85.5,
    )
    db_session.add(audit)
    await db_session.commit()
    await db_session.refresh(audit)

    response = await client.get(f"/api/audits/{audit.id}", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(audit.id)
    assert data["url"] == "https://example.com"
    assert data["overall_score"] == 85.5


@pytest.mark.asyncio
async def test_get_audit_not_found(client: AsyncClient, auth_headers: dict):
    """Test getting non-existent audit."""
    import uuid

    fake_id = uuid.uuid4()
    response = await client.get(f"/api/audits/{fake_id}", headers=auth_headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_audit_status(
    client: AsyncClient,
    test_user: User,
    auth_headers: dict,
    db_session: AsyncSession,
):
    """Test getting audit status."""
    audit = Audit(user_id=test_user.id, url="https://example.com")
    db_session.add(audit)
    await db_session.commit()
    await db_session.refresh(audit)

    response = await client.get(
        f"/api/audits/{audit.id}/status", headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "pending"
    assert data["id"] == str(audit.id)


@pytest.mark.asyncio
async def test_delete_audit(
    client: AsyncClient,
    test_user: User,
    auth_headers: dict,
    db_session: AsyncSession,
):
    """Test deleting an audit."""
    audit = Audit(user_id=test_user.id, url="https://example.com")
    db_session.add(audit)
    await db_session.commit()
    await db_session.refresh(audit)

    response = await client.delete(f"/api/audits/{audit.id}", headers=auth_headers)
    assert response.status_code == 204

    # Verify audit is deleted
    response = await client.get(f"/api/audits/{audit.id}", headers=auth_headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_audit_ownership(
    client: AsyncClient,
    test_user: User,
    auth_headers: dict,
    db_session: AsyncSession,
):
    """Test that users can only access their own audits."""
    # Create another user
    other_user = User(email="other@example.com", password_hash="hash")
    db_session.add(other_user)
    await db_session.commit()

    # Create audit for other user
    audit = Audit(user_id=other_user.id, url="https://example.com")
    db_session.add(audit)
    await db_session.commit()
    await db_session.refresh(audit)

    # Try to access with test_user credentials
    response = await client.get(f"/api/audits/{audit.id}", headers=auth_headers)
    assert response.status_code == 403

