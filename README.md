<div align="center">

<h1>🍽️ Canteen Feedback System</h1>
<h3>TSF Brɑkes Indiɑ — Digital Feedback Platform</h3>

<p>
  <img src="https://img.shields.io/badge/Version-2.0.0-blue?style=for-the-badge" alt="Version"/>
  <img src="https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/Database-SQLite-003B57?style=for-the-badge&logo=sqlite" alt="SQLite"/>
  <img src="https://img.shields.io/badge/Mobile-React%20Native%20%2F%20Expo-61DAFB?style=for-the-badge&logo=react" alt="React Native"/>
  <img src="https://img.shields.io/badge/Dashboard-React-61DAFB?style=for-the-badge&logo=react" alt="React"/>
  <img src="https://img.shields.io/badge/Offline%20First-✓-success?style=for-the-badge" alt="Offline First"/>
</p>

<p><em>A fully offline, privacy-first canteen feedback platform for collecting, analysing, and exporting employee meal feedback — deployable on any local network without internet access.</em></p>

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
  - [Prerequisites](#prerequisites)
  - [1 — Start the Backend](#1--start-the-backend)
  - [2 — Start the Admin Dashboard](#2--start-the-admin-dashboard)
  - [3 — Install the Mobile App](#3--install-the-mobile-app)
- [How It Works](#-how-it-works)
- [API Reference](#-api-reference)
- [Database Schema](#-database-schema)
- [Admin Dashboard Pages](#-admin-dashboard-pages)
- [Mobile App](#-mobile-app)
- [Privacy & Anonymity](#-privacy--anonymity)
- [Excel Export](#-excel-export)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

---

## 🌐 Overview

The **Canteen Feedback System** is a complete, production-ready platform built to capture anonymous meal feedback from employees at TSF Brɑkes Indiɑ. It operates entirely on a **local Wi-Fi network** — no cloud, no internet, no data leaving the premises.

**Who uses it?**

| Role | Tool | Purpose |
|------|------|---------|
| 👷 Employee | Mobile Web Form (via QR scan or direct URL) | Submit anonymous feedback after each meal |
| 🧑‍💼 Admin | Android Tablet App | Show QR code for employees to scan |
| 📊 Manager | Admin Web Dashboard | View analytics, trends, and export reports |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Local Wi-Fi Network                       │
│                                                                  │
│   📱 Employee Phone          💻 Admin Laptop / PC               │
│   ┌──────────────────┐       ┌──────────────────────────────┐   │
│   │  Web Browser     │  HTTP │  FastAPI Backend (port 8000) │   │
│   │  (Feedback Form) │◄─────►│  SQLite Database             │   │
│   └──────────────────┘       │  Static Files + QR Generator │   │
│                               └──────────────┬───────────────┘   │
│   📱 Admin Tablet App                        │                   │
│   ┌──────────────────┐                       │                   │
│   │  React Native    │       ┌───────────────▼───────────────┐   │
│   │  (Expo APK)      │◄─────►│  React Admin Dashboard        │   │
│   │  QR Code Display │  HTTP │  (port 3000)                  │   │
│   └──────────────────┘       └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Communication Flow:**
1. Backend starts and auto-detects the laptop's local IP address
2. A QR code is generated pointing to `http://<LOCAL_IP>:8000/form`
3. Admin tablet displays the QR code to employees
4. Employees scan → browser opens feedback form → submit → data saved to SQLite
5. Manager opens Admin Dashboard → views real-time charts and statistics
6. Manager clicks "Export Excel" → downloads formatted `.xlsx` report

---

## ✨ Features

### 🔒 Privacy First
- **100% Anonymous** — zero identity fields collected (no name, email, employee ID, or device info)
- Feedback is stored with a date-stamp only
- Emoji stripping to prevent character encoding issues

### 📊 Admin Dashboard
- **Live Overview** with overall health score (out of 5.0)
- **5 Category Cards** — Food Quality, Food Taste, Food Hygiene, Cleanliness, Staff Behavior
- **Meal Breakdown** — Breakfast / Lunch / Dinner distribution with progress bars
- **Recent Feedback** feed with average scores and comments
- **Analytics Page** — monthly trends with bar charts, radar charts, and year-over-year comparison
- **Records Page** — paginated table with search and filter
- **Excel Export** — one-click download of formatted report

### 📱 Mobile Tablet App (Android APK)
- Displays live QR code for the feedback form
- Admin configuration panel for server IP with numeric keypad
- Server connectivity check

### 🌐 Web Feedback Form (Embedded in Backend)
- Responsive HTML/CSS/JS form served by FastAPI
- Touch-friendly star rating UI (tap-to-rate)
- Optional free-text comments (up to 500 characters)
- Meal type selector (Breakfast / Lunch / Dinner)
- Animated success confirmation screen

### 📁 Excel Export
- Formatted `.xlsx` with alternating row colors
- Human-readable ratings (`4 - Great`, `5 - Excellent`)
- Two sheets: **Canteen Feedback** (full data) + **Summary**
- Auto-filter and frozen headers
- Filterable by meal type, canteen, and date range

---

## 🛠️ Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Backend API** | FastAPI | Latest | REST API, request validation, routing |
| **ASGI Server** | Uvicorn | Latest | High-performance async server |
| **ORM** | SQLAlchemy | Latest | Database abstraction layer |
| **Database** | SQLite | Built-in | Offline-first, zero-config database |
| **Data Validation** | Pydantic | v2 | Schema validation and serialisation |
| **Excel Generation** | openpyxl + pandas | Latest | Formatted `.xlsx` export |
| **QR Generator** | qrcode[pil] | Latest | Dynamic QR code for feedback URL |
| **Admin Frontend** | React 18 | 18.2 | Admin web dashboard |
| **Charts** | Recharts | 2.10 | Interactive data visualisations |
| **HTTP Client** | Axios | 1.6 | API requests from dashboard |
| **Routing** | React Router DOM | 6 | Multi-page navigation |
| **Mobile App** | React Native + Expo | 53 | Android tablet application |
| **Build Tool** | EAS (Expo) | 5 | Android APK generation |

---

## 📁 Project Structure

```
canteen-feedback/
│
├── 📂 backend/                    # FastAPI Python backend
│   ├── main.py                    # App entry point, CORS, startup logic
│   ├── models.py                  # SQLAlchemy ORM models (Canteen, Feedback)
│   ├── schemas.py                 # Pydantic request/response schemas
│   ├── database.py                # SQLite engine and session factory
│   ├── requirements.txt           # Python dependencies
│   ├── feedback.db                # SQLite database (auto-created)
│   ├── .env                       # Environment variables (not committed)
│   └── routers/
│       ├── feedback.py            # POST/GET feedback endpoints
│       ├── analytics.py           # Monthly & yearly analytics endpoints
│       └── export.py              # Excel export endpoint
│
├── 📂 admin-dashboard/            # React admin web application
│   ├── package.json
│   └── src/
│       ├── App.js                 # Routing configuration
│       ├── index.css              # Global styles
│       ├── components/
│       │   ├── Layout.js          # Sidebar + header shell
│       │   └── StarDisplay.js     # Read-only star rating display
│       └── pages/
│           ├── Dashboard.js       # Overview + hero score + recent entries
│           ├── Analytics.js       # Monthly charts + yearly trends
│           └── Records.js         # Paginated feedback table + filters
│
├── 📂 mobile-app/                 # React Native / Expo tablet app
│   ├── App.js                     # Main app with navigation + QR display
│   ├── config.js                  # Server IP configuration
│   ├── index.js                   # Expo entry point
│   ├── app.json                   # Expo app config
│   ├── eas.json                   # EAS build profiles
│   ├── components/
│   │   └── StarRating.js          # Interactive star rating component
│   └── screens/
│       └── FeedbackScreen.js      # Feedback form screen
│
├── 📂 database/
│   └── schema.sql                 # Reference SQL schema (SQL Server version)
│
├── start-system.bat               # 🚀 One-click startup script (Windows)
├── build-apk.bat                  # 🔨 Android APK build script
├── .gitignore                     # Git exclusions
└── README.md                      # This file
```

---

## 🚀 Quick Start

### Prerequisites

Make sure the following are installed on the **admin laptop / PC**:

| Tool | Minimum Version | Download |
|------|----------------|---------|
| Python | 3.10+ | [python.org](https://python.org) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| npm | 9+ | Bundled with Node.js |

> **All devices** (phone, tablet, laptop) must be connected to the **same Wi-Fi network**.

---

### 1 — Start the Backend

**Option A: One-click (Windows)**
```batch
double-click  start-system.bat
```

**Option B: Manual**
```bash
# Navigate to the project root
cd canteen-feedback

# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS / Linux

# Install Python dependencies
pip install -r backend/requirements.txt

# Start the FastAPI server
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

✅ The server will start at: `http://0.0.0.0:8000`

**Useful URLs once running:**

| URL | Description |
|-----|-------------|
| `http://localhost:8000/` | Health check |
| `http://localhost:8000/docs` | Swagger interactive API docs |
| `http://localhost:8000/redoc` | ReDoc API documentation |
| `http://<YOUR_LOCAL_IP>:8000/form` | Employee feedback form (shareable via QR) |

> Find your local IP: run `ipconfig` on Windows or `ifconfig` on macOS/Linux and look for your **IPv4 address** (e.g. `192.168.1.105`).

---

### 2 — Start the Admin Dashboard

Open a **new terminal** (keep the backend running):

```bash
cd canteen-feedback/admin-dashboard
npm install          # first time only
npm start
```

✅ Dashboard opens at: `http://localhost:3000`

> The dashboard automatically connects to the backend using `window.location.hostname` — so it works from any device on the network.

---

### 3 — Install the Mobile App

The Android APK is pre-built and ready to install:

```
CanteenFeedbackApp_Final.apk
```

**Install on tablet:**
1. Transfer the `.apk` file to the Android tablet (USB cable or file share)
2. On the tablet: **Settings → Security → Allow Unknown Sources**
3. Open the `.apk` file → Install
4. Open the app → tap the **gear icon** → enter your laptop's local IP (e.g. `192.168.1.105`)
5. The QR code will update automatically — employees can now scan and submit feedback

**Rebuild APK (if code changes):**
```batch
double-click  build-apk.bat
```

---

## 🔄 How It Works

### Employee Workflow
```
Employee finishes meal
        ↓
Sees tablet at canteen exit showing QR code
        ↓
Scans QR with their personal phone
        ↓
Browser opens feedback form (no app download needed)
        ↓
Selects Meal Type → Rates 5 categories → Optional comment
        ↓
Taps "Submit Feedback"
        ↓
🎉 "Thank You!" animation → Form auto-resets
```

### Admin/Manager Workflow
```
Open Admin Dashboard (http://localhost:3000)
        ↓
View real-time Overview — overall score, category cards
        ↓
Navigate to Analytics — monthly trends, charts
        ↓
Navigate to Records — search, filter, paginate records
        ↓
Click "Export Excel" → download formatted .xlsx report
```

---

## 📡 API Reference

Base URL: `http://<server-ip>:8000`

### Health Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Quick health check |
| `GET` | `/health` | Detailed health status with version info |

### Feedback Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/feedback` | Submit anonymous feedback |
| `GET` | `/feedback/summary` | Aggregated averages — overall or filtered |
| `GET` | `/feedback/all` | Paginated list of all feedback records |
| `GET` | `/feedback/count` | Total count of records |
| `GET` | `/feedback/export` | Download formatted Excel report |

### Analytics Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/analytics/monthly` | Averages & counts for a specific month/year |
| `GET` | `/analytics/yearly` | Month-by-month breakdown for a full year |

### Common Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `meal_type` | string | Filter by meal | `Breakfast`, `Lunch`, `Dinner` |
| `canteen_name` | string | Filter by canteen | `Main Canteen` |
| `from_date` | date | Start date filter | `2026-01-01` |
| `to_date` | date | End date filter | `2026-12-31` |
| `month` | int (1–12) | Filter by month | `4` |
| `year` | int | Filter by year | `2026` |
| `skip` | int | Pagination offset | `0` |
| `limit` | int (1–200) | Pagination page size | `20` |

### POST /feedback — Request Body

```json
{
  "canteen_name": "Main Canteen",
  "canteen_id": 1,
  "meal_type": "Lunch",
  "food_quality": 4,
  "food_taste": 5,
  "food_hygiene": 4,
  "staff_behavior": 3,
  "cleanliness": 4,
  "comments": "Great food today!"
}
```

> Full interactive docs available at `http://localhost:8000/docs` (Swagger UI)

---

## 🗄️ Database Schema

The system uses **SQLite** — a single file (`backend/feedback.db`) that is automatically created when the server starts for the first time.

### Table: Canteen

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | Auto-increment primary key |
| `name` | VARCHAR(100) | Canteen name (e.g. "Main Canteen") |
| `location` | VARCHAR(200) | Physical location / floor |
| `created_at` | DATETIME | Record creation timestamp |

### Table: Feedback

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | Auto-increment primary key |
| `canteen_id` | INTEGER FK | Reference to Canteen table |
| `canteen_name` | VARCHAR(100) | Denormalised canteen name |
| `meal_type` | VARCHAR(20) | `Breakfast` / `Lunch` / `Dinner` |
| `food_quality` | INTEGER (1–5) | Star rating |
| `food_taste` | INTEGER (1–5) | Star rating |
| `food_hygiene` | INTEGER (1–5) | Star rating |
| `staff_behavior` | INTEGER (1–5) | Star rating |
| `cleanliness` | INTEGER (1–5) | Star rating |
| `comments` | VARCHAR(500) | Optional free-text comment |
| `feedback_date` | DATE | Date of feedback (auto set by server) |
| `created_at` | DATETIME | Submission timestamp (auto set by server) |

> **Note:** `feedback_date` and `created_at` are set automatically by the server and are not exposed in the web form — they are visible only in the Excel export.

---

## 📊 Admin Dashboard Pages

### 🏠 Dashboard (Home)
- **Hero Score Card** — large animated overall rating (X.X / 5.0) with colour-coded emoji
- **5 Category Stat Cards** — individual averages with animated progress bars
- **Meal Breakdown Panel** — Breakfast / Lunch / Dinner counts with percentage bars
- **Recent Feedback Feed** — last 6 submissions with meal type, comment preview, and average score
- **Quick Insights Row** — Best Category, Needs Attention, Satisfaction Rate

### 📈 Analytics
- **Monthly Overview** — select any month/year to see that period's averages
- **Category Bar Chart** — side-by-side comparison of all 5 rating categories
- **Radar Chart** — visual "spider web" of overall performance
- **Yearly Trend Chart** — line chart of monthly totals across a full year
- **Meal Type Filters** — drill down by Breakfast, Lunch, or Dinner

### 📋 Records
- **Searchable data table** with all feedback fields
- **Filter panel** — by meal type and date range
- **Pagination** — configurable page size (10 / 20 / 50 records per page)
- **Star display** — visual star ratings in each row
- **Export button** — download filtered or full Excel report

---

## 📱 Mobile App

The Android tablet app (built with **React Native + Expo**) serves as the **QR kiosk** at the canteen exit.

### Screens

| Screen | Description |
|--------|-------------|
| **QR Display** | Full-screen QR code linking to the feedback form URL. Auto-refreshes when IP changes. |
| **Settings** | Enter the backend server IP address (numeric keypad). Includes a connectivity test button. |
| **Feedback (embedded)** | Optional in-app feedback form (same as web form) |

### Configuring the Server IP

1. Open the mobile app on the tablet
2. Tap the **⚙️ gear icon** in the top-right
3. Enter the laptop's **local IP address** (e.g. `192.168.1.105`)
4. Tap **Save** — the QR code updates instantly

---

## 🔒 Privacy & Anonymity

This system was designed with **privacy by design**:

| What is collected | What is NOT collected |
|-------------------|----------------------|
| ✅ Meal type | ❌ Employee name |
| ✅ Star ratings (1–5) | ❌ Employee ID / badge number |
| ✅ Optional text comment | ❌ Email address |
| ✅ Date of feedback | ❌ Device information |
| ✅ Canteen name | ❌ IP address of submitter |
|  | ❌ Location / GPS |

**Technical safeguards:**
- Emoji characters are stripped from comments before storage (prevents encoding corruption)
- Comments are limited to 500 characters
- No session cookies or tokens are used in the feedback form
- CORS is open (`*`) within the local network — no auth needed for employee submissions

---

## 📥 Excel Export

The export generates a professionally formatted `.xlsx` file with:

**Sheet 1 — Canteen Feedback**
- Dark blue header row with white bold text
- Alternating light blue / white row styling
- Auto-filter on all columns
- Frozen header rows (scroll-safe)
- Human-readable rating labels (`1 - Poor`, `2 - Fair`, ..., `5 - Excellent`)
- Columns: ID, Canteen Name, Meal Type, Food Quality, Food Taste, Food Hygiene, Staff Behavior, Cleanliness, Comments, Feedback Date, Submitted At

**Sheet 2 — Summary**
- Total record count
- Export timestamp
- Applied filters (if any)

**How to export:**
- From the Admin Dashboard: click **📥 Export Excel** button on any page
- Via API: `GET http://localhost:8000/feedback/export`
- With filters: `GET http://localhost:8000/feedback/export?meal_type=Lunch&from_date=2026-04-01`

---

## 🔧 Troubleshooting

### ❌ "Connection Refused" / Mobile can't reach backend

1. Ensure the laptop and mobile devices are on the **same Wi-Fi network**
2. Check your laptop's local IP: run `ipconfig` → look for `IPv4 Address` under your Wi-Fi adapter
3. Verify the backend is running: open `http://localhost:8000/health` in a browser on the laptop
4. Allow port 8000 through Windows Firewall:
   ```
   Windows Defender Firewall → Advanced Settings
   → Inbound Rules → New Rule → Port → TCP 8000 → Allow
   ```
5. Update the server IP in the mobile app's settings

### ❌ Backend won't start — "Module not found"

```bash
# Make sure virtual environment is activated
venv\Scripts\activate

# Reinstall all dependencies
pip install -r backend/requirements.txt
```

### ❌ Dashboard shows "No data" / API calls fail

1. Ensure the backend is running on port 8000
2. Open `http://localhost:8000/docs` to verify backend is alive
3. Check that the dashboard proxy is configured: `admin-dashboard/package.json` should contain `"proxy": "http://127.0.0.1:8000"`

### ❌ APK won't install on tablet

- Enable **Unknown Sources**: Settings → Security → Install unknown apps
- If the `.apk` is blocked: use `adb install CanteenFeedbackApp_Final.apk` via USB

### ❌ Excel export downloads empty file

- Ensure there is at least one feedback record in the database
- Try accessing `http://localhost:8000/feedback/all` to confirm records exist

---

## 🤝 Contributing

This is an internal tool for TSF Brɑkes Indiɑ. To make changes:

1. **Fork / Clone** the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and test locally
4. Commit with a clear message: `git commit -m "feat: add category filter to analytics page"`
5. Push and open a Pull Request

### Commit Message Convention

| Prefix | Use for |
|--------|---------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `style:` | UI/CSS changes |
| `refactor:` | Code restructuring (no feature change) |
| `chore:` | Build scripts, configs |

---

## 📄 License

Internal use only — TSF Brɑkes Indiɑ © 2026. All rights reserved.

---

<div align="center">
  <sub>Built with ❤️ for the TSF Brɑkes Indiɑ team &nbsp;|&nbsp; v2.0.0 &nbsp;|&nbsp; Offline-first &nbsp;|&nbsp; Privacy by design</sub>
</div>
