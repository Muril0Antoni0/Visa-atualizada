import sys
import os
from pathlib import Path
from datetime import datetime
from typing import Optional

# Adiciona o diretório raiz (visa-ia) ao sys.path para os imports funcionarem
ROOT_DIR = Path(__file__).resolve().parents[2]
sys.path.append(str(ROOT_DIR))

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session
from pydantic import BaseModel
import json

from adapters.gateways.tesseract_ocr_gateway import TesseractOCRGateway
from use_cases.analisar_documento import AnalisarDocumentoUseCase
from frameworks.ia.bert_ia_service import BertIAService

FRONTEND_DIR = Path(__file__).resolve().parents[2] / "frontend"
DATABASE_URL = "sqlite:///./visa_digital.db"

# Configuração do banco de dados
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ==================== MODELOS DE BANCO DE DADOS ====================
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)  # 'empresa', 'analista'
    created_at = Column(DateTime, default=datetime.utcnow)
    
    processes = relationship("Process", back_populates="user")

class Process(Base):
    __tablename__ = "processes"
    
    id = Column(Integer, primary_key=True, index=True)
    process_number = Column(String(20), unique=True, nullable=False)
    company_name = Column(String(150), nullable=False)
    cnpj = Column(String(18), nullable=False)
    establishment_type = Column(String(100), nullable=False)
    status = Column(String(50), default="Pendente")
    risk_level = Column(String(50), nullable=True)
    risk_score = Column(Integer, nullable=True)
    completion_percentage = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    user = relationship("User", back_populates="processes")
    documents = relationship("Document", back_populates="process")

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    file_path = Column(String(255), nullable=False)
    status = Column(String(50), default="Aguardando Análise")
    process_id = Column(Integer, ForeignKey("processes.id"), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    process = relationship("Process", back_populates="documents")

# Criar tabelas
Base.metadata.create_all(bind=engine)

# ==================== SCHEMAS PYDANTIC ====================
class UserLogin(BaseModel):
    email: str
    password: str
    role: str

class ProcessResponse(BaseModel):
    id: int
    process_number: str
    company_name: str
    status: str
    risk_level: Optional[str]
    risk_score: Optional[int]
    completion_percentage: int

class DocumentoResponse(BaseModel):
    nome: str
    conteudo: str
    confianca: float

# ==================== DEPENDENCY ====================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==================== APLICAÇÃO FASTAPI ====================
app = FastAPI(title="VISA Digital")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializa a IA uma vez só (fora da rota) para não lentificar o upload
ia_service = BertIAService()

# ==================== ROTAS DE PÁGINAS ====================

@app.get("/", response_class=HTMLResponse)
async def pagina_login():
    """Página de login (padrão)"""
    with open(FRONTEND_DIR / "login_static.html", "r", encoding="utf-8") as f:
        return f.read()

@app.get("/login", response_class=HTMLResponse)
async def login_page():
    """Página de login"""
    with open(FRONTEND_DIR / "login_static.html", "r", encoding="utf-8") as f:
        return f.read()

@app.get("/portal", response_class=HTMLResponse)
async def portal_page():
    """Página do portal da empresa"""
    with open(FRONTEND_DIR / "portal_static.html", "r", encoding="utf-8") as f:
        return f.read()

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard_page():
    """Página do dashboard do analista"""
    with open(FRONTEND_DIR / "dashboard_static.html", "r", encoding="utf-8") as f:
        return f.read()

# ==================== ROTAS DE ARQUIVOS ESTÁTICOS ====================

@app.get("/style/{arquivo}")
async def servir_css(arquivo: str):
    """Serve arquivos CSS"""
    caminho = FRONTEND_DIR / "style" / arquivo
    if caminho.exists():
        return FileResponse(caminho, media_type="text/css")
    raise HTTPException(status_code=404)

@app.get("/js/{arquivo}")
async def servir_js(arquivo: str):
    """Serve arquivos JavaScript"""
    caminho = FRONTEND_DIR / "js" / arquivo
    if caminho.exists():
        return FileResponse(caminho, media_type="application/javascript")
    raise HTTPException(status_code=404)

# ==================== ROTAS DE API ====================

@app.post("/api/auth/login")
async def api_login(credentials: UserLogin, db: Session = Depends(get_db)):
    """API de autenticação"""
    # Busca o usuário no banco de dados
    user = db.query(User).filter(
        User.email == credentials.email,
        User.role == credentials.role
    ).first()
    
    if not user:
        # Cria um usuário de teste se não existir
        user = User(
            name=f"User {credentials.role}",
            email=credentials.email,
            password=credentials.password,  # Em produção, hash a senha
            role=credentials.role
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "token": f"token_{user.id}"  # Implementar JWT em produção
    }

@app.get("/api/processos")
async def api_processos(db: Session = Depends(get_db)):
    """API para obter todos os processos (mock para o dashboard)"""
    # Retorna dados de exemplo para o dashboard
    processos_mock = [
        {"nome": "Clínica Estética Bella Vita", "id": "VISA-R2T5W9", "status": "Diligência", "risco": "Crítico (94)", "tipo": "Estético", "data": "27/04/2026", "completude": 37, "risco_class": "critical"},
        {"nome": "Restaurante Sabor do Norte", "id": "VISA-M4XBK2", "status": "Pendente", "risco": "Risco Alto (82)", "tipo": "Alimentício", "data": "27/04/2026", "completude": 62, "risco_class": "high"},
        {"nome": "Hospital São Lucas", "id": "VISA-F3G7B2", "status": "Em Análise", "risco": "Risco Alto (78)", "tipo": "Saúde", "data": "27/04/2026", "completude": 100, "risco_class": "high"},
        {"nome": "Farmácia Vida & Saúde", "id": "VISA-N7P3Q1", "status": "Em Análise", "risco": "Risco Médio (45)", "tipo": "Farmacêutico", "data": "27/04/2026", "completude": 100, "risco_class": "medium"},
        {"nome": "Pet Shop Animal Care", "id": "VISA-J6H4D8", "status": "Pendente", "risco": "Risco Médio (55)", "tipo": "Veterinário", "data": "27/04/2026", "completude": 100, "risco_class": "medium"},
        {"nome": "Padaria Pão de Ouro", "id": "VISA-K8L1M5", "status": "Aprovado", "risco": "Risco Baixo (12)", "tipo": "Alimentício", "data": "27/04/2026", "completude": 100, "risco_class": "low"}
    ]
    return {"processos": processos_mock}

@app.post("/api/documentos/analisar")
async def analisar_documento(file: UploadFile = File(...)):
    """API para análise de documentos com OCR e IA"""
    try:
        ocr_gtw = TesseractOCRGateway()
        use_case = AnalisarDocumentoUseCase(ocr_gtw, ia_service=ia_service)
        
        conteudo_arquivo = await file.read()
        resultado = use_case.executar(conteudo_arquivo, file.filename)
        
        return {
            "sucesso": True,
            "arquivo": file.filename,
            "resultado": resultado
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/processos/criar")
async def criar_processo(
    razao_social: str = Form(...),
    cnpj: str = Form(...),
    tipo_estabelecimento: str = Form(...),
    db: Session = Depends(get_db)
):
    """API para criar um novo processo"""
    try:
        # Gera número do processo
        processo_number = f"VISA-{os.urandom(4).hex().upper()[:8]}"
        
        # Cria o novo processo (associado ao usuário 1 por padrão)
        novo_processo = Process(
            process_number=processo_number,
            company_name=razao_social,
            cnpj=cnpj,
            establishment_type=tipo_estabelecimento,
            user_id=1
        )
        
        db.add(novo_processo)
        db.commit()
        db.refresh(novo_processo)
        
        return {
            "sucesso": True,
            "processo_id": novo_processo.id,
            "processo_numero": processo_number
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

