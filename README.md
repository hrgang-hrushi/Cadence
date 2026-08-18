# Cadence - The Intelligent Student Companion 🎙️🎓

**Cadence** is an AI-powered voice note-taker and study companion designed specifically for students. With an ultra-minimalist, "exponential" glassmorphism interface, it seamlessly blends your real-life class schedule with powerful productivity tools like a Pomodoro timer and one-tap voice memos.

## ✨ Features

- **Class Schedule OCR:** Upload a picture of your class schedule, and Cadence's Python backend will automatically read and digitize your classes, days, and times.
- **Smart Timeline:** The dashboard automatically knows which class you are in right now or which one is coming up next.
- **Pomodoro Focus Flow:** Built-in Pomodoro timer (25m/5m) that syncs seamlessly with your study workflow.
- **One-Tap Voice Memos:** Instantly record class lectures or personal notes, with the ability to bookmark important timestamps during the recording.
- **Persistent Sessions:** Powered by Firebase Google Auth—log in once and your classes and profile are synced securely.

---

## 📱 How to Install on Mobile (App Experience)

Cadence is built with responsive web technologies, meaning you can install it directly to your phone's home screen and use it just like a native app—no App Store required!

### For iPhone (Safari)
1. Open Cadence in Safari on your iPhone.
2. Tap the **Share** button at the bottom of the screen (the square with an arrow pointing up).
3. Scroll down and tap **"Add to Home Screen"**.
4. Tap **Add** in the top right corner. The Cadence icon will now appear on your home screen!

### For Android (Chrome)
1. Open Cadence in Chrome on your Android device.
2. Tap the **Menu** button (three vertical dots) in the top right corner.
3. Tap **"Add to Home screen"**.
4. Confirm by tapping **Add**. Cadence is now installed on your device!

---

## 🛠️ Local Development Setup

Cadence consists of a Next.js (React) frontend and a Python FastAPI backend for the OCR schedule-reading feature.

### 1. Setup the Next.js Frontend
```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

### 2. Setup Firebase Config
You will need to create a `.env.local` file in the root directory and add your Firebase credentials to enable Google Authentication:
```env
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-auth-domain"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
```

### 3. Setup the Python OCR Backend
To use the "Add via Picture" schedule upload feature, you must run the local FastAPI server:
```bash
# Navigate to the backend folder (if applicable) or root
cd backend # (or stay in root depending on where main.py is located)

# Install Python dependencies
pip install fastapi uvicorn python-multipart pytesseract pillow

# Start the Python backend on port 8000
python main.py
```
*Note: Make sure you have Tesseract-OCR installed on your machine (e.g., `brew install tesseract` on Mac).*

## 🎨 Tech Stack
- **Frontend:** Next.js (React), Tailwind CSS, Framer Motion
- **Backend:** Python, FastAPI, Tesseract OCR
- **Auth & Database:** Firebase Auth, Firestore
