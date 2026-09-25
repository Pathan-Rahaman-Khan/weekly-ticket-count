# Daily Tickets - AngularJS Front-End CRUD

A complete front-end-only Daily Ticket Dashboard based on the supplied Excel screenshot.

## Included
- AngularJS 1.8.3
- HTML5 + CSS3
- Responsive dashboard
- Weekly ticket metrics
- Yesterday / Today change calculation
- Ticket CRUD: Create, Read, Update, Delete
- Search and filter by status/category
- Local Storage persistence
- JSON Export
- JSON Import
- Demo seed data
- No backend/database required

## Run
1. Extract the ZIP.
2. Open `index.html` in Chrome/Edge.
3. Internet is required only for the AngularJS and Bootstrap CDN files.
4. For a fully offline version, download AngularJS locally and replace the CDN script.

## Local Storage
Storage key:
`dailyTickets.angularjs.v1`

To reset demo data:
Open browser DevTools -> Application -> Local Storage -> delete `dailyTickets.angularjs.v1`, then refresh.

## CRUD workflow
1. Click `Ticket CRUD`.
2. Click `+ Add Ticket`.
3. Enter title/category/status/assignee/dates.
4. Create.
5. Use Edit/Delete in the table.
6. Dashboard values recalculate automatically.
7. Data remains after browser refresh.

## Suggested production upgrades
- Backend API + SQL database
- User authentication and role permissions
- Server-side pagination
- Audit history
- Real-time updates using WebSocket
- API validation and centralized error handling
- Excel/CSV export
- Date-range reporting
- Assignee-wise dashboard
- SLA aging and overdue tickets
- Charts using Chart.js


## How CRUD changes update the Weekly Dashboard

The dashboard does not contain separate hard-coded counts.

The flow is:

`Create / Edit / Delete Ticket`
→ `vm.tickets` changes
→ `TicketStore.save()` writes the complete array to Local Storage
→ `vm.refresh()`
→ weekly counts are recalculated from the ticket dates/status
→ dashboard displays the new values.

### Example: Create
If you create a ticket with:
- Created Date = 25-Sep-2026
- Status = New

Then **Today's New Tickets** increases by 1 and the selected day's **New** workload is recalculated.

### Example: Edit
If a ticket is changed from:
- Status = New
to
- Status = Resolved

the next refresh recalculates both the pending workload and resolved count.

### Example: Delete
When a ticket is deleted, it is removed from the Local Storage array and all weekly dashboard numbers are recalculated.

### Important
Dates are stored as local `YYYY-MM-DD` values instead of ISO midnight timestamps. This avoids India/browser timezone issues where a ticket entered on one day can appear under the previous day.

### Local Storage key
`dailyTickets.angularjs.v2`

Use **Reset Demo** to clear the current local data and recreate the demo tickets.
