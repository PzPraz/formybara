# Formybara — Form Builder

Aplikasi Form Builder seperti Google Forms. Full-stack web app dengan fitur autentikasi, CRUD form, manajemen pertanyaan (9 tipe), submit response, statistik response dengan chart, drag-and-drop reorder, multi-page form, dan responsive design.

**Live Demo:** [formybara.vercel.app](https://formybara.vercel.app) | **API:** [formybara-api.vercel.app](https://formybara-api.vercel.app)

## Tech Stack

- **Frontend**: React 19 + Vite 8 + React Router 6
- **Backend**: Next.js 16 (API Routes) + Prisma 6.19
- **Database**: MongoDB Atlas
- **Auth**: bcryptjs + JWT (jsonwebtoken)
- **Deployment**: Vercel

## Features

### Frontend
- Halaman Login & Register dengan validasi input
- Dashboard Form List dengan search, filter status, sort tanggal
- Form Detail: edit metadata, kelola pertanyaan, preview, share link
- 9 tipe pertanyaan: Short Answer, Long Answer, Multiple Choice, Dropdown, Date Picker, Linear Scale, Star Rating, Page Break, Text Block
- Drag-and-drop reorder pertanyaan (@dnd-kit)
- Multi-page form (page break) dengan progress bar
- Response statistics: Bar Chart, Star Chart, Linear Scale Chart, Text List
- Respondent view (tanpa login) untuk mengisi dan submit form
- Reusable components: Button, Input, Modal, Snackbar, Spinner
- Responsive design untuk mobile & desktop

### Backend
- Authentication: Register, Login, password hash (bcrypt), JWT token
- CRUD Form: List (dengan server-side search/filter/sort), Detail, Create, Update, Delete
- CRUD Questions: Create, Update, Delete, Reorder — dengan constraint (form yang sudah punya response tidak bisa edit/delete pertanyaan)
- Submit Response: validasi required fields, hanya form published yang bisa disubmit
- View Responses: owner-only, list semua submission dengan jawaban lengkap
- ObjectID validation pada semua route parameter
- CORS middleware untuk cross-origin access

## Prerequisites

- Node.js >= 18
- MongoDB (lokal atau MongoDB Atlas)

## Setup

### 1. Backend

```bash
cd backend
npm install
```

Buat file `.env`:
```env
DATABASE_URL="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority"
JWT_SECRET="your-secret-key-here"
```

```bash
# Generate Prisma Client
npm run db:generate

# Push schema ke database
npm run db:push

# Start server (port 3001)
npm run dev
```

### 2. Frontend

Terminal baru:
```bash
cd frontend
npm install
```

_(Opsional)_ Buat file `.env` jika backend bukan di localhost:
```env
VITE_API_URL=http://localhost:3001
```

```bash
# Start dev server (port 5173)
npm run dev
```

### 3. Akses Aplikasi

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api

## API Endpoints

> **Postman Collection** tersedia di [`backend/Formybara.postman_collection.json`](backend/Formybara.postman_collection.json).
> Import ke Postman untuk mencoba semua endpoint lengkap dengan example request/response.

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/api/auth/register` | - | Register user baru |
| POST | `/api/auth/login` | - | Login, returns JWT |
| GET | `/api/forms?search=&status=&sort=` | Bearer | List forms (filter, sort) |
| POST | `/api/forms` | Bearer | Create form |
| GET | `/api/forms/:id` | Bearer | Detail form |
| PATCH | `/api/forms/:id` | Bearer | Update form |
| DELETE | `/api/forms/:id` | Bearer | Delete form |
| GET | `/api/forms/:id/public` | - | Get published form (respondent) |
| GET | `/api/forms/:id/questions` | Bearer | List questions |
| POST | `/api/forms/:id/questions` | Bearer | Create question |
| PATCH | `/api/forms/:id/questions/:qid` | Bearer | Update question |
| DELETE | `/api/forms/:id/questions/:qid` | Bearer | Delete question |
| PATCH | `/api/forms/:id/questions/reorder` | Bearer | Reorder questions |
| GET | `/api/forms/:id/responses` | Bearer | List responses (owner only) |
| POST | `/api/forms/:id/responses` | - | Submit response (public) |

## Environment Variables

### Backend (`backend/.env`)
| Variable | Deskripsi |
|----------|-----------|
| `DATABASE_URL` | MongoDB connection string |
| `JWT_SECRET` | Secret key untuk JWT signing |

### Frontend (`frontend/.env`)
| Variable | Deskripsi |
|----------|-----------|
| `VITE_API_URL` | Base URL backend (default: `http://localhost:3001`) |

## Akun Demo

Untuk mencoba aplikasi tanpa register, gunakan akun demo berikut:

| Email | Password | Keterangan |
|-------|----------|------------|
| alice@demo.com | alice123 | 3 forms (2 published, 1 draft), masing-masing sudah ada 10 response |
| budi@demo.com | budi1234 | 3 forms (2 published, 1 closed), masing-masing sudah ada 10 response |
| citra@demo.com | citra123 | 2 forms (2 published), masing-masing sudah ada 10 response |
