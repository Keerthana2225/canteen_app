# Smart Canteen Feedback Management System

## 1. Project Overview
The **Smart Canteen Feedback Management System** is a comprehensive, digital solution designed to streamline the collection, analysis, and management of employee feedback regarding canteen facilities. This project replaces traditional paper-based feedback methods with an intuitive mobile kiosk application, paired with a powerful web-based administrative dashboard. 

### Key Features
*   **Intelligent Rating Validation**: A 1-to-5 star rating system across 5 key metrics. If any category receives a '1', the system mandates a written comment.
*   **Critical Feedback Highlighting**: Automatically detects and flags feedback as "Critical" when the overall average rating is less than or equal to 2 (`overall_rating <= 2`), ensuring immediate administrative attention.
*   **Auto Meal Detection**: Continuously checks the current system time to automatically assign feedback to the correct meal period (Breakfast, Lunch, Dinner, Midnight Supper, Early Morning Breakfast) with zero gaps.
*   **Dashboard Analytics**: Visual representation of data through graphs and KPIs, providing day-wise, month-wise, and all-time reporting.
*   **Multilingual Support**: The mobile interface supports both English and Tamil natively without requiring internet access for translation.

### Technology Stack Used
*   **Frontend (Mobile App)**: React Native (Expo)
*   **Frontend (Admin Web)**: React.js
*   **Backend API**: FastAPI (Python)
*   **Database**: MS SQL Server / SQLite (via SQLAlchemy ORM)

### Installation and Setup Instructions

#### Backend (FastAPI)
1. Navigate to the backend directory: `cd backend`
2. Create a virtual environment: `python -m venv venv`
3. Activate the virtual environment: `.\venv\Scripts\activate` (Windows)
4. Install dependencies: `pip install -r requirements.txt`
5. Run the server: `uvicorn main:app --reload --host 0.0.0.0 --port 8000`

#### Mobile App (React Native Expo)
1. Navigate to the mobile app directory: `cd mobile-app`
2. Install dependencies: `npm install`
3. Start the Expo server: `npx expo start`
4. Use the Expo Go app on your mobile device to scan the QR code.

#### Admin Dashboard (React)
1. Navigate to the dashboard directory: `cd admin-dashboard`
2. Install dependencies: `npm install`
3. Start the development server: `npm start`
4. Open your browser to `http://localhost:3000`

### Folder Structure Overview
```text
canteen_app/
│
├── backend/               # FastAPI Server, Database Models, Routers
├── mobile-app/            # React Native Expo application (Kiosk)
├── admin-dashboard/       # React.js web dashboard
├── database/              # DB backups/exports (if applicable)
└── README.md              # Project Documentation
```

### Links
*   **GitHub Repository**: [https://github.com/Keerthana2225/canteen_app](https://github.com/Keerthana2225/canteen_app)

---

## 2. Full Project Documentation

### Introduction
**Problem Statement:** Many corporate and industrial canteens rely on manual, paper-based feedback mechanisms. These methods are inefficient, prone to data loss, and delay critical responses to poor food quality or hygiene issues.
**Need for the System:** A digital solution is required to instantly capture employee sentiments, automatically detect critical service failures, and provide administrative staff with actionable data in real time.

### Objectives
*   **Improve Canteen Quality**: Foster continuous improvement using structured, empirical feedback.
*   **Detect Critical Issues**: Implement automated logic to instantly highlight severe complaints, preventing escalating dissatisfaction.
*   **Provide Analytics**: Empower decision-makers with comprehensive, day-wise, and meal-wise reporting dashboards.

### System Architecture
The system operates on a modern 3-tier architecture:
1.  **Mobile App (Client)**: Acts as a physical kiosk in the canteen. Users submit ratings.
2.  **Backend API (Server)**: A RESTful FastAPI server processes incoming JSON data, performs validation, calculates the `overall_rating`, and assigns the `is_critical` flag.
3.  **Database**: SQLAlchemy safely stores the records.
4.  **Admin Dashboard (Client)**: Fetches aggregated data from the backend to display charts, export to Excel, and filter critical records.

### Modules Description
*   **Feedback Module**: The core UI where users provide 1-5 star ratings for Food Quality, Food Taste, Food Hygiene, Cleanliness, and Staff Behavior.
*   **Validation Module**: Enforces strict data integrity (e.g., mandatory comments for 1-star ratings).
*   **Meal Detection Module**: A time-based algorithm that automatically assigns the correct meal tag based on the local device clock (e.g., 07:00-11:00 = Breakfast), ensuring no manual selection errors.
*   **Analytics Module**: Backend routers that aggregate SQL data (averages, counts, critical sums) grouped by month and meal type.
*   **Reporting Module**: Allows the administrator to export data securely into Excel format for official record-keeping.

### Features Explanation
*   **Rating System**: Uses a 1-5 scale across 5 granular categories to pinpoint exact areas of improvement.
*   **Comment Validation**: If any user selects a rating of '1' for any category, the submit button locks until a written explanation is provided in the comments field.
*   **Critical Feedback Logic**: The backend calculates the `overall_rating` (average of the 5 categories). If `overall_rating <= 2`, the database row is permanently flagged with `is_critical = 1`.
*   **Continuous Auto-Detection**: Covers a 24-hour cycle (Breakfast, Lunch, Dinner, Midnight Supper, Early Morning Breakfast) ensuring there are no gap periods where feedback cannot be submitted.
*   **Dashboard Highlights**: In the admin view, critical feedback records are highlighted in striking red hues to demand immediate attention.
*   **Bilingual Accessibility**: A global toggle instantly translates the feedback UI between English and Tamil.

### Database Design
The core table structure (`Feedback`):
*   `id` (Primary Key, Auto-increment)
*   `canteen_id`, `canteen_name` (Foreign Key / Identifiers)
*   `meal_type` (String: Breakfast, Lunch, etc.)
*   `food_quality`, `food_taste`, `food_hygiene`, `staff_behavior`, `cleanliness` (Integer 1-5)
*   `overall_rating` (Float, auto-calculated average)
*   `is_critical` (Integer/Boolean, auto-flagged if overall <= 2)
*   `comments` (String, mandatory if any rating = 1)
*   `feedback_date` (Date)
*   `created_at` (Timestamp)

---

## 3. API Documentation Section

The backend APIs handle data securely. Below are the key endpoints and how to test them using **Postman**.

### Core Endpoints:
*   **`POST /feedback`** → Submit new feedback.
*   **`GET /feedback/critical`** → Fetch all records flagged as `is_critical = 1`.
*   **`GET /feedback/day-report`** → Get day-wise aggregated stats.
*   **`GET /analytics/monthly`** → Get detailed analytics for the graphs.

### How to Test APIs using Postman
Since you only have Postman, here is exactly how to test the core feedback submission endpoint manually:

1.  Open **Postman** and click **New Request**.
2.  Change the request method dropdown from `GET` to **`POST`**.
3.  In the URL bar, enter: `http://localhost:8000/feedback`
4.  Go to the **Body** tab, select **raw**, and change the format dropdown from `Text` to **`JSON`**.
5.  Paste the following test data into the box:
    ```json
    {
      "canteen_name": "Main Canteen",
      "canteen_id": 1,
      "meal_type": "Lunch",
      "food_quality": 2,
      "food_taste": 2,
      "food_hygiene": 2,
      "staff_behavior": 2,
      "cleanliness": 2,
      "comments": "The food was completely cold."
    }
    ```
6.  Click **Send**. You should receive a `201 Created` status with a success message. Because all scores are `2`, the backend will automatically set the `is_critical` flag to `1` in the database!

---

## 4. Code Workflow Explanation

1.  **User Interaction**: An employee approaches the tablet kiosk running the React Native Mobile App.
2.  **Meal Auto-Detection**: The app silently checks the system clock and assigns the `meal_type` parameter automatically (e.g., "Lunch").
3.  **Input & Validation**: The user taps 1-5 stars for the categories. If they tap '1' star, the React Native state immediately enforces a mandatory written comment.
4.  **Submission**: The app sends a `POST` request with a JSON payload to the FastAPI backend using the JavaScript `fetch()` API.
5.  **Backend Processing**: FastAPI calculates `overall_rating = sum(ratings)/5`. It then evaluates: `if overall_rating <= 2: is_critical = 1`.
6.  **Database Storage**: The structured record is committed to the database via SQLAlchemy ORM.
7.  **Admin Review**: An administrator logs into the React Dashboard. The dashboard makes `GET` requests using Axios and renders the new data points on the Recharts graphs.

---

## 5. Tools and Technologies Used

To provide a complete academic understanding, here is a breakdown of every specific tool and technique utilized in the system and *why* it was chosen:

*   **React Native (Expo)**: Used for the mobile application. Expo provides a managed workflow that drastically speeds up development and allows the app to be seamlessly deployed as a physical Android tablet kiosk.
*   **Local State Translation Dictionary (Tamil Support)**: Instead of using an external API like Google Translate, the Tamil language feature uses a hardcoded JavaScript dictionary object (`TRANSLATIONS`) managed by React's `useState` hook. 
    *   *Why?* To guarantee that the application functions 100% offline, has zero loading latency when switching languages, and ensures perfect, culturally accurate canteen terminology.
*   **Dynamic UI Styling (Critical Highlights)**: The red glowing highlights for critical feedback are achieved using React Native's `StyleSheet` and conditional rendering. 
    *   *Why?* By checking `if (record.is_critical === 1)`, the UI dynamically injects a specific CSS-like style (`backgroundColor: '#FEF2F2'`, `borderColor: '#DC2626'`) strictly on the client side, ensuring admins' eyes are drawn instantly to problems.
*   **FastAPI**: Used for the backend server. 
    *   *Why?* Chosen for its extreme execution speed and automatic data validation using Python's Pydantic models. It guarantees that bad data (e.g., a rating of 6 out of 5) cannot crash the database.
*   **Uvicorn**: Used as the ASGI web server. 
    *   *Why?* FastAPI is an asynchronous framework, and Uvicorn provides the lightning-fast asynchronous server required to run it.
*   **SQLAlchemy (ORM)**: Object-Relational Mapping library used to talk to the database. 
    *   *Why?* It allows developers to interact with the database using Python objects instead of writing raw SQL queries. This drastically reduces the risk of "SQL Injection" hacking attacks and makes it easy to switch from SQLite to MS SQL Server without rewriting code.
*   **React.js**: Used for the administrative web dashboard. React's component-based architecture makes it ideal for building complex interfaces.
*   **Recharts**: A charting library built for React. 
    *   *Why?* Used specifically to generate the beautiful, interactive bar charts and line graphs on the admin dashboard, visually representing the JSON analytics data.
*   **Axios**: A JavaScript HTTP client. 
    *   *Why?* Used inside the React dashboard to fetch data from the FastAPI backend. It is simpler and handles JSON conversion more cleanly than the standard `fetch()` API.

---

## 6. Setup and Execution Guide

### Backend Execution
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
*(Note: `--host 0.0.0.0` ensures the server is accessible by mobile devices on the same Wi-Fi network).*

### Mobile App Execution
```bash
cd mobile-app
npm install
npx expo start
```

### Admin Dashboard Execution
```bash
cd admin-dashboard
npm install
npm start
```

---

## 7. GitHub Usage Section

### Clone the Repository
To pull the project code to a new local machine:
```bash
git clone https://github.com/Keerthana2225/canteen_app
```

### Push Changes (Updating Code)
When you modify files, run the following sequence to push updates to GitHub:
```bash
git add .
git commit -m "Describe your updates here"
git push origin main
```

### Pull Updates
To fetch the latest code from the repository:
```bash
git pull origin main
```

---

## 8. Conclusion
The **Smart Canteen Feedback Management System** successfully digitizes and automates the feedback collection process. By bridging modern frontend frameworks (React/React Native) with a high-performance Python backend (FastAPI), the system ensures that user complaints are never lost. The intelligent integration of a "Critical" feedback flag guarantees that severe service or hygiene issues are immediately isolated, allowing administrators to take proactive, data-driven actions. Future enhancements could include push notifications for critical alerts, predictive AI analysis of textual comments, and integration with employee RFID cards for authenticated submissions.
