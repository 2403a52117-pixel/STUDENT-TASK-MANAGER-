# Manual Test Cases

Run the app locally with `npm install` and `npm start`, then open `http://localhost:3000`.

| ID | Test | Steps / input | Expected result | Status |
|---|---|---|---|---|
| TC-01 | Load app | Open home page | Dashboard and assignment section render | To test |
| TC-02 | Empty list | Start with an empty database | Empty-state message and zero counts appear | To test |
| TC-03 | Add valid assignment | Enter title, subject, future due date, priority; save | Assignment appears and total count increases | To test |
| TC-04 | Required title | Leave title empty and submit | Browser/server validation prevents saving | To test |
| TC-05 | Required subject | Leave subject empty and submit | Browser/server validation prevents saving | To test |
| TC-06 | Persist data | Add a task, refresh page | Task remains in list | To test |
| TC-07 | Edit task | Change title or due date and save | Updated values appear | To test |
| TC-08 | Complete task | Check completion checkbox | Status changes to Completed; counts and progress update | To test |
| TC-09 | Reopen task | Uncheck a completed task | Status returns to Pending | To test |
| TC-10 | Delete task | Select delete and confirm | Task disappears and total count decreases | To test |
| TC-11 | Cancel deletion | Select delete and cancel prompt | Task remains | To test |
| TC-12 | Search | Search by title or subject | Only matching tasks appear | To test |
| TC-13 | Status filter | Select Pending, then Completed | Only selected status appears | To test |
| TC-14 | Due-date display | Add tasks due today, tomorrow, and in the past | Appropriate due-date labels appear | To test |
| TC-15 | Invalid API ID | Request `PUT /api/tasks/abc` | API returns HTTP 400 with JSON error | To test |
| TC-16 | Missing task | Request `DELETE /api/tasks/999999` | API returns HTTP 404 with JSON error | To test |
| TC-17 | Health endpoint | Open `/api/health` | JSON response reports status `ok` | To test |
| TC-18 | Responsive layout | Resize browser to mobile width | Content remains usable without page-level horizontal overflow | To test |

## Sample API checks

Health endpoint:
```bash
curl http://localhost:3000/api/health
```

List tasks:
```bash
curl http://localhost:3000/api/tasks
```

Create a task (PowerShell):
```powershell
$body = @{ title = 'Finish DSA worksheet'; subject = 'Algorithms'; description = 'Questions 1 to 5'; due_date = '2026-10-20'; priority = 'High' } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:3000/api/tasks -Method Post -ContentType 'application/json' -Body $body
```

After running each case, fill the Status column with **Pass** or **Fail** and record any issue for the report.
