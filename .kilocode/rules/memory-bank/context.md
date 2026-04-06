# Active Context: Githirioni SHG Management System

## Current State

**Project Status**: ✅ Active development
**Database**: MongoDB (githirioni-shg)
**Tech Stack**: Next.js 16 + TypeScript + Tailwind CSS 4 + MongoDB

## Recently Completed

- [x] MongoDB connection setup with official driver
- [x] Database seed script with transaction support
- [x] Welfare Fund module (contributions + payouts)
- [x] Automatic eligibility checks
- [x] Payout approval workflow
- [x] Audit-ready reporting
- [x] **Event Types management in Settings** - Users can view, add, edit, and delete custom event types
- [x] **Life Event Types management in Settings** - Users can view, add, edit, and delete custom life event types with max compensation
- [x] **Payout request form improvements** - Made form scrollable, removed manual amount entry (auto-fetches from event type settings)
- [x] **Database persistence** - All modals now save directly to MongoDB instead of localStorage:
  - Members: POST /api/members
  - Contributions: POST /api/contributions
  - Loans: POST /api/loans
  - Savings: POST /api/savings
- [x] **Manual check-in fix** - Fixed duplicate check-in prevention and status handling
- [x] **Financial Settings** - Created `FinancialSettings` model with bonus, share value, interest rates, contribution settings; added API at `/api/financial-settings`
- [x] **Attendance modal totals** - Displays total members, bonus per attendance, and total bonus amount in the attendance list modal, with auto-refresh every 10 seconds
- [x] **Attendance Reports** - Created API at `/api/attendance/reports` with comprehensive attendance data including summary stats, meeting stats, check-in methods; added Attendance Report tab in Reports page
- [x] **Edit Upcoming Meetings** - Added edit button and modal to each meeting card for updating meeting details; added PUT endpoint at `/api/meetings/[meetingId]`
- [x] **Meetings Analysis panel** - Added dashboard panel showing meeting frequency, total meetings, average attendance, attendance rate, and attendee bar chart
- [x] **Bonuses Analysis panel** - Added dashboard panel showing bonus distribution, total bonuses, recipients, average per person, and bonus trend line chart
- [x] **Loan migration scripts** - Created SQL migration script for PostgreSQL and TypeScript migration script for MongoDB

## Current Structure

| File/Directory | Purpose |
|----------------|---------|
| `src/lib/mongodb.ts` | MongoDB connection |
| `src/lib/server/models/WelfareFund.ts` | Welfare contributions model |
| `src/lib/server/models/WelfarePayout.ts` | Payout requests model |
| `src/lib/server/models/EventType.ts` | Event types model |
| `src/lib/server/models/LifeEventType.ts` | Life event types model (welfare) |
| `src/app/api/welfare` | Contributions API |
| `src/app/api/welfare/payout` | Payouts API |
| `src/app/api/welfare/eligibility` | Eligibility check API |
| `src/app/api/welfare/reports` | Audit reports API |
| `src/app/api/event-types` | Event types CRUD API |
| `src/app/api/life-event-types` | Life event types CRUD API |
| `src/app/dashboard/welfare` | Welfare dashboard page |
| `src/app/dashboard/settings` | Settings page with Event Types & Life Event Types |
| `scripts/seed.ts` | Database seeding |

## Welfare Fund Module

### Event Types & Limits
| Event | Max Payout |
|-------|-----------|
| Bereavement | KES 20,000 |
| Wedding | KES 15,000 |
| Celebration | KES 10,000 |
| Medical | KES 25,000 |
| Disaster | KES 30,000 |

### Eligibility Requirements
- Active membership
- Minimum 3 months membership
- Minimum KES 750 total contributions
- Minimum 3 contributions in last 3 months

### API Endpoints
- `GET /api/welfare` - List contributions
- `POST /api/welfare` - Add contribution
- `GET /api/welfare/payout` - List payouts
- `POST /api/welfare/payout` - Request payout
- `PATCH /api/welfare/payout` - Approve/Reject/Pay
- `GET /api/welfare/eligibility` - Check eligibility
- `GET /api/welfare/reports?type=audit` - Audit report

## Quick Start

```bash
npm run seed    # Seed database
npm run dev    # Start development server
```

## Pending Improvements

- [ ] Add file upload for event documents
- [ ] SMS/email notifications
- [ ] Monthly welfare statements

## Session History

| Date | Changes |
|------|---------|
| Initial | Template created with base setup |
| 2026-04 | MongoDB integration + Welfare Fund module |
| 2026-04-04 | Event Types management in Settings page |
| 2026-04-04 | Life Event Types management in Settings page |
| 2026-04-06 | Edit Upcoming Meetings feature |
| 2026-04-06 | Meetings Analysis and Bonuses Analysis panels on dashboard |
| 2026-04-06 | Loan migration scripts (SQL + MongoDB) |
