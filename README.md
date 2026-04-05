# 🍽️ Canteen Feedback System
### Brakes India Pvt Ltd — TSF Division

An industry-grade, fully anonymous canteen feedback system with a **React Native mobile app**, **React admin dashboard**, and a **FastAPI + SQL Server** backend.

---

## 📦 Project Structure

```
canteen-feedback/
├── backend/                  # FastAPI backend (Python)
│   ├── main.py               # App entry point + CORS (host 0.0.0.0:8000)
│   ├── models.py             # SQLAlchemy ORM models
│   ├── schemas.py            # Pydantic schemas + validators
│   ├── database.py           # SQL Server connection
│   ├── requirements.txt      # Python dependencies
│   └── routers/
│       ├── feedback.py       # Submit / list / summary endpoints
│       └── export.py         # Excel export endpoint
│
├── mobile-app/               # React Native (Expo bare workflow)
│   ├── App.js                # Feedback form + dynamic server settings
│   ├── app.json              # Expo config
│   ├── package.json
│   └── android/              # Native Android project (for local APK builds)
│
├── admin-dashboard/          # React web admin panel
│   ├── src/
│   │   ├── App.js            # Router setup
│   │   ├── index.js          # Entry point
│   │   ├── index.css         # Global styles
│   │   └── pages/
│   │       ├── Dashboard.js  # Analytics + charts
│   │       └── FeedbackTable.js  # Full records table
│   └── package.json
│
├── build-apk.bat             # One-click Android APK builder
├── start-system.bat          # Starts backend + dashboard together
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- SQL Server Express (LocalDB or full)
- Android Studio (for APK builds)
- Java 17+ (required by Gradle)

---

### 1️⃣ Backend Setup (FastAPI)

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Start the server (listens on ALL interfaces so mobile can connect)
python main.py
```

API runs at: `http://0.0.0.0:8000`
Swagger docs: `http://localhost:8000/docs`
Health check: `http://localhost:8000/health`

> The backend binds to `0.0.0.0` — this means any device on the same Wi-Fi network can reach it using your PC's local IP.

---

### 2️⃣ Admin Dashboard Setup (React Web)

```bash
cd admin-dashboard
npm install
npm start
```

Opens at: `http://localhost:3000`

---

### 3️⃣ Mobile App — Build Release APK

The mobile app is a **bare React Native** project (not Expo Go). You build a self-contained APK locally — no EAS account or internet login required.

```bash
cd mobile-app
npm install

# Build release APK (signed with debug keystore — fine for internal testing)
cd android
.\gradlew assembleRelease
```

APK output:
```
mobile-app\android\app\build\outputs\apk\release\app-release.apk
```

Transfer to the phone and install it (enable "Install from unknown sources" if prompted).

> **Note:** The release build uses the `debug.keystore` for signing so it can be sideloaded without a Play Store upload. Do not use this keystore in a public production release.

---

## 🌐 Network Configuration (Wi-Fi)

The mobile app connects to the backend over your **local Wi-Fi network**. No hardcoded IP is baked into the APK — the IP is configured directly on the device at runtime.

### How it works

On first launch, the app shows a **Server Setup screen** asking for the PC's IP address. The URL is saved on the device using `AsyncStorage` and persists across restarts.

### Steps

1. Find your PC's IP address:
   ```powershell
   ipconfig
   # Look for IPv4 Address under your Wi-Fi adapter
   ```

2. Start the backend (`python main.py`) on the PC.

3. Open the mobile app → enter the IP when prompted (e.g. `192.168.1.10`) → tap **💾 Save & Connect**.

4. The app auto-builds the URL as `http://IP:8000`.

### If the IP changes

No rebuild needed. Simply:
- Tap the **⚙️ gear icon** in the app header
- Enter the new IP → **Save & Connect**

### Firewall (Windows)

Allow inbound connections on port 8000 so the phone can reach the PC:

```cmd
netsh advfirewall firewall add rule name="FastAPI Port 8000" dir=in action=allow protocol=TCP localport=8000
```

---

## 📊 Features

### Mobile App
- ⚙️ **Dynamic server URL** — configure IP on-device, no rebuild needed
- 📝 Anonymous feedback form with animated star ratings & emoji mood indicators
- 🍴 Meal type selector (Breakfast / Lunch / Dinner)
- 📊 Live overall score bar with emoji feedback
- 🔒 100% anonymous — no name, ID or personal data collected
- 🔄 Auto-resets 4 seconds after submission (shared tablet mode)
- ❌ Smart connection error alerts with "Update IP" shortcut

### Admin Web Dashboard
- 📈 Bar chart with average ratings per category
- 🏆 Best rated / needs improvement insight cards
- 🍴 Meal type breakdown (Breakfast / Lunch / Dinner)
- 📋 Full feedback records table with search, filter & pagination
- 📥 Export to Excel with date range and meal type filters

### Backend API

| Method | Endpoint            | Description                    |
|--------|---------------------|--------------------------------|
| POST   | `/feedback`         | Submit anonymous feedback      |
| GET    | `/feedback/all`     | Get all records (with filters) |
| GET    | `/feedback/summary` | Average ratings per category   |
| GET    | `/feedback/export`  | Download Excel report          |
| GET    | `/health`           | Health check                   |

---

## 🗄️ Database Schema

**Table: `Feedback`**

| Column         | Type          | Description                |
|----------------|---------------|----------------------------|
| id             | INT (PK)      | Auto-increment             |
| canteen_id     | INT (FK)      | Linked canteen             |
| canteen_name   | NVARCHAR(100) | Canteen name               |
| meal_type      | NVARCHAR(20)  | Breakfast / Lunch / Dinner |
| food_quality   | INT           | Rating 1–5                 |
| food_taste     | INT           | Rating 1–5                 |
| food_hygiene   | INT           | Rating 1–5                 |
| staff_behavior | INT           | Rating 1–5                 |
| cleanliness    | INT           | Rating 1–5                 |
| comments       | NVARCHAR(500) | Optional text (no emojis)  |
| feedback_date  | DATE          | Auto-set by server         |
| created_at     | DATETIME      | Auto-set by server         |

---

## 🏗️ Tech Stack

| Layer          | Technology                                        |
|----------------|---------------------------------------------------|
| Mobile App     | React Native + Expo SDK 53 (bare workflow)        |
| Storage        | @react-native-async-storage/async-storage v1.23.1 |
| Admin Web      | React 18 + Recharts                               |
| Backend API    | FastAPI + Uvicorn (host 0.0.0.0)                  |
| Database       | Microsoft SQL Server Express                      |
| ORM            | SQLAlchemy                                        |
| Validation     | Pydantic v2                                       |
| Excel Export   | openpyxl                                          |
| APK Build      | Gradle (local, no EAS/Expo account needed)        |

---

## ⚠️ Important Notes

| # | Note |
|---|------|
| 1 | **Emojis in comments** are automatically stripped before saving (SQL Server UCS-2 limitation) |
| 2 | **No personal data** is collected — the system is fully anonymous |
| 3 | **IP changes** — tap ⚙️ in the app header to update without rebuilding |
| 4 | **HTTP allowed** — `android:usesCleartextTraffic="true"` is set so the release APK can reach local HTTP endpoints |
| 5 | **No EAS login needed** — APK is built locally with Gradle using the existing `debug.keystore` |
| 6 | Run `.\start-system.bat` to launch both backend and dashboard at once |

---

## 📱 Building APK (Quick Reference)

```powershell
# From mobile-app/android/
.\gradlew assembleRelease

# Output:
# mobile-app\android\app\build\outputs\apk\release\app-release.apk
```

If you need a debug build (connects to metro bundler for live reload):

```powershell
.\gradlew assembleDebug
# Output: mobile-app\android\app\build\outputs\apk\debug\app-debug.apk
```

---

*Built for Brakes India Pvt Ltd — TSF Division | 2026*
