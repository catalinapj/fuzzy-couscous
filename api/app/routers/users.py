from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app import models, schemas
from app.core.security import get_current_user
from app.database import get_db

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=schemas.UserResponse)
def read_me(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.get("/", response_model=schemas.PaginatedUsersResponse)
def list_users(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    total = db.query(models.User).count()
    offset = (page - 1) * per_page
    users = db.query(models.User).offset(offset).limit(per_page).all()
    return {
        "users": users,
        "page": page,
        "per_page": per_page,
        "total": total,
    }
