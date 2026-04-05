# 🍽️ Canteen Feedback System
### Brakes India Pvt Ltd — TSF Division

An industry-grade, fully anonymous canteen feedback system with a **React Native mobile app**, **React admin dashboard**, and a **FastAPI + SQL Server** backend.

---

## 📦 Project Structure

```
canteen-feedback/
├── backend/                  # FastAPI backend (Python)
│   ├── main.py               # App entry point + CORS
│   ├── models.py             # SQLAlchemy ORM models
│   ├── schemas.py            # Pydantic schemas + validators
│   ├── database.py           # SQL Server connection
│   ├── requirements.txt      # Python dependencies
│   └── routers/
│       ├── feedback.py       # Submit / list / summary endpoints
│       └── export.py         # Excel export endpoint
│
├── mobile-app/               # React Native (Expo) mobile app
│   ├── App.js                # Login + Admin dashboard + Feedback form
│   ├── app.json              # Expo config
│   └── package.json
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
- Android Studio (for APK builds) or Expo Go app

---

### 1️⃣ Backend Setup (FastAPI)

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure database in .env
# Create a file: backend/.env
# Add: DATABASE_URL=mssql+pyodbc://./CanteenFeedbackDB?driver=ODBC+Driver+17+for+SQL+Server&trusted_connection=yes

# Start the server
python main.py
```

API runs at: `http://0.0.0.0:8000`  
Swagger docs: `http://localhost:8000/docs`

---

### 2️⃣ Admin Dashboard Setup (React Web)

```bash
cd admin-dashboard
npm install
npm start
```

Opens at: `http://localhost:3000`

---

### 3️⃣ Mobile App Setup (React Native / Expo)

```bash
cd mobile-app
npm install

# For web preview
npx expo start
# Press W for web browser

# For APK build
cd ..
.\build-apk.bat
```

---

## 🔐 Login Credentials

| Role  | Username | Password   | Access |
|-------|----------|------------|--------|
| Admin | `admin`  | `admin@123`| Mobile dashboard + analytics |
| User  | `user`   | `user@123` | Feedback submission form |

> **Note:** These are hardcoded in `mobile-app/App.js`. Change them before production deployment.

---

## 📊 Features

### Mobile App
- 🔐 Role-based login (Admin / User)
- 📊 Admin mobile dashboard with live stats — Summary & Records tabs
- 📥 Direct Excel export to device (opens in Excel/Google Sheets)
- 📝 Anonymous feedback form with animated star ratings
- 🔄 Auto-resets after each submission (shared tablet mode)
- ⚙️ Dynamic API URL stored in device storage

### Admin Web Dashboard
- 📈 Bar chart with average ratings per category
- 🏆 Best rated / needs improvement insight cards
- 🍴 Meal type breakdown (Breakfast / Lunch / Dinner)
- 📋 Full feedback records table with search, filter & pagination
- 📥 Export to Excel with date range and meal type filters

### Backend API
| Method | Endpoint              | Description                    |
|--------|-----------------------|--------------------------------|
| POST   | `/feedback`           | Submit anonymous feedback      |
| GET    | `/feedback/all`       | Get all records (with filters) |
| GET    | `/feedback/summary`   | Average ratings per category   |
| GET    | `/feedback/export`    | Download Excel report          |
| GET    | `/health`             | Health check                   |

---

## 🗄️ Database Schema

**Table: `Feedback`**

| Column         | Type          | Description              |
|----------------|---------------|--------------------------|
| id             | INT (PK)      | Auto-increment           |
| canteen_id     | INT (FK)      | Linked canteen           |
| canteen_name   | NVARCHAR(100) | Canteen name             |
| meal_type      | NVARCHAR(20)  | Breakfast / Lunch / Dinner |
| food_quality   | INT           | Rating 1–5               |
| food_taste     | INT           | Rating 1–5               |
| food_hygiene   | INT           | Rating 1–5               |
| staff_behavior | INT           | Rating 1–5               |
| cleanliness    | INT           | Rating 1–5               |
| comments       | NVARCHAR(500) | Optional text (no emojis)|
| feedback_date  | DATE          | Auto-set by server       |
| created_at     | DATETIME      | Auto-set by server       |

---

## 🌐 Network Configuration

The mobile app and backend communicate over **local Wi-Fi**.

1. Find your PC's IP: `ipconfig` → look for **IPv4 Address** under Wi-Fi
2. Update `API_URL` in `mobile-app/App.js`:
   ```js
   const API_URL = 'http://YOUR_IP:8000';
   ```
3. Ensure **Windows Firewall** allows port 8000:
   ```cmd
   netsh advfirewall firewall add rule name="FastAPI Port 8000" dir=in action=allow protocol=TCP localport=8000
   ```

---

## 🏗️ Tech Stack

| Layer          | Technology                          |
|----------------|-------------------------------------|
| Mobile App     | React Native + Expo SDK 53          |
| Admin Web      | React 18 + Recharts                 |
| Backend API    | FastAPI + Uvicorn                   |
| Database       | Microsoft SQL Server Express        |
| ORM            | SQLAlchemy                          |
| Validation     | Pydantic v2                         |
| Excel Export   | openpyxl                            |
| File Download  | expo-file-system + expo-intent-launcher |

---

## ⚠️ Important Notes

- **Emojis in comments** are automatically stripped before saving (SQL Server UCS-2 limitation)
- **No personal data** is collected — the system is fully anonymous
- If the **PC IP changes**, update `API_URL` in `App.js` and rebuild the APK
- Run `.\start-system.bat` to launch both backend and dashboard at once

---

## 📱 Building APK

```bat
cd E:\canteen-feedback
.\build-apk.bat
```

The APK will be generated in `mobile-app\android\app\build\outputs\apk\debug\`

---

*Built for Brakes India Pvt Ltd — TSF Division | 2025*
