# Smart Canteen Feedback Management System

## 1. Project Overview
The **Smart Canteen Feedback Management System** is a comprehensive, digital solution designed to streamline the collection, analysis, and management of employee feedback regarding canteen facilities. This project replaces traditional paper-based feedback methods with an intuitive mobile kiosk application, paired with a powerful web-based administrative dashboard. 

### Exhaustive Feature List (Everything Included)
We have packed this system with every feature necessary for a true industry-level production environment:
*   **Intelligent Rating Validation**: A 1-to-5 star rating system across 5 key metrics. If any category receives a '1', the system mandates a written comment.
*   **Critical Feedback Highlighting**: Automatically detects and flags feedback as "Critical" when the overall average rating is less than or equal to 2 (`overall_rating <= 2`).
*   **Continuous Auto Meal Detection**: The system covers a 24-hour cycle by checking the tablet's local system clock. It automatically assigns the exact meal without manual user input (Breakfast: 6am-11am, Lunch: 11am-7pm, Dinner: 7pm-11pm, Midnight Supper: 11pm-1:30am, Early Morning: 1:30am-6am).
*   **Web Dashboard Analytics**: Visual representation of data through Recharts graphs and KPIs, providing day-wise, month-wise, and all-time reporting.
*   **Mobile Admin Dashboard**: A built-in, hidden admin screen right on the tablet kiosk. Designed in a "Premium Light Mode" with soft floating shadows, it allows local managers to check stats without needing a PC.
*   **Native Excel Exports (.xlsx)**: Both the Web Dashboard and Mobile App can generate and download native Excel reports. The backend (using `openpyxl`) intelligently color-codes critical rows **red** directly inside the downloaded Excel file!
*   **Dynamic Data Filtering**: Admins can filter reports by specific dates, specific months, or specific meal types to compare performance.
*   **Multilingual Support**: The mobile interface supports both English and Tamil natively, using a local dictionary to ensure zero internet lag.
*   **Network Resilience**: The mobile app is programmed to automatically detect if it is being tested in a web browser or running on the physical tablet, seamlessly switching its API routing to prevent freezing.

### Technology Stack Used
*   **Frontend (Mobile App)**: React Native (Expo)
*   **Frontend (Admin Web)**: React.js
*   **Backend API**: FastAPI (Python)
*   **Database**: MS SQL Server (via SQLAlchemy ORM)

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
2.  **Backend API (Server)**: The brain of the system. It processes incoming data, performs validation, calculates the `overall_rating`, and assigns the `is_critical` flag.
3.  **Database**: Safely stores all the structured records.
4.  **Admin Dashboard (Client)**: A website that fetches aggregated data from the backend to display charts, export to Excel, and filter critical records.

### Modules Description
*   **Feedback Module**: The core interface where users provide 1-5 star ratings for Food Quality, Food Taste, Food Hygiene, Cleanliness, and Staff Behavior.
*   **Validation Module**: Enforces strict data rules (e.g., forcing a user to type a comment if they select a 1-star rating).
*   **Meal Detection Module**: A time-based algorithm that automatically assigns the correct meal tag based on the local device clock.
*   **Analytics Module**: Code on the server that does math on the database data (averages, counts, critical sums) so the dashboard can display it easily.
*   **Reporting Module**: Allows the administrator to export data securely into a color-coded Excel format for official record-keeping.

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

An **API (Application Programming Interface)** is simply a bridge that allows the mobile app and web dashboard to talk to the database. Below are the key endpoints and how to test them using **Postman** (a popular tool for testing APIs).

### Core Endpoints:
*   **`POST /feedback`** → Submit new feedback.
*   **`GET /feedback/critical`** → Fetch all records flagged as `is_critical = 1`.
*   **`GET /feedback/day-report`** → Get day-wise aggregated stats.
*   **`GET /analytics/monthly`** → Get detailed analytics for the graphs.
*   **`GET /feedback/export`** → Generates the formatted Excel file.

### How to Test APIs using Postman
Here is exactly how to test the core feedback submission endpoint manually using Postman:

1.  Open **Postman** and click **New Request**.
2.  Change the request method dropdown from `GET` to **`POST`**. *(POST means we are sending new data to the server).*
3.  In the URL bar, enter: `http://localhost:8000/feedback`
4.  Go to the **Body** tab, select **raw**, and change the format dropdown from `Text` to **`JSON`**. *(JSON is just a simple text format used to send structured data over the internet).*
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
4.  **Submission**: The app sends a `POST` request with the data payload to the FastAPI backend.
5.  **Backend Processing**: FastAPI calculates `overall_rating = sum(ratings)/5`. It then evaluates: `if overall_rating <= 2: is_critical = 1`.
6.  **Database Storage**: The structured record is committed to the database.
7.  **Admin Review**: An administrator logs into the React Dashboard. The dashboard makes `GET` requests to retrieve the data and draws the graphs on the screen.

---

## 5. Tools and Technologies Used

To provide a complete academic understanding, here is a breakdown of every specific tool utilized in the system, with beginner-friendly explanations of what they mean and *why* they were chosen:

*   **React Native (Expo)**: A framework used to build the mobile application. Expo provides a simplified workflow that allows developers to build a mobile app using web technologies (JavaScript) and seamlessly deploy it as a physical Android tablet kiosk app.
*   **Native JavaScript Date API (Auto Meal Detection)**: The automatic meal detection algorithm does not rely on any heavy external time-tracking libraries. Instead, it uses the built-in JavaScript `Date` object (`new Date().getHours()`). 
    *   *Why?* Native APIs run instantly directly on the tablet's processor. By using simple mathematical conversions (Hour × 60 + Minutes) natively, the app requires zero internet connection to figure out the time, ensuring 100% reliable offline scheduling.
*   **Local State Translation Dictionary (Tamil Support)**: Instead of using an external internet service like Google Translate, the Tamil language feature uses a hardcoded dictionary embedded directly in the app's code. 
    *   *Why?* To guarantee that the application functions 100% offline, has zero loading lag when switching languages, and ensures we can use perfectly accurate, culturally specific canteen terminology rather than awkward robotic translations.
*   **Dynamic UI Styling (Critical Highlights)**: The red glowing highlights for critical feedback are achieved using React Native's styling system. 
    *   *Why?* By automatically checking if a record is critical (`is_critical === 1`), the code dynamically injects a red CSS-like style directly into the screen. This ensures admins' eyes are instantly drawn to major problems without needing to click or search.
*   **FastAPI**: Used for the backend server. 
    *   *Why?* It is an extremely fast Python framework that automatically validates data. This guarantees that bad or broken data (e.g., someone trying to submit a rating of 6 out of 5) is rejected before it can crash the database.
*   **Uvicorn (ASGI Web Server)**: **ASGI** stands for *Asynchronous Server Gateway Interface*. It is a modern standard that allows a server to handle thousands of requests at the exact same time without freezing or making people wait in line.
    *   *Why?* FastAPI requires an ASGI server to run its asynchronous code, and Uvicorn is the lightning-fast engine that powers it.
*   **SQLAlchemy (ORM)**: **ORM** stands for *Object-Relational Mapping*. It is a tool that automatically translates normal Python code into database commands (SQL).
    *   *Why?* It allows developers to interact with the database securely without writing raw SQL queries. This drastically reduces the risk of "SQL Injection" hacking attacks and allows the system to securely communicate with the enterprise MS SQL Server.
*   **OpenPyXL**: A Python library used in the backend for Excel manipulation.
    *   *Why?* It is used to generate the `.xlsx` exports. More importantly, we used it to inject formatting rules so that critical feedback rows are colored red directly inside the downloaded Excel file!
*   **React.js**: A popular tool created by Facebook used for building the administrative web dashboard. Its component-based architecture makes it ideal for building complex, interactive websites.
*   **Recharts**: A charting tool built specifically for React. 
    *   *Why?* Used specifically to generate the beautiful, interactive bar charts and line graphs on the admin dashboard, visually representing the raw analytics data.
*   **Axios**: A JavaScript tool used to make HTTP requests over the internet.
    *   *Why?* Used inside the React dashboard to fetch data from the FastAPI backend. It is much simpler to use and handles data conversion more cleanly than the default browser fetching tools.

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
