#!/usr/bin/env python3
"""
Script de inicialização para o servidor VISA Digital.

Uso:
    python run.py

O servidor será iniciado em http://localhost:8000
"""

import sys
import subprocess
from pathlib import Path

# Detecta o diretório raiz do projeto
PROJECT_ROOT = Path(__file__).parent.absolute()
FRAMEWORKS_API = PROJECT_ROOT / "frameworks" / "api"

def main():
    print("=" * 60)
    print("VISA Digital - Sistema de Vigilância Sanitária")
    print("=" * 60)
    print()
    
    # Verifica se está no diretório correto
    if not (FRAMEWORKS_API / "main.py").exists():
        print("❌ Erro: Não foi encontrado frameworks/api/main.py")
        print(f"   Certifique-se de que está na pasta correta: {PROJECT_ROOT}")
        sys.exit(1)
    
    print(f"📁 Diretório do projeto: {PROJECT_ROOT}")
    print()
    
    # Tenta importar as dependências necessárias
    try:
        import fastapi
        import uvicorn
        import sqlalchemy
        print("✅ Dependências encontradas")
    except ImportError as e:
        print(f"❌ Erro: Falta instalar dependências")
        print(f"   Execute: pip install -r requirements.txt")
        print(f"   Erro específico: {e}")
        sys.exit(1)
    
    print()
    print("🚀 Iniciando servidor FastAPI...")
    print("   URL: http://localhost:8000")
    print("   Documentação: http://localhost:8000/docs")
    print()
    print("Pressione Ctrl+C para parar o servidor")
    print("=" * 60)
    print()
    
    # Inicia o servidor
    try:
        subprocess.run(
            [
                sys.executable,
                "-m",
                "uvicorn",
                "frameworks.api.main:app",
                "--reload",
                "--port",
                "8000",
                "--host",
                "0.0.0.0"
            ],
            cwd=PROJECT_ROOT,
            check=False
        )
    except KeyboardInterrupt:
        print()
        print("=" * 60)
        print("✋ Servidor parado pelo usuário")
        print("=" * 60)
        sys.exit(0)

if __name__ == "__main__":
    main()
