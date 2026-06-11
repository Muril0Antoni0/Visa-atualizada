# visa-ia — VISA Digital (Vigilância Sanitária)

Plataforma integrada de análise de documentos para vigilância sanitária com suporte a OCR (Tesseract) e inteligência artificial (BERT).

## Arquitetura

O projeto utiliza uma arquitetura modularizada com:

- **Frontend**: Interface web HTML/CSS/JavaScript
- **Backend**: API FastAPI com suporte a banco de dados
- **OCR**: Tesseract para extração de texto
- **IA**: BERT para análise e classificação de documentos

## Instalação

### Pré-requisitos

- Python 3.8+
- Tesseract OCR instalado no sistema
- SQLite (padrão) ou MySQL

### Passo 1: Instalar dependências

```bash
pip install -r requirements.txt
```

### Passo 2: Configurar variáveis de ambiente (opcional)

Se deseja usar MySQL em vez de SQLite, modifique a linha em `frameworks/api/main.py`:

```python
DATABASE_URL = "mysql+pymysql://usuario:senha@localhost/visa_digital"
```

## Execução

### Iniciar o servidor

```bash
# Navegar até a pasta do projeto
cd projeto\ extensao/visa-ia

# Rodar o servidor FastAPI
python -m uvicorn frameworks.api.main:app --reload --port 8000
```

O servidor estará disponível em: `http://localhost:8000`

### Acessar a aplicação

- **Login**: http://localhost:8000/login
- **Portal (Empresa)**: http://localhost:8000/portal
- **Dashboard (Analista)**: http://localhost:8000/dashboard

## Endpoints da API

### Autenticação

- `POST /api/auth/login` - Login de usuário
  - Parâmetros: `email`, `password`, `role` (empresa/analista)

### Processos

- `GET /api/processos` - Listar todos os processos
- `POST /api/processos/criar` - Criar novo processo
  - Parâmetros: `razao_social`, `cnpj`, `tipo_estabelecimento`

### Documentos

- `POST /api/documentos/analisar` - Analisar documento com OCR e IA
  - Parâmetros: `file` (arquivo para upload)

## Estrutura de Pastas

```
visa-ia/
├── adapters/           # Adaptadores e controladores
│   ├── controllers/    # Controladores
│   ├── gateways/       # Integrações externas (OCR, etc)
│   └── repositories/   # Acesso a dados
├── domain/             # Entidades e interfaces do domínio
│   ├── entities/       # Entidades de negócio
│   └── interfaces/     # Contratos/interfaces
├── frameworks/         # Frameworks e dependências
│   ├── api/            # FastAPI
│   └── ia/             # Serviços de IA
├── frontend/           # Interface web
│   ├── js/             # JavaScript
│   ├── style/          # CSS
│   ├── app.py          # App Flask (depreciado, use FastAPI)
│   └── models.py       # Modelos SQLAlchemy
├── use_cases/          # Casos de uso
└── requirements.txt    # Dependências Python
```

## Fluxo de Uso

### 1. Empresa (Portal)

1. Acessa `/portal` (ou redireciona via `/login` com role=empresa)
2. Preenche dados da empresa (razão social, CNPJ, tipo)
3. Faz upload de documentos obrigatórios
4. Sistema executa OCR e análise com IA
5. Documentos são classificados como "Conforme" ou "Divergente"
6. Envia processo para análise

### 2. Analista (Dashboard)

1. Acessa `/dashboard` (ou redireciona via `/login` com role=analista)
2. Visualiza lista de processos recebidos
3. Abre processo para revisar documentos
4. Visualiza texto extraído (OCR) e análise da IA
5. Aprova ou rejeita documentos/processo

## Banco de Dados

### Tabelas

- **users**: Usuários (empresa/analista)
- **processes**: Processos de vigilância sanitária
- **documents**: Documentos enviados

O banco é automaticamente criado na primeira execução.

## Exemplos de Credenciais de Teste

### Empresa
- Email: empresa@example.com
- Senha: senha123
- Role: empresa

### Analista
- Email: analista@example.com
- Senha: senha123
- Role: analista

## Troubleshooting

### Erro: "ModuleNotFoundError"

Certifique-se de estar na pasta correta e que as dependências foram instaladas:

```bash
cd projeto\ extensao/visa-ia
pip install -r requirements.txt
```

### Erro: "Tesseract não foi encontrado"

Instale Tesseract OCR:
- **Windows**: Download em https://github.com/UB-Mannheim/tesseract/wiki
- **Linux**: `sudo apt-get install tesseract-ocr`
- **macOS**: `brew install tesseract`

### Erro de banco de dados

O SQLite é usado por padrão e cria o arquivo `visa_digital.db` automaticamente. Se houver problemas, delete o arquivo e reinicie o servidor.

## Próximas Melhorias

- [ ] Implementar autenticação JWT real
- [ ] Adicionar upload de arquivos em S3/Azure Blob Storage
- [ ] Melhorar performance do BERT com GPU
- [ ] Adicionar testes automatizados
- [ ] Documentação de API com Swagger
- [ ] Sistema de fila para processamento assíncrono de documentos

