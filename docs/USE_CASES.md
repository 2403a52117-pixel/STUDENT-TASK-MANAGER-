# Use Cases

## Actor
**Student** — the single user who manages their own assignments.

## Use-case list
- UC-01 View dashboard
- UC-02 Add assignment
- UC-03 View/search/filter assignments
- UC-04 Edit assignment
- UC-05 Mark assignment completed or pending
- UC-06 Delete assignment

## UC-02: Add assignment
- **Precondition:** The application is running.
- **Main flow:** Student selects Add assignment, enters title/subject/due date, optionally enters description and priority, then selects Save. The frontend sends a POST request. The backend validates the fields and stores the record in SQLite. The dashboard refreshes.
- **Alternative flow:** If required data is missing or invalid, the app displays an error and does not save the record.
- **Postcondition:** The new assignment is saved and appears in the list.

## UC-04: Edit assignment
- **Precondition:** The assignment exists.
- **Main flow:** Student selects Edit, changes fields, and saves. The backend validates and updates the row. The interface refreshes.
- **Alternative flow:** Invalid fields produce an error; a nonexistent ID returns 404.

## UC-05: Change status
- **Main flow:** Student toggles the completion checkbox. The frontend sends a PATCH request with `Pending` or `Completed`; the backend updates the status and the dashboard recalculates totals.

## UC-06: Delete assignment
- **Main flow:** Student selects Delete and confirms the browser prompt. The backend deletes the row and the interface refreshes.
- **Alternative flow:** If the student cancels, no request is sent.
