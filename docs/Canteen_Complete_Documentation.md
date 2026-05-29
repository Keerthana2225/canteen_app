# Smart Canteen Feedback Management System — Complete Technical Documentation & Systems Handbook
### Enterprise-Grade Mobile Kiosk, Web Analytics, & Automated Reporting System

---

## 1. Project Overview

### What?
The **Smart Canteen Feedback Management System** is a zero-trust, enterprise-grade digital feedback solution. It facilitates the real-time collection, automated evaluation, and high-density reporting of employee feedback regarding corporate canteen facilities—specifically food quality, taste, hygiene, cleanliness, and staff hospitality.

### Why?
Large industrial plants, manufacturing units, and corporate offices operate canteens catering to thousands of employees daily. Paper registers or suggestion boxes are slow, easily bypassed, and make quick analysis impossible. Poor food or sub-standard hygiene can escalate rapidly into industrial labor disputes or health safety emergencies. This system replaces these vulnerabilities with a high-speed digital kiosk and a dashboard that isolates severe complaints (critical failures) in real time.

### How?
The system leverages a 3-tier architecture:
1. **Resilient Mobile Kiosk (React Native Expo)**: Deployed as a physical tablet stand inside the dining hall. It supports offline operation, multilingual Tamil/English layouts, and instant input validation.
2. **Automated Evaluation Engine (FastAPI Backend)**: Performs real-time scoring, evaluates critical thresholds, validates comments constraints, and dynamically tags meal categories based on local device clocks.
3. **Enterprise Analytics Web Portal (React.js)**: Integrates date filters, interactive charts (Recharts), and a color-coded Excel reporting suite.

### Where?
The system is optimized to operate over a Local Area Network (LAN) or a private corporate intranet, requiring zero public internet access to function, ensuring high speed and complete data privacy.

---

## 2. Executive Summary

This system translates qualitative canteen service quality into empirical data, enabling corporate administration and HSE (Health, Safety, and Environment) teams to monitor caterer performance.

```
┌─────────────────┐      1. Rate 5 Metrics       ┌─────────────────┐
│   Tablet Kiosk  ├─────────────────────────────►│ FastAPI Backend │
│  (Tamil/English)│◄─────────────────────────────┤ (Uvicorn ASGI)  │
└─────────────────┘      4. Render QR / Form     └────────┬────────┘
                                                          │
                               2. Flag Critical /         │ 3. Save
                                  Auto Meal Tag           ▼
┌─────────────────┐                               ┌─────────────────┐
│ React Dashboard │◄──────────────────────────────┤  SQL Server DB  │
│ (Excel Export)  │      5. Sync Analytics        │  (or SQLite)    │
└─────────────────┘                               └─────────────────┘
```

### High-Level Business Value
- **Instant Escalation Containment**: Automatically highlights poor ratings (`overall_rating <= 2`) in bright red warnings, triggering immediate alerts before issues escalate.
- **Contractor Accountability**: Provides empirical metrics to review third-party caterer SLAs (Service Level Agreements) using monthly and day-wise trend reports.
- **resilience**: Runs on a local server or router without internet, preventing connection crashes.

---

## 3. Business Problem Statement

Traditional feedback systems in large industrial facilities face severe operational issues:
* **Paper-Based Ignorance**: Ledgers are tedious to fill out. Workers choose to skip feedback rather than wait in line to write comments.
* **Delayed Response Times**: Compiling manual logs into Excel sheets takes weeks, meaning management only learns about bad food or hygiene failures long after the meal has been cleared.
* **Lack of Mandatory Explanations**: Workers might leave 1-star reviews without explaining the issue, leaving canteen managers with no actionable details to fix the problem.
* **Lack of Meal Context**: Logs rarely capture the exact shift or meal, preventing management from identifying whether issues occurred during Breakfast, Lunch, Dinner, Midnight Supper, or Early Morning shifts.

---

## 4. Solution Overview

The system addresses these bottlenecks through specific technical solutions:

* **Dynamic Metric Validation**: Captures ratings on a 1-to-5 star scale across 5 core categories:
  1. *Food Quality*
  2. *Food Taste*
  3. *Food Hygiene*
  4. *Cleanliness*
  5. *Staff Behavior*
* **Mandatory Commentary Constraints**: If a user submits a '1-star' score in any category, the kiosk interface locks down and mandates a written comment before submission.
* **Automated Meal Detection**: A 24-hour time-based algorithm automatically tags records based on the tablet's local system clock:
  - **Breakfast**: 6:00 AM – 11:00 AM
  - **Lunch**: 11:00 AM – 7:00 PM
  - **Dinner**: 7:00 PM – 11:00 PM
  - **Midnight Supper**: 11:00 PM – 1:30 AM
  - **Early Morning**: 1:30 AM – 6:00 AM
* **Color-Coded Native Excel Exports**: The backend generates fully styled `.xlsx` sheets where rows flagged as `is_critical = 1` are highlighted in bold red.

---

## 5. System Modules

### I. Tablet Kiosk Module (`mobile-app/`)
- **Purpose**: Captures real-time ratings from employees immediately after dining.
- **Resilience**: Contains an automated routing engine that detects if it is running in a web browser or a physical Android tablet, dynamically rewriting API destinations.
- **Multilingual dictionary**: Supports English and Tamil without external internet translation dependencies.

### II. Web Admin Dashboard (`admin-dashboard/`)
- **Purpose**: Provides administrative personnel with tools to monitor caterer performance.
- **Analytics Visuals**: Plots overall scores, flags critical rows, displays average meal ratings, and charts dynamic statistics using Recharts.
- **Reporting Engine**: Hosts date filters allowing administrators to stream customized Excel workbooks directly from the backend.

### III. FastAPI Core Backend (`backend/`)
- **Purpose**: The engine processing inputs, running validations, performing mathematical scoring, and managing database connections.
- **Validation**: Enforces strict Pydantic schemas rejecting invalid rating integers (e.g. <1 or >5).
- **Auto Migrations**: Includes a database startup migration routine that verifies table schemas and automatically adds missing columns (`overall_rating`, `is_critical`) if updating from a legacy version.

---

## 6. Technology Stack

| Technology | Purpose | Why Chosen | Location in Project |
| :--- | :--- | :--- | :--- |
| **React Native (Expo)** | Kiosk Client Framework | Allows rapid cross-platform Android/iOS deployment and quick local HTML preview. | `mobile-app/` |
| **React.js** | Admin Portal UI | Highly interactive component framework, Virtual DOM performance, unified state management. | `admin-dashboard/` |
| **FastAPI** | Backend Web API | Asynchronous ASGI execution speed, automated OpenAPI docs generation, built-in validation. | `backend/` |
| **SQL Server Express**| Primary Database | Robust ACID transaction safety, corporate compatibility. | Local host database service. |
| **SQLAlchemy ORM** | Relational Mapping | Parameterized SQL query security, avoiding raw SQL injections, structural model declarations. | `backend/database.py` |
| **OpenPyXL** | Excel Customizer | Programmatic spreadsheet workbook construction, cell formatting, border and color-fill injection. | `backend/routers/export.py` |
| **Uvicorn** | ASGI Web Server | Lightning-fast asynchronous server engine powering the FastAPI backend. | `backend/main.py` |
| **Recharts** | Frontend Charting | Modular SVG charts, responsive graphics, smooth transitions. | `admin-dashboard/src/` |

---

## 7. Code Workflows & Algorithmic Explanations

### I. Automated Meal Detection Algorithm
To avoid manual entry by users or canteen operators, the system automatically classifies meals using the local device's clock. This is handled using native JavaScript Date math in the kiosk client:

```javascript
const getMealType = () => {
  const hours = new Date().getHours();
  const mins = new Date().getMinutes();
  const currentTime = hours * 60 + mins; // Time in minutes since midnight

  if (currentTime >= 360 && currentTime < 660) {
    return 'Breakfast'; // 06:00 AM - 11:00 AM
  } else if (currentTime >= 660 && currentTime < 1140) {
    return 'Lunch'; // 11:00 AM - 07:00 PM
  } else if (currentTime >= 1140 && currentTime < 1380) {
    return 'Dinner'; // 07:00 PM - 11:00 PM
  } else if (currentTime >= 1380 && currentTime < 1410) {
    return 'Midnight Supper'; // 11:00 PM - 01:30 AM (Up to 1410 minutes)
  } else if (currentTime >= 0 && currentTime < 90) {
    return 'Midnight Supper'; // 12:00 AM - 01:30 AM (First 90 minutes of the new day)
  } else {
    return 'Early Morning'; // 01:30 AM - 06:00 AM
  }
};
```

### II. Critical Rating Calculation Logic
When the backend API receives a feedback submission at the `/feedback` POST endpoint, it executes an automated evaluation pipeline:
1. Validates the five scores (Quality, Taste, Hygiene, Cleanliness, Behavior) against the Pydantic schema constraints.
2. Computes the average:
   $$\text{Overall Rating} = \frac{Q + T + H + C + B}{5.0}$$
3. Evaluates the severity:
   $$\text{If } \text{Overall Rating} \le 2.0 \implies is\_critical = 1, \text{ else } 0$$
4. Commits the record with its dynamic timestamp to the database, ensuring immediate classification.

### III. Formatting Excel Outputs with OpenPyXL
To ensure administrators can spot poor caterer performance, the `/feedback/export` endpoint parses records and applies custom styling directly inside the generated spreadsheet bytes:

```python
# Create a bold red font styling context
critical_font = Font(name="Calibri", size=11, bold=True, color="FF0000")
critical_fill = PatternFill(start_color="FFCCCC", end_color="FFCCCC", fill_type="solid")

for row_idx, record in enumerate(feedbacks, start=2):
    # Populate cells...
    
    # If the feedback is flagged as critical, apply the highlights
    if record.is_critical == 1:
        for col_idx in range(1, 12):
            cell = ws.cell(row=row_idx, column=col_idx)
            cell.font = critical_font
            cell.fill = critical_fill
```
When openpyxl completes compiling the workbook, the server streams the binary bytes directly as an attachment file (`.xlsx`), which displays the highlighted entries instantly in Microsoft Excel.

---

## 8. Mobile & Tablet Kiosk Deployment Options

### Tamil Translation Dictionary Strategy
To support offline operation on rural factory floors, the bilingual language capability utilizes a local JavaScript translation dictionary file embedded directly inside the compiled kiosk codebase:

```javascript
const LOCAL_DICTIONARY = {
  en: {
    title: "Canteen Feedback Kiosk",
    food_quality: "Food Quality",
    food_taste: "Food Taste",
    food_hygiene: "Food Hygiene",
    cleanliness: "Cleanliness",
    staff_behavior: "Staff Behavior",
    submit: "Submit Feedback",
    comment_warning: "Please write a comment explaining your 1-star rating."
  },
  ta: {
    title: "உணவக கருத்துக்கணிப்பு",
    food_quality: "உணவின் தரம்",
    food_taste: "உணவின் சுவை",
    food_hygiene: "உணவு சுகாதாரம்",
    cleanliness: "சுத்தம் மற்றும் சுகாதாரம்",
    staff_behavior: "ஊழியர் நடத்தை",
    submit: "கருத்தைச் சமர்ப்பிக்கவும்",
    comment_warning: "உங்கள் 1-நட்சத்திர மதிப்பீட்டிற்கான காரணத்தை எழுதவும்."
  }
};
```
This strategy ensures **zero network latency** when toggling languages on touchscreens, preventing lags that could disrupt busy checkout queues.

### Browser Fallback Form (QR Code Submissions)
If tablet kiosks are offline or undergoing maintenance, the FastAPI server dynamically generates an offline QR code. Canteen managers can print this QR code and paste it on dining tables:
1. Employees scan the QR code using their personal mobile devices.
2. The browser automatically navigates to `http://<HOST_IP>:8000/static/feedback_form.html` (hosted on the local laptop).
3. Employees submit ratings directly from their mobile browser, ensuring zero downtime in data collection.
