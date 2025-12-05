"""
Tests for database models.
"""

import pytest
from datetime import datetime
from app.models import User, Audit, Competitor, AuditStatus, SubscriptionTier


@pytest.mark.asyncio
async def test_user_creation(db_session):
    """Test creating a user model."""
    user = User(
        email="model@example.com",
        password_hash="hashed_password",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    assert user.id is not None
    assert user.email == "model@example.com"
    assert user.subscription_tier == SubscriptionTier.FREE
    assert user.audits_count == 0
    assert user.created_at is not None
    assert user.updated_at is not None


@pytest.mark.asyncio
async def test_audit_creation(db_session, test_user):
    """Test creating an audit model."""
    audit = Audit(
        user_id=test_user.id,
        url="https://example.com",
        status=AuditStatus.PENDING,
    )
    db_session.add(audit)
    await db_session.commit()
    await db_session.refresh(audit)

    assert audit.id is not None
    assert audit.user_id == test_user.id
    assert audit.url == "https://example.com"
    assert audit.status == AuditStatus.PENDING
    assert audit.is_local_business is False
    assert audit.created_at is not None


@pytest.mark.asyncio
async def test_competitor_creation(db_session, test_user):
    """Test creating a competitor model."""
    # Create audit first
    audit = Audit(user_id=test_user.id, url="https://main.com")
    db_session.add(audit)
    await db_session.commit()
    await db_session.refresh(audit)

    # Create competitor
    competitor = Competitor(
        audit_id=audit.id,
        url="https://competitor.com",
    )
    db_session.add(competitor)
    await db_session.commit()
    await db_session.refresh(competitor)

    assert competitor.id is not None
    assert competitor.audit_id == audit.id
    assert competitor.url == "https://competitor.com"
    assert competitor.created_at is not None


@pytest.mark.asyncio
async def test_user_audit_relationship(db_session, test_user):
    """Test relationship between user and audits."""
    # Create audits for user
    audit1 = Audit(user_id=test_user.id, url="https://site1.com")
    audit2 = Audit(user_id=test_user.id, url="https://site2.com")
    db_session.add_all([audit1, audit2])
    await db_session.commit()

    # Refresh user to load relationship
    await db_session.refresh(test_user, ["audits"])

    assert len(test_user.audits) == 2
    assert all(isinstance(a, Audit) for a in test_user.audits)


@pytest.mark.asyncio
async def test_audit_competitor_relationship(db_session, test_user):
    """Test relationship between audit and competitors."""
    audit = Audit(user_id=test_user.id, url="https://main.com")
    db_session.add(audit)
    await db_session.commit()
    await db_session.refresh(audit)

    # Add competitors
    comp1 = Competitor(audit_id=audit.id, url="https://comp1.com")
    comp2 = Competitor(audit_id=audit.id, url="https://comp2.com")
    db_session.add_all([comp1, comp2])
    await db_session.commit()

    # Refresh audit to load relationship
    await db_session.refresh(audit, ["competitors"])

    assert len(audit.competitors) == 2
    assert all(isinstance(c, Competitor) for c in audit.competitors)


@pytest.mark.asyncio
async def test_audit_cascade_delete(db_session, test_user):
    """Test that deleting an audit cascades to competitors."""
    audit = Audit(user_id=test_user.id, url="https://main.com")
    db_session.add(audit)
    await db_session.commit()
    await db_session.refresh(audit)

    # Add competitor
    competitor = Competitor(audit_id=audit.id, url="https://comp.com")
    db_session.add(competitor)
    await db_session.commit()

    # Delete audit
    await db_session.delete(audit)
    await db_session.commit()

    # Competitor should be deleted too (cascade)
    from sqlalchemy import select
    result = await db_session.execute(
        select(Competitor).where(Competitor.id == competitor.id)
    )
    assert result.scalar_one_or_none() is None

