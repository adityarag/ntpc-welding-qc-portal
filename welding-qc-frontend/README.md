# Welding QC Portal

A full-stack quality control web application designed for managing and tracking welding operations, including Offer Sheets, Welder Registrations, Post Weld Heat Treatment (PWHT), and Non-Destructive Testing (NDT) records.

## Project Structure

This workspace operates as a monorepo containing two distinct projects:

- **/Welding_QC_Portal**: The frontend web application. Built with React, Vite, and Tailwind CSS.
- **/welding-qc-backend**: The backend API. Built with Node.js, Express, and Sequelize (SQLite/MySQL).

## Getting Started

To run the application locally, you will need to start both the frontend and backend servers simultaneously in separate terminal windows.

### 1. Starting the Backend Server
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd welding-qc-backend
   ```
2. Install dependencies (if you haven't already):
   ```bash
   npm install
   ```
3. Start the backend development server:
   ```bash
   npm run dev
   ```
*The backend will automatically create the database and run on `http://localhost:5000`.*

### 2. Starting the Frontend App
1. Open a **new, second terminal** and navigate to the frontend folder:
   ```bash
   cd Welding_QC_Portal
   ```
2. Install dependencies (if you haven't already):
   ```bash
   npm install
   ```
3. Start the frontend development server:
   ```bash
   npm run dev
   ```
*The frontend will run on `http://localhost:5173`. Click the local link in the terminal to open the app in your browser.*

## Default Test Accounts

The backend database is automatically seeded with test accounts. Use these to switch between roles on the login screen. All accounts share the same password:

**Password for all users:** `password123`

- **Username:** `admin` (Auth Level 3 - Head Verifier)
- **Username:** `verifier` (Auth Level 2 - Standard Verifier)
- **Username:** `supervisor` (Auth Level 1 - Supervisor with creation privileges)
