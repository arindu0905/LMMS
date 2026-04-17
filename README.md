#  📱 Laser Mobile Management System (LMMS)

> A comprehensive, full-stack Point of Sale (POS), Inventory, and Service tracking platform custom-built for modern mobile phone retail shops and repair centers.

---

## 🚀 Project Overview

The **Laser Mobile Management System (LMMS)** is an integrated enterprise solution designed to bridge the gap between customer-facing storefronts and internal retail operations. It provides a seamless experience for walk-in customers to browse products online, while empowering internal staff—ranging from Admins and Sales Reps to Technicians and Inventory Managers—with powerful, role-specific tools to manage daily operations.

## ✨ Key Features

### 🔐 Robust Role-Based Access Control (RBAC)
The core of LMMS is a strict, deeply integrated role-based security system powered by Supabase Auth.
*   **Admins**: Full uninhibited access to all system modules, billing, staff creation, and reports.
*   **Sales Representatives**: Access to the Quick Sale Terminal, billing logs, and customer CRM.
*   **Technicians**: Isolated access strictly for tracking Active Repair Queues, device diagnostics, and updating repair statuses.
*   **Inventory Managers**: Dedicated portals for tracking stock levels, triggering low-stock alerts, and managing supplier purchase orders.
*   **Suppliers**: Special external portal access to view and fulfill incoming purchase orders.

### 🛍️ Customer Storefront & E-Commerce
*   Modern, animated landing page showcasing featured products and services.
*   Real-time shopping cart context with synced pricing and multi-currency support.
*   Customer authentication to leave product reviews and view personal repair estimates.
*   Dynamic theme switching (Dark/Light mode).

### 💼 Operational Dashboards
*   **Intelligent Routing**: Upon login, internal staff are routed automatically to their role-specific dashboard.
*   **Quick Sale Terminal**: Instant barcode scanning or manual entry for rapid POS checkout.
*   **Repair Tracking CRM**: Complete lifecycle management of customer devices (Intake -> Diagnosis -> Awaiting Parts -> Fixed -> Picked Up).
*   **Automated Email Notifications**: Uses `Nodemailer` to automatically fire beautiful, formatted emails for System Registration Welcomes, Repair Completions, and Supplier Purchase Orders.
*   **Activity Feed**: Live timeline of recent system sales, inventory changes, and repair log updates.

---

## 🛠️ Technology Stack

**Frontend (Client)**
*   **Framework**: React (Vite)
*   **Styling**: Tailwind CSS, Framer Motion (for fluid animations)
*   **Icons**: Lucide React
*   **Routing**: React Router DOM (v6)

**Backend (Server)**
*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Database & Auth**: Supabase (PostgreSQL + GoTrue Auth)
*   **Mailing**: Nodemailer (SMTP Integration)
*   **Security**: CORS, custom authentication middleware protecting API routes.

---

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed on your local machine:
1.  **Node.js** (v18.x or higher)
2.  **npm** (comes with Node.js)
3.  A **Supabase** account (for your Database and Authentication services).

---

## 🚀 Getting Started

### 1. Clone the Repository
Clone this repository to your local machine.

### 2. Install Dependencies
This project is structured as a monorepo with separate `client` and `server` directories. You must install dependencies for both.

**For the Backend:**
\`\`\`bash
cd server
npm install
\`\`\`

**For the Frontend:**
\`\`\`bash
cd client
npm install
\`\`\`

### 3. Environment Variables Configuration

**Backend (`server/.env`)**
Create a `.env` file in the root of the `server` directory and add the following keys. 
> *Note: For user registration emails and Supabase triggers to work, you must also configure your SMTP Provider inside your Supabase Project Dashboard.*
\`\`\`env
# Database Credentials
SUPABASE_URL=https://your-project-url.supabase.co
SUPABASE_KEY=your-supabase-service-role-key-or-anon-key
PORT=5000

# Automated Mailing (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
\`\`\`

**Frontend (`client/.env`)**
Create a `.env` file in the root of the `client` directory:
\`\`\`env
VITE_SUPABASE_URL=https://your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_URL=http://localhost:5000/api
\`\`\`

### 4. Running the Application locally
To spin up the full stack natively:

**Open Terminal 1 (Backend):**
\`\`\`bash
cd server
npm start
\`\`\`
*The server will start running on port 5000.*

**Open Terminal 2 (Frontend):**
\`\`\`bash
cd client
npm run dev
\`\`\`
*Vite will compile and launch the application (usually on port 5173).*

---

## 🔐 Built-In Default Routes
- **Storefront / Landing Page**: \`/\`
- **Customer Sign in**: \`/login\`
- **Internal Staff Dashboard**: \`/dashboard\`
- **Supplier Order Portal**: \`/dashboard/supplier-portal\`

---

## 💌 Acknowledgments
Designed & Engineered with modern UI/UX principles to demonstrate advanced Agentic Coding workflows and scalable retail architectures.
