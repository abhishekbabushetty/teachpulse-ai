from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_sessions():
    return {"message": "list sessions mock"}
