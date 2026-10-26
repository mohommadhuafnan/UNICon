# UniConnect — The University Community & Campus Intelligence Platform

> **"Every Issue Heard. Every Opportunity Found."**  
> *One university community, one connected platform.*

UniConnect is a full-stack, production-oriented web application designed to solve information fragmentation and issue tracking across higher education campuses. It unifies scattered WhatsApp groups, Facebook notices, departmental bulletin boards, and complaint logs into a single, verified, real-time intelligence platform.

---

## 🚀 Key Modules & Architecture

### 1. CampusCare (Core Engine)
- **Centralized Issue Reporting**: Report classroom facility defects, Wi-Fi outages, water supply failures, electrical hazards, hostel maintenance, and accessibility issues.
- **Community Support ("Affected Too")**: Prevents duplicate complaints. Enforces a strict one-vote-per-user constraint via unique compound database indexes.
- **Auditable Status Workflow**: `Reported → Under Review → In Progress → Resolved / Closed / Rejected`.
- **Status Audit Timeline**: Immutable record of status transitions with authorized staff actor stamps and explanation notes.
- **Official Staff Remarks**: Authorized university representatives post public resolution remarks directly on issue tickets.
- **CampusCare Intelligence & Analytics**: Interactive Recharts charts detailing issues by category, resolution efficiency rates, and recurring campus facility hotspots.

### 2. UniPulse
- **Verified Official Announcements**: Centralized feed for academic timetables, exam schedules, and administrative notices.
- **Official Verification Badges**: Distinguishes verified notices published by authenticated faculty deans and departments from general community announcements.
- **Save & Bookmarking**: Pin important academic dates to your personal dashboard.

### 3. OpportunityHub
- **Hackathons & Competitions**: Discover nationwide coding challenges, datathons, and designathons.
- **Internships & Research Grants**: Explore paid corporate software engineering internships and funded undergraduate research opportunities.
- **Deadline Tracking**: Automatic active vs. expired deadline categorization.

### 4. ResourceShare
- **Peer-to-Peer Study Materials**: Comprehensive revision summaries, lecture slides, and past paper solutions.
- **Facet Filtering**: Search by Faculty, Department, Academic Semester (e.g., Year 2 Sem 1), and Resource Type.
- **Content Moderation**: Built-in reporting system for broken links or unauthorized material.

### 5. CampusArena
- **Campus Life & Events**: Directory of inter-faculty sports championships, cultural festivals, tech exhibitions, and career fairs.
- **Event RSVPs**: Save events and track live attendee interest.

### 6. StudentVoice
- **Constructive Campus Proposals**: Propose university improvements (e.g., extended library hours, GPS shuttle bus tracking).
- **Democratic Upvoting**: Students upvote constructive proposals.
- **Administrative Response Protocol**: University committees review, accept, implement, or decline proposals with official written responses.

### 7. Administrative Control Center
- **Role-Based Access Control (RBAC)**: Protected access for `staff` and `admin` roles.
- **Workflow Moderation**: Update ticket statuses, issue work orders, and review student suggestions.
- **User Role Manager**: Manage user accounts and adjust permissions (`student`, `staff`, `organizer`, `admin`).

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, JavaScript (JSX), Tailwind CSS, React Router v6, Lucide React, Recharts, Axios |
| **Backend** | Node.js, Express.js (ES Modules), RESTful API, Helmet, CORS, Morgan, Express Rate Limit |
| **Database** | MongoDB with Mongoose (Indexes, validation schemas, compound uniqueness constraints) |
| **Authentication** | JWT (JSON Web Tokens), bcryptjs password hashing, RBAC middleware |
| **File Storage** | Multer local storage middleware with mime-type checking (Cloudinary ready) |

---

## 🎨 Design System & Visual Identity

- **Primary Brand Color**: `#F56527` (Hover: `#E55316`, Light: `#FFF0E8`)
- **Main Background**: `#F7F7F7` (Internal dashboards) / Pure `#FFFFFF` (Full display landing page)
- **Primary Text**: `#202124` | **Secondary Text**: `#6B7280` | **Borders**: `#E5E7EB`
- **Semantic Colors**: Green (`#15803D`), Amber (`#D97706`), Red (`#DC2626`), Blue (`#2563EB`)
- **Typography**: Inter (Google Fonts)

---

## ⚡ Quick Start & Development Setup

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **MongoDB**: Running locally at `mongodb://127.0.0.1:27017` or a MongoDB Atlas URI

### 2. Install Dependencies
```bash
# Install root, backend, and frontend packages
npm run install:all
```

### 3. Database Seeding
Populate realistic demonstration data (users, issues with timelines, notices, opportunities, resources, events, suggestions):
```bash
npm run seed
```

### 4. Run Both Servers
```bash
# Runs Express API on :5000 and Vite Frontend on :5173 concurrently
npm run dev
```

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 👤 Test Credentials & Demo Accounts

For rapid evaluation, the navigation bar includes an **Instant Demo Switch** dropdown to swap active user perspectives with one click. Alternatively, you can log in manually:

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Student** | `kasun@uniconnect.edu` | `password123` | Reports issues, votes "Affected Too", saves opportunities, posts suggestions |
| **Staff** | `dr.jayawardena@uniconnect.edu` | `password123` | Updates CampusCare statuses, posts official remarks, publishes verified notices |
| **Organizer** | `malith@uniconnect.edu` | `password123` | Posts hackathons, creates campus arena events |
| **Administrator** | `admin@uniconnect.edu` | `password123` | Full access, user role modification, system analytics |

---

## 📂 Project Structure

```
Uniconnect/
├── package.json               # Root scripts (install:all, dev, seed, build)
├── server/                    # Node.js + Express Backend
│   ├── package.json
│   ├── server.js              # Server entry point with security middleware
│   ├── .env                   # Environment variables
│   ├── config/                # DB connection & seed script
│   ├── models/                # User, Issue, Announcement, Opportunity, etc.
│   ├── controllers/           # REST business logic
│   ├── routes/                # Express router endpoints
│   └── middleware/            # Auth, RBAC, Multer, Error handlers
└── client/                    # React + Vite Frontend
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js     # Brand design tokens
    └── src/
        ├── App.jsx            # Route definitions
        ├── main.jsx
        ├── api/               # Axios client with JWT interceptors
        ├── context/           # AuthContext, ToastContext, NotificationContext
        ├── components/        # Navbar, Sidebar, Badges, Footer, Modals
        ├── layouts/           # MainLayout (Edge-to-edge landing, sidebar dashboards)
        └── pages/
            ├── Landing.jsx    # Full display public presentation
            ├── Login.jsx & Register.jsx
            ├── StudentDashboard.jsx
            ├── CampusCare/    # List, ReportIssue, IssueDetails, Analytics
            ├── UniPulse/      # Verified notices feed & publishing
            ├── OpportunityHub/# Hackathons & internships
            ├── ResourceShare/ # Revision guides & past papers
            ├── CampusArena/   # Events directory & RSVPs
            ├── StudentVoice/  # Proposals, upvotes & staff responses
            ├── Admin/         # Admin Control Center & user management
            └── Profile/       # Profile management
```
