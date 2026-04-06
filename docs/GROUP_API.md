# Group API Documentation

## Overview

The Group API provides centralized management for the Self-Help Group with real-time cache invalidation on any changes.

## Base URL

```
/api/groups
```

## Authentication

- Public GET endpoints (list all groups)
- POST, PUT, DELETE require authentication via cookie token

## Endpoints

### GET /api/groups

Get all active groups.

**Response:**
```json
{
  "groups": [
    {
      "id": "69d2d2b1c74d2b91eb52f089",
      "name": "Githirioni Self Help Group",
      "description": "A community-based financial...",
      "location": "Githirioni, Kiambu County",
      "contactEmail": "info@githirioni-shg.org",
      "contactPhone": "+254 700 000 000",
      "registrationNumber": "SHG/GTH/2024/001",
      "foundedDate": "2020-01-15T00:00:00.000Z",
      "defaultCurrency": "KES",
      "logo": null,
      "address": {
        "street": "Githirioni Market",
        "city": "Githirioni",
        "county": "Kiambu",
        "country": "Kenya"
      },
      "settings": {
        "monthlyContribution": 1000,
        "weeklyContribution": 250,
        "shareValue": 1000,
        "defaultInterestRate": 12,
        "maxLoanPeriod": 12,
        "minGuarantors": 2
      },
      "created_at": "2026-04-06T00:00:00.000Z",
      "updated_at": "2026-04-06T00:00:00.000Z"
    }
  ],
  "fromCache": false
}
```

### GET /api/groups/[id]

Get a single group by ID.

### POST /api/groups

Create a new group.

**Request Body:**
```json
{
  "name": "New Group Name",
  "description": "Group description",
  "location": "Location",
  "contactEmail": "email@example.com",
  "contactPhone": "+254...",
  "registrationNumber": "REG/001",
  "foundedDate": "2024-01-01",
  "defaultCurrency": "KES",
  "address": {
    "street": "Street",
    "city": "City",
    "county": "County"
  },
  "settings": {
    "monthlyContribution": 1000,
    "shareValue": 1000
  }
}
```

### PUT /api/groups/[id]

Update an existing group.

**Request Body:** Same as POST, but fields are optional.

### DELETE /api/groups/[id]

Soft-delete a group (sets isActive to false).

## Client Usage

```typescript
import { groupApi, Group } from '@/lib/api/group';

// Get all groups
const groups = await groupApi.getAll();

// Get single group
const group = await groupApi.getById(groupId);

// Create group
const newGroup = await groupApi.create({
  name: 'My Group',
  description: 'Description'
});

// Update group
const updated = await groupApi.update(groupId, {
  name: 'New Name'
});

// Delete group
await groupApi.delete(groupId);
```

## Cache Behavior

- Groups are cached for 30 seconds
- Any POST/PUT/DELETE automatically invalidates the cache
- Next request fetches fresh data from database

## Database Schema

**Collection:** `groups`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | String | Yes | Group name (max 100 chars) |
| description | String | No | Group description |
| location | String | No | Physical location |
| contactEmail | String | No | Contact email |
| contactPhone | String | No | Contact phone |
| registrationNumber | String | No | Official registration number |
| foundedDate | Date | No | Date group was founded |
| defaultCurrency | String | No | Default currency (KES/USD/UGX/TZS) |
| logo | String | No | Logo URL |
| address | Object | No | Nested address object |
| settings | Object | No | Group-specific settings |
| isActive | Boolean | No | Soft delete flag |
| created_at | Date | Auto | Timestamp |
| updated_at | Date | Auto | Timestamp |

## Events (Real-time)

When group data changes, events are emitted:

```typescript
import { groupEvents } from '@/lib/server/utils/groupEvents';

groupEvents.on('group:created', (data) => { /* Handle new group */ });
groupEvents.on('group:updated', (data) => { /* Handle update */ });
groupEvents.on('group:deleted', (data) => { /* Handle deletion */ });
```