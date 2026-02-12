# GigaConnect

AI-Powered Global Freelance, Gig & Talent Marketplace

## Project Structure

```
GigaConnect/
├── web/                    # Next.js 14 Web Application
├── mobile/                 # Flutter Mobile Application
├── backend/                # NestJS Microservices Backend
├── ai-service/             # Python FastAPI AI Services
├── docker-compose.yml      # Development infrastructure
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 18+
- Flutter 3.x
- Python 3.11+
- Docker & Docker Compose

### 1. Start Infrastructure
```bash
docker-compose up -d
```

### 2. Start Backend
```bash
cd backend
npm install
npx prisma migrate dev
npm run start:dev
```

### 3. Start Web App
```bash
cd web
npm install
npm run dev
```

### 4. Start Mobile App
```bash
cd mobile
flutter pub get
flutter run
```

### 5. Start AI Service
```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| Web App | 3000 | Next.js frontend |
| Backend API | 4000 | NestJS API |
| AI Service | 8000 | Python AI engine |
| PostgreSQL | 5432 | Primary database |
| Redis | 6379 | Cache & sessions |
| Qdrant | 6333 | Vector database |
| Elasticsearch | 9200 | Search engine |
| RabbitMQ | 5672 | Message queue |
| MinIO | 9000 | Object storage |

## Tech Stack

- **Web:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Mobile:** Flutter, Riverpod, GoRouter
- **Backend:** NestJS, Prisma, PostgreSQL
- **AI:** FastAPI, Sentence Transformers, Qdrant
- **Payments:** Stripe Connect, Razorpay
- **Real-time:** Socket.io, WebSockets

## License

MIT
