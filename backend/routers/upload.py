from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
import os
import shutil
import uuid
from routers.auth import get_current_user
import models

router = APIRouter(tags=["Upload"], prefix="/upload")

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/")
async def upload_image(file: UploadFile = File(...), current_user: models.User = Depends(get_current_user)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="O arquivo deve ser uma imagem.")
    
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Futuro: Aqui poderá chamar o modelo EfficientNet diretamente
    # ou salvar no banco de dados
    
    return {"filename": unique_filename, "url": f"/uploads/{unique_filename}"}
