# AI-Advisor

# Table of Contents
1. [Frontend Setup](#frontend-setup)
2. [Backend Setup](#backend-setup)

## Frontend Setup
### Prerequisites
- Node.js 18+ (LTS version recommended)
- npm 9+
### Installation and Setup
1. Install dependencies
```
# Navigate to frontend directory
cd frontend

# Clean install dependencies (recommended for first install)
npm clean-install

# Or regular install
npm install
```
2. Start development server
```
npm run dev
```

## Backend Setup
### Prerequisites
- Docker
- Python 3.11 >=
- Go >= 1.24

### Run Everything
```bash
cd backend
docker compose up --build
```

| **Service** | **Port** | **Language** |
|:-----------:|:--------:|:------------:|
| api-gateway |   8080   |      Go      |
|     rag     |   8081   |    Python    |
|   planner   |   8082   |    Python    |
|     auth    |   8083   |      Go      |

### Stop & Clean
```bash
docker compose down
docker compose down -v   #if you want to remove all data volumes
```
### Local Dev
#### Go Service
```bash
cd backend/services/<selected-service>
go mod tidy
go run ./cmd
```

#### Python Service
```bash
cd backend/services/<selected-service>
python -m venv .venv

# Linux/Mac
source .venv/bin/activate 
# Windows: 
.\.venv\Scripts\Activate

pip install -r requirements.txt
uvicorn app.server:app --reload --port <service-port>
```
