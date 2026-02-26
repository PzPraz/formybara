# Form Builder

Aplikasi Form Builder seperti Google Forms dengan React + Next.js + Prisma.

## 🚀 Tech Stack

- **Frontend**: React 19 + Vite 8
- **Backend**: Next.js 16 + Prisma 7
- **Database**: PostgreSQL

## 📦 Prerequisites

- Node.js >= 18
- PostgreSQL >= 14

## ⚙️ Setup

### 1. Database Setup

Buat database PostgreSQL:
```sql
CREATE DATABASE ristek_dbs;
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Setup environment variables
# Buat file .env dengan isi:
DATABASE_URL="postgresql://username:password@localhost:5432/ristek_dbs"
JWT_SECRET="your-secret-key-here"

# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# Start server (port 3001)
npm run dev
```

### 3. Frontend Setup

Terminal baru:
```bash
cd frontend

# Install dependencies
npm install

# Start server (port 3000)
npm run dev
```

### 4. Akses Aplikasi

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

---
