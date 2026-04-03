# Githirioni Self Help Group Management System - Specification

## 1. Project Overview

**Project Name:** Githirioni Self Help Group Management System  
**Type:** Full-stack Web Application (Next.js + Express + MongoDB)  
**Core Functionality:** A comprehensive platform for managing community-based financial operations including member records, contributions (chamas), loans, savings, andReports for a Self-Help Group in Githirioni, Kenya.  
**Target Users:** Group Admins, Treasurers, Secretaries, and Members

---

## 2. UI/UX Specification

### 2.1 Layout Structure

**Page Sections:**
- **Navigation Bar:** Fixed top, 64px height, contains logo, nav links, user menu
- **Sidebar:** Collapsible, 280px width (desktop), slide-in drawer (mobile)
- **Main Content Area:** Fluid width, scrollable, with card containers
- **Footer:** Minimal, 48px height, copyright info

**Responsive Breakpoints:**
- Mobile: 0-639px (single column, bottom nav)
- Tablet: 640-1023px (collapsible sidebar)
- Desktop: 1024px+ (full sidebar)

### 2.2 Visual Design

**Color Palette:**
- Primary: `#228B22` (Forest Green)
- Primary Dark: `#1B6B1B`
- Primary Light: `#90EE90`
- Secondary: `#FFFFFF` (White)
- Background: `#F8FAF8` (Off-white green tint)
- Surface: `#FFFFFF`
- Text Primary: `#1A1A1A`
- Text Secondary: `#4A4A4A`
- Text Muted: `#6B6B6B`
- Accent: `#FF6B35` (Orange for CTAs)
- Success: `#22C55E`
- Warning: `#F59E0B`
- Error: `#EF4444`
- Info: `#3B82F6`

**Typography:**
- Font Family: `"DM Sans", sans-serif` (headings), `"Inter", sans-serif` (body)
- H1: 32px/40px, weight 700
- H2: 24px/32px, weight 600
- H3: 20px/28px, weight 600
- Body: 16px/24px, weight 400
- Small: 14px/20px, weight 400
- Caption: 12px/16px, weight 500

**Spacing System:**
- Base unit: 4px
- XS: 4px, SM: 8px, MD: 16px, LG: 24px, XL: 32px, 2XL: 48px

**Visual Effects:**
- Card shadows: `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)`
- Elevated shadows: `0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)`
- Border radius: 8px (cards), 6px (buttons), 4px (inputs)
- Transitions: 150ms ease-out

### 2.3 Components

**Navigation:**
- Logo with group name
- Nav links with active state indicator (left border)
- User dropdown menu
- Theme toggle button

**Cards:**
- Stat cards with icon, value, label, trend indicator
- Member cards with avatar, name, status badge
- Loan cards with progress bar

**Tables:**
- Striped rows, sortable headers
- Pagination controls
- Row actions (view, edit, delete)
- Bulk selection

**Forms:**
- Floating labels
- Validation with inline errors
- Date pickers, select dropdowns
- File upload with preview

**Modals:**
- Centered, max-width 560px
- Close button, title, content, footer actions
- Backdrop overlay

**Buttons:**
- Primary: Forest green fill, white text
- Secondary: White fill, green border
- Danger: Red fill for destructive
- Sizes: SM (32px), MD (40px), LG (48px)

---

## 3. Functionality Specification

### 3.1 Authentication & Authorization

**Features:**
- JWT-based authentication
- Role-based access control (Admin, Treasurer, Secretary, Member)
- Password hashing with bcrypt
- Session management
- Remember me functionality

**User Roles & Permissions:**

| Feature | Admin | Treasurer | Secretary | Member |
|---------|------|-----------|-----------|--------|
| View Dashboard | ✓ | ✓ | ✓ | ✓ |
| Manage Members | ✓ | - | ✓ | View |
| Add/Edit Members | ✓ | - | ✓ | - |
| Record Contributions | ✓ | ✓ | - | - |
| View All Contributions | ✓ | ✓ | ✓ | - |
| View Own Contributions | ✓ | ✓ | ✓ | ✓ |
| Process Loans | ✓ | ✓ | - | - |
| View Loans | ✓ | ✓ | ✓ | Own |
| Manage Savings | ✓ | ✓ | - | - |
| Generate Reports | ✓ | ✓ | ✓ | Own |
| Manage Settings | ✓ | - | - | - |

### 3.2 Member Management

**Data Fields:**
- Member ID (auto-generated: GSH-XXXX)
- Full name (required)
- ID number (required, unique)
- Phone number (required)
- Email (optional, unique)
- Location (dropdown: Githirioni, Lari, Kiambu, Other)
- Join date (auto-set)
- Next of kin name
- Next of kin phone
- Member photo (file upload)
- Status (active/inactive)
- Created by, Created at, Updated at

**Features:**
- CRUD operations
- Search by name, ID, phone
- Filter by status, location
- Export to CSV/PDF
- Profile photo upload

### 3.3 Contributions (Chama) Module

**Data Fields:**
- Contribution ID (auto-generated)
- Member (reference)
- Amount (required)
- Date (required)
- Payment method (Cash, M-Pesa, Bank)
- Contribution type (Monthly, Weekly, Special)
- Recurring (boolean)
- Notes
- Recorded by, Recorded at

**Features:**
- Record new contributions
- Batch import
- Contribution history per member
- Auto-calculate totals
- Missed contribution flags
- Monthly/yearly reports

### 3.4 Welfare Fund Module

**Data Fields:**
- Fund contribution per member
- Payout records
- Reason (Bereavement, Celebration, Emergency)
- Approved by

**Features:**
- Track fund contributions
- Process payouts
- Report generation

### 3.5 Loans Management

**Data Fields:**
- Loan ID (auto-generated)
- Member (reference)
- Principal amount
- Interest rate (configurable, default 10%)
- Repayment period (months)
- Start date
- Status (Pending, Approved, Rejected, Disbursed, Paid)
- Guarantor 1, Guarantor 2
- Installment amount (calculated)
- Total interest (calculated)
- Total repayable (calculated)
- Outstanding balance
- Applied by, Approved by, Disbursed by

**Features:**
- Loan application workflow
- Auto-calculate interest (simple interest)
- Track repayments
- Partial payment support
- Late payment penalties (5% on overdue)
- Guarantor management

### 3.6 Savings & Shares

**Data Fields:**
- Savings account per member
- Share purchases (share value: KES 1,000)
- Transaction history

**Features:**
- Track savings balance
- Record share purchases
- Member equity summary

### 3.7 Reports & Statements

**Report Types:**
- Member statement (individual)
- Contribution report (all members)
- Loan report (outstanding, paid)
- Group balance summary
- Attendance report

**Features:**
- PDF export with branding
- Excel export
- Date range filters
- Print-friendly layouts

### 3.8 Meetings & Announcements

**Data Fields:**
- Meeting ID
- Title, Date, Time, Location
- Agenda
- Minutes
- Attendees
- Announcements (title, message, date)

**Features:**
- Schedule meetings
- Record minutes
- Send announcements (email/SMS simulation)

### 3.9 Dashboard

**Widgets:**
- Total members (with growth %)
- Total contributions (monthly)
- Active loans (count, total outstanding)
- Total savings
- Recent transactions
- Member growth chart
- Contribution trends chart

### 3.10 Settings

**Configurable:**
- Group name, logo
- Default interest rate
- Share value
- Contribution amounts
- Notification preferences

### 3.11 Activity Logs

**Tracked:**
- User actions with timestamp
- Old/new values
- IP address

---

## 4. Technical Architecture

### 4.1 Frontend (Next.js)

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, register)
│   ├── (dashboard)/      # Protected dashboard pages
│   │   ├── dashboard/
│   │   ├── members/
│   │   ├── contributions/
│   │   ├── loans/
��   │   ├── savings/
│   │   ├── reports/
│   │   ├── meetings/
│   │   └── settings/
│   ├── api/              # API routes
│   └── layout.tsx
├── components/           # Reusable components
│   ├── ui/              # Base components
│   ├── forms/           # Form components
│   └── charts/          # Chart components
├── lib/                  # Utilities
├── stores/               # Zustand stores
└── types/                # TypeScript types
```

### 4.2 Backend (Express + MongoDB)

```
server/
├── models/               # Mongoose models
├── routes/              # Express routes
├── controllers/        # Route handlers
├── middleware/         # Auth, validation
├── utils/               # Helpers
├── config/             # Database config
└── seed/               # Seed data
```

### 4.3 API Endpoints

**Auth:**
- POST /api/auth/login
- POST /api/auth/register
- GET /api/auth/me

**Members:**
- GET /api/members
- POST /api/members
- GET /api/members/:id
- PUT /api/members/:id
- DELETE /api/members/:id

**Contributions:**
- GET /api/contributions
- POST /api/contributions
- GET /api/contributions/member/:id
- GET /api/contributions/report

**Loans:**
- GET /api/loans
- POST /api/loans
- PUT /api/loans/:id
- POST /api/loans/:id/repayment

**Savings:**
- GET /api/savings
- POST /api/savings
- PUT /api/savings/:id

**Reports:**
- GET /api/reports/member/:id
- GET /api/reports/contributions
- GET /api/reports/loans
- GET /api/reports/summary

---

## 5. Acceptance Criteria

### 5.1 Authentication
- [ ] Users can login with email/password
- [ ] JWT tokens are issued and validated
- [ ] Role-based access is enforced
- [ ] Unauthorized access redirects to login

### 5.2 Dashboard
- [ ] Shows summary statistics
- [ ] Charts render correctly
- [ ] Data updates in real-time
- [ ] Responsive on all devices

### 5.3 Member Management
- [ ] Can add/edit/delete members
- [ ] Auto-generates member ID
- [ ] Search and filter works
- [ ] Profile photos upload correctly

### 5.4 Contributions
- [ ] Can record contributions
- [ ] Calculates totals correctly
- [ ] Shows history per member
- [ ] Reports generate properly

### 5.5 Loans
- [ ] Application workflow complete
- [ ] Interest calculated correctly
- [ ] Repayments tracked
- [ ] Balance updates properly

### 5.6 Reports
- [ ] PDF export works
- [ ] Data is accurate
- [ ] Date filters work
- [ ] Print layouts correct

### 5.7 General
- [ ] Mobile-first design works
- [ ] Dark/light mode toggles
- [ ] Loading states show
- [ ] Error handling works