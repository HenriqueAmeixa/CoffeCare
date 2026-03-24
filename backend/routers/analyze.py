from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
import os
import json
import models
from database import get_db

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services import ai_service

router = APIRouter(tags=["Analysis"])

@router.websocket("/ws/analyze")
async def websocket_analyze(websocket: WebSocket, db: Session = Depends(get_db)):
    await websocket.accept()
    try:
        data_str = await websocket.receive_text()
        data = json.loads(data_str)
        filename = data.get("filename")
        user_id = data.get("user_id") # Por token na query string seria mais seguro
        
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
