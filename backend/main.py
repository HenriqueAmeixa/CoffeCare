from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import models
from database import engine
from routers import auth, upload, analyze, history

models.Base.metadata.create_all(bind=engine)

import os
os.makedirs("uploads", exist_ok=True)

app = FastAPI(title="CoffeCare API")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(upload.router)
app.include_router(analyze.router)
app.include_router(history.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to CoffeCare API"}
