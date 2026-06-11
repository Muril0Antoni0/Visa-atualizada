# Guia de Integração Frontend + Backend

## O que foi integrado?

Este documento descreve como o frontend e backend foram integrados na aplicação VISA Digital.

## Arquitetura Integrada

```
┌─────────────────────────────────────────┐
│      FastAPI (frameworks/api/main.py)   │
│  ┌─────────────────────────────────────┐│
│  │ Rotas de Páginas                    ││
│  │ - GET / (redirect para /login)      ││
│  │ - GET /login -> login_static.html   ││
│  │ - GET /portal -> portal_static.html ││
│  │ - GET /dashboard -> dashboard_...html││
│  └─────────────────────────────────────┘│
│  ┌─────────────────────────────────────┐│
│  │ Rotas de API                        ││
│  │ - POST /api/auth/login              ││
│  │ - GET /api/processos                ││
│  │ - POST /api/processos/criar         ││
│  │ - POST /api/documentos/analisar     ││
│  └─────────────────────────────────────┘│
│  ┌─────────────────────────────────────┐│
│  │ Rotas de Arquivos Estáticos         ││
│  │ - GET /style/{arquivo}.css          ││
│  │ - GET /js/{arquivo}.js              ││
│  └─────────────────────────────────────┘│
│  ┌─────────────────────────────────────┐│
│  │ Banco de Dados                      ││
│  │ - SQLAlchemy ORM                    ││
│  │ - Tabelas: users, processes, docs   ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
            ↑              ↑              ↑
            │              │              │
    ┌──────┴───┐   ┌──────┴───┐   ┌──────┴───┐
    │ Browser  │   │   API    │   │ Database │
    │ HTML/JS  │   │ Requests │   │  SQLite  │
    └──────────┘   └──────────┘   └──────────┘
```

## Mudanças Principais

### 1. Backend Consolidado (FastAPI)

O arquivo `frameworks/api/main.py` agora contém:

- **Banco de Dados Integrado**: SQLAlchemy com tabelas de usuários, processos e documentos
- **Rotas de Páginas**: Servidor estático que entrega os arquivos HTML
- **Rotas de API**: Endpoints para operações de negócio
- **CORS Habilitado**: Permite requisições de qualquer origem

### 2. Frontend Atualizado

#### Alterações nos HTMLs

Os arquivos estáticos foram atualizados para usar caminhos absolutos:

```html
<!-- Antes -->
<link rel="stylesheet" href="./style/global.css">
<script src="./js/login.js"></script>

<!-- Depois -->
<link rel="stylesheet" href="/style/global.css">
<script src="/js/login.js"></script>
```

Os links de navegação foram atualizados:

```html
<!-- Antes -->
<a href="login_static.html">Login</a>
<a href="portal_static.html">Portal</a>
<a href="dashboard_static.html">Dashboard</a>

<!-- Depois -->
<a href="/login">Login</a>
<a href="/portal">Portal</a>
<a href="/dashboard">Dashboard</a>
```

#### Alterações nos JavaScripts

**login.js**: Adiciona suporte a autenticação via API

```javascript
// Antes: redirecionava diretamente
window.location.href = role === 'servidor' ? 'dashboard_static.html' : 'portal_static.html';

// Depois: faz requisição para API e armazena token
async function loginWithAPI(email, password, role) {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
    });
    const data = await response.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data));
    window.location.href = role === 'analista' ? '/dashboard' : '/portal';
}
```

**portal.js**: Atualiza URL de upload e envio de processo

```javascript
// Antes: localhost relativo
const response = await fetch('/documentos/analisar', {...});

// Depois: URL da API
const response = await fetch('/api/documentos/analisar', {...});

// Envia processo para API
const responseProcesso = await fetch('/api/processos/criar', {
    method: 'POST',
    body: formData
});
```

**dashboard.js**: Carrega processos da API

```javascript
// Antes: apenas localStorage
const salvos = localStorage.getItem('visa_processos');
processos = salvos ? JSON.parse(salvos) : defaultProcessos;

// Depois: tenta API primeiro, fallback para localStorage
async function inicializarProcessos() {
    try {
        const response = await fetch('/api/processos');
        if (response.ok) {
            const data = await response.json();
            processos = data.processos || [];
        }
    } catch (error) {
        // Fallback para localStorage
    }
}
```

### 3. Endpoints da API

#### POST /api/auth/login
```json
{
    "email": "empresa@example.com",
    "password": "senha123",
    "role": "empresa"
}
```

Resposta:
```json
{
    "id": 1,
    "name": "Empresa XYZ",
    "email": "empresa@example.com",
    "role": "empresa",
    "token": "token_1"
}
```

#### GET /api/processos
Retorna lista de processos com todos os dados mockados/reais.

#### POST /api/processos/criar
```
FormData:
- razao_social: "Empresa ABC"
- cnpj: "12.345.678/0001-90"
- tipo_estabelecimento: "Alimentício"
```

Resposta:
```json
{
    "sucesso": true,
    "processo_id": 1,
    "processo_numero": "VISA-ABCD1234"
}
```

#### POST /api/documentos/analisar
```
FormData:
- file: <arquivo PDF/imagem>
```

Resposta:
```json
{
    "sucesso": true,
    "arquivo": "documento.pdf",
    "resultado": {
        "texto": "...",
        "confianca": 0.95
    }
}
```

## Fluxo de Dados

### 1. Usuário Faz Login

```
HTML Form 
  ↓
login.js valida e chama fetch('/api/auth/login')
  ↓
FastAPI /api/auth/login
  ↓
Busca/cria usuário no banco
  ↓
Retorna token + dados do usuário
  ↓
login.js armazena no localStorage
  ↓
Redireciona para /portal ou /dashboard
```

### 2. Empresa Envia Documentos

```
HTML Form (portal)
  ↓
portal.js chama fetch('/api/documentos/analisar')
  ↓
FastAPI /api/documentos/analisar
  ↓
Tesseract OCR extrai texto
  ↓
BERT IA classifica (Conforme/Divergente)
  ↓
Retorna resultado
  ↓
portal.js exibe feedback visual
  ↓
Usuário clica "Enviar"
  ↓
portal.js chama fetch('/api/processos/criar')
  ↓
FastAPI cria processo no banco
  ↓
Redireciona para /dashboard
```

### 3. Analista Revisa Processos

```
dashboard.js carrega fetch('/api/processos')
  ↓
FastAPI retorna lista de processos
  ↓
dashboard.js renderiza tabela
  ↓
Usuário clica em um processo
  ↓
Modal abre com detalhes
  ↓
Mostra OCR + análise da IA
  ↓
Analista aprova/rejeita
```

## Banco de Dados

### Tabelas Criadas Automaticamente

**users**
- id (PK)
- name
- email (UNIQUE)
- password
- role (empresa/analista)
- created_at

**processes**
- id (PK)
- process_number (UNIQUE)
- company_name
- cnpj
- establishment_type
- status (Pendente, Em Análise, Diligência, Aprovado)
- risk_level
- risk_score
- completion_percentage
- created_at
- user_id (FK)

**documents**
- id (PK)
- name
- file_path
- status
- process_id (FK)
- uploaded_at

## Próximas Etapas para Melhorar

1. **Autenticação Real**
   - Implementar JWT tokens
   - Hash de senhas com bcrypt
   - Refresh tokens

2. **Persistência de Arquivos**
   - Salvar uploads em pasta local ou S3
   - Gerar URLs para download

3. **Melhor Performance**
   - Fila de processamento (Celery/RabbitMQ)
   - Cache de respostas
   - Indexação de banco de dados

4. **Segurança**
   - HTTPS/SSL
   - Rate limiting
   - Validação mais rigorosa de entrada
   - CSRF protection

5. **Testes**
   - Testes unitários
   - Testes de integração
   - Testes de carga

6. **Documentação**
   - Swagger/OpenAPI
   - Guias de uso para empresas e analistas
   - Tutorial de configuração

## Troubleshooting

### Erro 404 em CSS/JS

**Causa**: Caminho errado nos HTMLs

**Solução**: Verificar se os HTMLs usam caminhos absolutos (`/style/...`, `/js/...`)

### Erro 422 ao fazer POST

**Causa**: Dados malformados ou campos faltando

**Solução**: Verificar os formatos esperados nos endpoints da API

### Banco de dados vazio

**Causa**: Primeira execução não criou tabelas

**Solução**: FastAPI cria automaticamente, verifique se não há erro no startup

### Login não funciona

**Causa**: 
1. Campo `role` incorreto
2. CORS bloqueando requisição

**Solução**: 
1. Use "empresa" ou "analista", não "servidor"
2. Verifique console do navegador para erros de CORS

## Referências

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [SQLAlchemy](https://www.sqlalchemy.org/)
- [Uvicorn](https://www.uvicorn.org/)
- [Tesseract OCR](https://github.com/UB-Mannheim/tesseract/wiki)
- [Transformers (BERT)](https://huggingface.co/transformers/)
