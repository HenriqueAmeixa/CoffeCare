from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
import models, database
from routers.auth import get_current_user

router = APIRouter(tags=["History"], prefix="/history")

@router.get("/")
def get_user_history(current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    consultations = db.query(models.Consultation).filter(
        models.Consultation.user_id == current_user.id
    ).order_by(models.Consultation.created_at.desc()).all()
    
    return consultations
