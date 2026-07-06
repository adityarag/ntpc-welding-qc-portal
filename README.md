# NTPC Welding QC Portal

The **NTPC Welding QC Portal** is a comprehensive, end-to-end Enterprise Web Application designed to digitize, track, and streamline the Quality Control (QC) lifecycle of structural welding joints. Built specifically for industrial construction and heavy engineering use cases (such as power plant setup), this portal replaces paper-heavy, error-prone manual processes with a centralized digital source of truth.

---

## 🎯 What This Project Solves

Managing welding quality control involves complex workflows: assigning work, tracking which welder welded which joint, managing Non-Destructive Testing (RT, PAUT, MPI), Post-Weld Heat Treatment (PWHT), and maintaining clear audit logs for accountability. 

This portal automates reporting, tracks repair cycles, enforces strict role-based access control, and generates presentation-ready PDF and Excel reports instantly.

---

## ✨ Key Features

- **Role-Based Access Control (RBAC):** Strict hierarchy distinguishing between Admins, Quality Verifiers, and Ground Supervisors.
- **Joint Lifecycle Tracking:** Track a weld joint from initial creation through RT attempts, PWHT, and final acceptance.
- **Defect & Repair Management:** Supports multi-attempt repair cycles (e.g., if a joint fails RT, an alert is generated and a re-weld is tracked).
- **Enterprise Reporting Hub:** 13 specialized reports including Master Logs, Supervisor/Welder Performance, Daily Productivity, and Failure Analysis.
- **Export Capabilities:** Instantly generate formatted PDFs (via `jsPDF`) and Excel spreadsheets (via `SheetJS`).
- **File Management:** Upload and manage scanned PDF reports for RT, PWHT, PAUT, and MPI records directly attached to the joint data.
- **Real-time Dashboards:** Top-level KPIs summarizing total joints, clearance rates, and pending work.

---

## 🏗️ Project Architecture

This project follows a decoupled Client-Server architecture.

```text
Welding QC_Portal/
├── welding-qc-frontend/    # React 18 (Vite + Tailwind CSS)
│   ├── src/components/     # UI Components organized by feature/tabs
│   ├── src/api/            # Centralized Axios configuration
│   └── src/context/        # React Context API for global state
│
└── welding-qc-backend/     # Node.js + Express
    ├── controllers/        # Core business logic
    ├── models/             # Sequelize ORM Database Schema
    ├── routes/             # RESTful API Endpoints
    └── middleware/         # JWT Authentication & Role Guards
```

### Technology Stack
* **Frontend:** React.js, Vite, Tailwind CSS, Axios, jsPDF, SheetJS.
* **Backend:** Node.js, Express.js, Sequelize ORM.
* **Database:** MySQL / SQLite.
* **Authentication:** JSON Web Tokens (JWT).

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MySQL Server (if running in production mode)

### 1. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd welding-qc-backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables. Create a `.env` file in the `welding-qc-backend` directory based on your environment (e.g., Database credentials, JWT Secret, Port). *(See `.env.example` if available)*.
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The backend will typically run on `http://localhost:5000`.*

### 2. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd welding-qc-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure your API connection. Create a `.env` file in the `welding-qc-frontend` directory:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   VITE_BACKEND_URL=http://localhost:5000
   ```
   *(Note: If testing on a mobile device on the same Wi-Fi, replace `localhost` with your computer's local IP address).*
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *The frontend will typically run on `http://localhost:5173` or `5174`.*

---

## 📖 How to Use (Workflow Guide)

The system relies on a three-tier user structure to ensure data integrity.

### Phase 1: Work Assignment (Admin Role)
1. Log in as an **Admin**.
2. Navigate to the **Offer Sheet** tab.
3. Create a new Offer Sheet, assigning a target number of joints to a specific **Supervisor** for the day.

### Phase 2: Ground Execution (Supervisor Role)
1. Log in as a **Supervisor**.
2. Open your assigned **Offer Sheet** and begin creating **Joints**. Assign structural IDs, Area Systems, and the specific Welder who performed the work.
3. Once welding is complete, update the joint parameters (Electrode, WPS Number).
4. Conduct Non-Destructive Testing (e.g., RT). Upload the physical PDF report, log any defects (Porosity, Slag, etc.), and submit the batch for verification.

### Phase 3: Quality Assurance (Verifier Role)
1. Log in as a **Verifier**.
2. Navigate to the **RT Submissions** or **PWHT** tab.
3. Review the submitted data against the uploaded PDF report.
4. Click **Accept** or **Reject**. 
   - *If Rejected:* The Supervisor is automatically alerted to perform a repair, creating a secondary attempt lifecycle for that joint.

### Phase 4: Analytics
- Admins and Verifiers can visit the **Reports** tab at any time to generate real-time Excel and PDF documents analyzing clearance rates, welder defect percentages, and daily productivity.

---

## 🔒 Security Note
This application utilizes Role-Based Access Control. Ground-level Supervisors cannot verify their own joints or view enterprise-wide metrics. Always ensure JWT secrets and database credentials in your `.env` files are kept secure and never committed to version control.
