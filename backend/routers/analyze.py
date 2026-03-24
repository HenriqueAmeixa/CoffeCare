from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.orm import Session
import os
import json
import models
from database import get_db
import auth as auth_utils

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services import ai_service

router = APIRouter(tags=["Analysis"])

@router.websocket("/ws/analyze")
async def websocket_analyze(
    websocket: WebSocket,
    token: str = Query(default=None),
    db: Session = Depends(get_db)
):
    await websocket.accept()
    try:
        # Decodificar user_id a partir do JWT enviado como query param ?token=...
        user_id = None
        if token:
            try:
                payload = auth_utils.jwt.decode(token, auth_utils.SECRET_KEY, algorithms=[auth_utils.ALGORITHM])
                email = payload.get("sub")
                if email:
                    user = db.query(models.User).filter(models.User.email == email).first()
                    if user:
                        user_id = user.id
            except Exception:
                pass  # Token inválido, salva como user_id=None

        data_str = await websocket.receive_text()
        data = json.loads(data_str)
        filename = data.get("filename")
        
        file_path = os.path.join("uploads", filename)
        if not os.path.exists(file_path):
            await websocket.send_json({"status": "error", "message": "File not found"})
            await websocket.close()
            return
            
        await websocket.send_json({"status": "processing", "message": "Analisando a imagem..."})
        
        # 1. Visão Computacional
        cv_result = await ai_service.predict_disease(file_path)
        disease = cv_result["disease"]
        confidence = cv_result["confidence"]
        
        await websocket.send_json({
            "status": "cv_done", 
            "message": f"Doença identificada: {disease} ({(confidence*100):.1f}%)",
            "disease": disease,
            "confidence": confidence
        })
        
        # 2. LLM Tratamento
        await websocket.send_json({"status": "generating", "message": "Elaborando plano de tratamento..."})
        treatment = await ai_service.generate_treatment(disease)
        
        try:
            new_consultation = models.Consultation(
                user_id=user_id,
                image_url=f"/uploads/{filename}",
                disease=disease,
                confidence=confidence,
                treatment=treatment
            )
            db.add(new_consultation)
            db.commit()
        except Exception as e:
            print(f"Erro ao salvar no BD: {e}")
        
        await websocket.send_json({
            "status": "done",
            "message": "Análise concluída.",
            "disease": disease,
            "confidence": confidence,
            "treatment": treatment
        })
        
        await websocket.close()
        
    except WebSocketDisconnect:
        print("Cliente desconectou")
    except Exception as e:
        await websocket.send_json({"status": "error", "message": str(e)})
        if not websocket.client_state.name == "DISCONNECTED":
            await websocket.close()
