# Smart Canteen Feedback Management System — Step-by-Step Fresh System Setup Guide
### How to Deploy the GitHub Project on a New Laptop from Scratch

This guide is designed for deploying the **Smart Canteen Feedback Management System** repository on a brand-new Windows machine that does **not** have Node.js, Python, SQL Server, or Git pre-installed. Follow these steps in order to download, configure, and launch the React Native mobile kiosk app, the React.js admin dashboard, the FastAPI backend server, and the relational database.

---

## Part 1: Download & Install Software Prerequisites

### Step 1: Install Git (Version Control)
To pull your code files directly from your GitHub repository, you need Git:
1. Download the installer from the official page: [https://git-scm.com/download/win](https://git-scm.com/download/win)
2. Run the downloaded `.exe` installer.
3. Click **Next** on all default options, and click **Install**.
4. Once finished, verify by opening a new command prompt (CMD) and typing:
   ```bash
   git --version
   ```

### Step 2: Install Node.js (v18.20.8 / LTS Runtime)
The React web dashboard and React Native Expo mobile kiosk app depend on Node.js. The APK compilation script specifically references **v18.20.8**:
1. Download Node.js v18.20.8 or the current LTS version from: [https://nodejs.org/en/download/prebuilt-installer](https://nodejs.org/en/download/prebuilt-installer) (or use NVM for Windows: [https://github.com/coreybutler/nvm-windows/releases](https://github.com/coreybutler/nvm-windows/releases)).
2. Run the downloaded installer.
3. Accept the license agreement, leave all settings at default, and click **Install**.
4. Once finished, verify the installation in command prompt:
   ```bash
   node -v
   npm -v
   ```

### Step 3: Install Python (FastAPI Backend Runtime)
Python executes your FastAPI server, handles SQLAlchemy ORM connection queries, and compiles the color-coded Excel reports:
1. Download Python v3.10 or v3.11 from: [https://www.python.org/downloads/windows/](https://www.python.org/downloads/windows/)
   > [!IMPORTANT]
   > Ensure you install Python v3.10 or v3.11 as they are highly stable on Windows for database driver modules like `pyodbc`.
2. Run the installer.
3. **CRITICAL STEP**: Before clicking Install, check the box at the bottom that says: **"Add Python to PATH"** (or **"Add python.exe to PATH"**). If you miss this, Windows will not recognize python commands.
4. Click **Install Now**.
5. Once finished, verify by opening command prompt:
   ```bash
   python --version
   ```

### Step 4: Install SQL Server Express & SSMS (Relational Database)
The canteen app uses MS SQL Server for database persistence:
1. Download the **SQL Server 2022 Express Edition** installer: [https://www.microsoft.com/en-us/sql-server/sql-server-downloads](https://www.microsoft.com/en-us/sql-server/sql-server-downloads)
2. Run the installer and select the **Basic** installation type.
3. Accept the defaults and click **Install**.
4. When the installation completes, the installer will display a button that says: **"Install SSMS"** (SQL Server Management Studio). Click it to download SSMS, or download it manually from: [https://learn.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms](https://learn.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms)
5. Run the downloaded SSMS setup file, install it, and restart your computer when prompted.

### Step 5: Install ODBC Driver 17 for SQL Server
The backend connects to SQL Server via Python's `pyodbc` driver module, which requires the Microsoft ODBC driver:
1. Download **ODBC Driver 17 for SQL Server (x64)**: [https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server](https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server)
2. Open and run the installer, clicking **Next** and accepting the defaults to install the driver on your system.

### Step 6: Install Java Development Kit (JDK 17 - For Android APK Compilation)
To build and package your React Native Expo kiosk application into a physical, standalone `.apk` package:
1. Download **JDK 17** (Windows x64 Installer) from Oracle: [https://www.oracle.com/java/technologies/downloads/#java17](https://www.oracle.com/java/technologies/downloads/#java17)
2. Run the installer and proceed with the default configurations.
3. Once complete, verify the runtime:
   ```bash
   java -version
   ```

---

## Part 2: Pull the Code & Prepare the Database Schema

### Step 1: Clone the GitHub Repository
1. Open a command prompt (CMD) and navigate to the folder where you want to store the project (e.g. `C:\` or `D:\` drive).
2. Clone the repository using Git:
   ```bash
   git clone https://github.com/Keerthana2225/canteen_app.git
   cd canteen_app
   ```

### Step 2: Initialize your Database Schema
1. Open **SQL Server Management Studio (SSMS)** on the new laptop.
2. Click **Connect** and log in using Windows Authentication (`Server Name: localhost\SQLEXPRESS01` or similar).
3. Click the **File** -> **Open** -> **File...** menu, and select the schema SQL file located in your project directory at:
   `canteen_app/database/schema.sql`
4. Click the **Execute** button at the top (or press `F5`) to run the script. This will automatically:
   - Create the relational database `CanteenFeedbackDB`.
   - Create the `Canteen` table.
   - Create the `Feedback` table.
   - Inject the check constraints ensuring rating scales are validated strictly between 1 and 5.
   - Seed a default canteen record (`Main Canteen`, `Ground Floor, Block A`).

---

## Part 3: Configure SQL Server Security & Access

The FastAPI backend runs locally and must connect securely to your SQL Server Express instance. Enforce these security settings on the new machine:

### I. Enable TCP/IP Protocols
1. Open the **SQL Server Configuration Manager** from the Windows Search bar.
2. Click **SQL Server Network Configuration** -> select **Protocols for SQLEXPRESS** (or your active instance name).
3. Right-click **TCP/IP** and click **Enable**.
4. Right-click **TCP/IP** and select **Properties**. Go to the **IP Addresses** tab.
5. Scroll down to the bottom section (**IPAll**).
6. Clear **TCP Dynamic Ports** (leave it empty) and set **TCP Port** to `1433`.
7. Click **Apply** and click **OK**.
8. Go to **SQL Server Services** on the left menu, right-click **SQL Server (SQLEXPRESS)**, and click **Restart**.

### II. Enable Windows & SQL Authentication (Mixed Mode)
1. Open **SSMS**, right-click the top-level database server connection in Object Explorer, and click **Properties**.
2. Select the **Security** tab.
3. Under **Server authentication**, select **SQL Server and Windows Authentication mode**.
4. Click **OK**.

---

## Part 4: Configure Project Environment Files

Configure the network and environment variables in your project directories before launching.

### I. Configure Backend Variables (`backend/.env`)
1. Navigate to the `backend/` directory in your project folder.
2. Open `.env` (or create it if missing) and configure the environment:
   ```env
   DB_SERVER="localhost\SQLEXPRESS01"
   DB_NAME="CanteenFeedbackDB"
   DB_DRIVER="ODBC Driver 17 for SQL Server"
   ```
   > [!NOTE]
   > The backend code is programmed to automatically connect using **Windows Authentication** (`Trusted_Connection=yes;`), meaning no password management is needed as long as the backend runs under an authorized system user!

### II. Configure Mobile App API URL (`mobile-app/config.js`)
To allow the mobile tablet kiosk to communicate with the backend, update the local IP address:
1. Open a command prompt on the laptop and find your local network IP:
   ```bash
   ipconfig
   ```
   Find your active IPv4 Address (e.g., `192.168.1.33`).
2. Open the file `mobile-app/config.js`.
3. Modify the `API_URL` to match your local IP address:
   ```javascript
   import { Platform } from 'react-native';
   
   const CONFIG = {
     API_URL: Platform.OS === 'web' ? 'http://localhost:8000' : 'http://192.168.1.33:8000',
   };
   
   export default CONFIG;
   ```
   > [!IMPORTANT]
   > Make sure the host laptop and the mobile tablet kiosk are connected to the **SAME Wi-Fi network**, otherwise the tablet won't be able to reach your backend API.

---

## Part 5: Install Project Dependencies

Open separate command prompts or a split terminal window in the root `canteen_app/` folder and run the installation procedures:

### I. Install Backend Python Virtual Environment & Packages
```bash
# Navigate to the backend directory
cd backend

# Create a Python virtual environment
python -m venv venv

# Activate the virtual environment
# Windows Command Prompt (CMD):
venv\Scripts\activate.bat
# Windows PowerShell:
venv\Scripts\Activate.ps1

# Install requirements
pip install -r requirements.txt
```

### II. Install Mobile Kiosk App Node Packages
```bash
# Navigate to the mobile app directory
cd mobile-app

# Install package dependencies
npm install
```

### III. Install Admin Dashboard Node Packages
```bash
# Navigate to the admin dashboard directory
cd admin-dashboard

# Install package dependencies
npm install
```

---

## Part 6: Running the Entire System

To run the application locally, open three separate command prompt terminals and start the services in order:

### Terminal 1: FastAPI Backend Service
Starts your database gateway API on Port 8000. It is configured to listen on `0.0.0.0` so mobile devices on the network can connect:
```bash
cd backend
venv\Scripts\activate.bat
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
*Alternatively, you can double-click the **`start-system.bat`** file in the root project folder to auto-detect your local IP address and launch the FastAPI server instantly.*

### Terminal 2: Admin Web Dashboard
Starts the React development server for the administrative web interface:
```bash
cd admin-dashboard
npm start
```
Your browser will automatically open to `http://localhost:3000` to show the admin console.

### Terminal 3: React Native Expo Mobile App
Starts the Expo Bundler for the physical kiosk tablet interface:
```bash
cd mobile-app
npx expo start
```
- **Local Testing**: Press `w` in the terminal to launch the app inside your local web browser.
- **Physical Tablet Deployment**: Scan the QR code displayed in the terminal using the **Expo Go** application on your Android tablet or iPad.

---

## Part 7: Building and Packaging the Android APK

If you need to compile a native standalone `.apk` package to install permanently on your physical Android canteen kiosk:

1. Ensure **Android Studio** and the **Android SDK** build tools are installed.
2. Ensure you have copied the `canteen-release.keystore` inside `mobile-app/` folder.
3. From the root directory, execute the pre-configured build script:
   ```bash
   build-apk.bat
   ```
4. The batch script will automatically:
   - Clean up previous builds and compile the React Native JavaScript bundle.
   - Embed cleartext networking permissions so it can connect to local network APIs.
   - Inject the `canteen-release.keystore` certificate signatures into the Gradle build engine.
   - Run a release compile (`gradlew assembleRelease`).
5. Once complete, it will automatically open the folder containing your final signed installer:
   `mobile-app/android/app/build/outputs/apk/release/app-release.apk`
6. Transfer this `.apk` to your tablet via USB or local network and install it.
