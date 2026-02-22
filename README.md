# TeachPulse-AI

A production-grade, real-time classroom intelligence platform. It leverages a live WebRTC streaming architecture, Python-based FastAPI WebSockets, and Hugging Face Vision Transformers (`ViT`) to actively track and analyze the engagement and emotional state of students in real-time.

<p align="center">
  <img src="images/screenshot-1.png" alt="TeachPulse-AI Dashboard 1" width="48%">
  <img src="images/screenshot-2.png" alt="TeachPulse-AI Dashboard 2" width="48%">
  <br>
  <img src="images/screenshot-3.png" alt="TeachPulse-AI Dashboard 3" width="48%">
  <img src="images/screenshot-4.png" alt="TeachPulse-AI Dashboard 4" width="48%">
</p>

## Architecture
- **Backend**: Python 3, FastAPI, Uvicorn, WebSockets, SQLAlchemy, PostgreSQL
- **AI/ML Engine**: OpenCV (Face Detection) + `trpakov/vit-face-expression` (Hugging Face ViT for 7-emotion classification)
- **Frontend (Teacher Dashboard)**: React, Vite, Tailwind CSS v4, Recharts
- **Frontend (Student App)**: React, Vite, Tailwind CSS v4, WebRTC Camera API

---

## 🚀 Quick Start Guide

You will need **three** terminal windows open to run the full stack locally.

### 1. Start the Python AI Backend
The backend handles the WebSockets, the AI modeling, and the database.

```bash
cd backend
# 1. Activate your virtual environment
.\venv\Scripts\Activate.ps1    # On Windows
# source venv/bin/activate     # On Mac/Linux

# 2. Start the server (runs on port 8000)
uvicorn app.main:app --reload --port 8000
```

### 2. Start the Teacher Dashboard
The Teacher dashboard receives the AI analytics and the live video grid.

```bash
cd frontend/teacher-dashboard
# 1. Install dependencies
npm install

# 2. Start the Vite React app (runs on port 5173 natively)
npm run dev
```
*Open your browser to: `http://localhost:5173/login`*

### 3. Start the Student App
The student app hooks into the webcam and broadcasts frames to the Teacher.

```bash
cd frontend/student-app
# 1. Install dependencies
npm install

# 2. Start the Vite React app on a custom port to avoid conflicts
npm run dev -- --port 3000
```
*Open your browser to: `http://localhost:3000/join`*

---

## 🛠️ Environment Prerequisites
Before running for the first time, ensure you have:
1. **Python 3.10+** installed
2. **Node.js v18+** installed
3. A running **PostgreSQL** server instance.
   - You must create a database named `teachpulse_ai`.
   - Update `DATABASE_URL` in `backend/app/core/config.py` with your matching Postgres credentials (e.g., `postgresql+asyncpg://postgres:YOURPASSWORD@localhost:5432/teachpulse_ai`).

## 🧠 AI Capabilities
The backend relies on the `transformers` library to download the `trpakov/vit-face-expression` model automatically on first boot. The engine is tuned to recognize and score:
- **High Engagement**: Surprise, Happiness
- **Neutral**: Neutral
- **Low Engagement/Struggling**: Sadness, Fear, Disgust, Anger
