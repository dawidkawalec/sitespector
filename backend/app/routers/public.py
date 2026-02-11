"""
Public router for contact form and newsletter subscriptions.
"""

from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import ContactSubmission, NewsletterSubscriber
from app.schemas import ContactForm, NewsletterForm, ErrorResponse
import logging

router = APIRouter(tags=["Public"])
logger = logging.getLogger(__name__)


@router.post("/contact", status_code=status.HTTP_201_CREATED)
async def submit_contact(
    body: ContactForm,
    db: AsyncSession = Depends(get_db)
):
    """
    Submit a public contact form.
    """
    try:
        new_submission = ContactSubmission(
            name=body.name,
            email=body.email,
            subject=body.subject,
            message=body.message
        )
        db.add(new_submission)
        await db.commit()
        await db.refresh(new_submission)
        
        logger.info(f"New contact submission from {body.email}")
        
        return {"message": "Dziękujemy! Odpowiemy w ciągu 24 godzin."}
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to save contact submission: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Nie udało się zapisać wiadomości. Spróbuj ponownie później."
        )


@router.post("/newsletter", status_code=status.HTTP_201_CREATED)
async def subscribe_newsletter(
    body: NewsletterForm,
    db: AsyncSession = Depends(get_db)
):
    """
    Subscribe to the newsletter.
    """
    try:
        # Check if already subscribed
        result = await db.execute(
            select(NewsletterSubscriber).where(NewsletterSubscriber.email == body.email)
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            if existing.is_active:
                return {"message": "Ten email jest już zapisany do newslettera."}
            else:
                existing.is_active = True
                await db.commit()
                return {"message": "Dziękujemy za ponowny zapis!"}
        
        new_subscriber = NewsletterSubscriber(email=body.email)
        db.add(new_subscriber)
        await db.commit()
        
        logger.info(f"New newsletter subscriber: {body.email}")
        
        return {"message": "Dziękujemy za zapis! Będziemy Cię informować o nowościach."}
    except Exception as e:
        await db.rollback()
        logger.error(f"Newsletter subscription failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Nie udało się zapisać do newslettera. Spróbuj ponownie później."
        )
