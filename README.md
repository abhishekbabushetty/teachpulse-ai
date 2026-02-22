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

## 🧠 AI Capabilities & Metrics

The backend relies on the `transformers` library to download the `trpakov/vit-face-expression` model automatically on first boot. 

### The 7 Detected Emotions
The Vision Transformer actively scans every student camera frame for 7 universally recognized emotional states:
1. 😄 **Happy**
2. 😐 **Neutral**
3. 😲 **Surprise**
4. 😢 **Sad**
5. 😠 **Angry**
6. 🤢 **Disgust**
7. 😨 **Fear**

### How The "Engagement Score" is Calculated
The Teacher Dashboard displays a live `0% - 100%` Engagement Score for the entire class. This metric is synthesized using a strict mathematical heuristic on the backend (`engagement_service.py`), evaluated up to 10 times per second per student:

1. **Hardware Presence (Base Score: 30%)**
   - If the student's face is detected in the OpenCV bounding box, they instantly receive `30%`.
   - *If no face is detected, the score is instantly `0%` (Cannot be engaged if physically absent).*
2. **Eye Tracking (Focus Modifier: +40%)**
   - If OpenCV detects the students' eyes are open and actively looking toward the camera/screen, they receive an additional `+40%`.
3. **Emotional State (Context Modifier: -10% to +30%)**
   - Finally, the emotion classified by the Hugging Face ViT model adjusts the final score:
   - **+30%**: `Happy` or `Surprise` (Actively reacting, high engagement)
   - **+15%**: `Neutral` (Paying attention, but passively)
   - **+5%**: `Sad`, `Fear`, or `Disgust` (Present, but likely struggling or confused by the material)
   - **-10%**: `Angry` (Actively frustrated or deliberately disengaged)

The final score is capped at `100%` per student, and the Teacher Dashboard securely aggregates all live student scores into the rolling graphical average.
