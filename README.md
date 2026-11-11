# StudyFlow — Student Task and Assignment Manager

A beginner-friendly full-stack Software Engineering project. Students can create, view, edit, complete, search, filter, and delete assignments. The dashboard shows totals, pending/completed tasks, assignments due soon, and completion progress.

## Features
- Responsive dashboard for desktop and mobile
- Create, edit, and delete assignments
- Mark assignments pending/completed
- Search by title, subject, or description
- Filter by status and priority labels
- Due-date indicators for overdue, today, tomorrow, and upcoming work
- Dashboard statistics and completion progress
- Express REST API with server-side validation
- SQLite database for persistent local storage
- Friendly empty states, confirmation before deletion, and error messages

> This student project does not include user accounts. It is intended for a local demo or a single-user deployment. Do not store sensitive personal information in it.

## Requirements
- Node.js 20 or later (LTS recommended)
- npm (included with Node.js)
- VS Code (recommended)

## Run locally in VS Code
1. Extract the project ZIP and open the `student-task-manager` folder in VS Code.
2. Open **Terminal → New Terminal**.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the app:
   ```bash
   npm start
   ```
5. Open <http://localhost:3000> in your browser.
6. Add a sample assignment and refresh the page to confirm that it remains saved.

The SQLite database is created automatically at `data/tasks.db`. You do not need to create this file yourself.

For development with automatic server restart, use `npm run dev` (Node.js 20.11+ recommended).

## API reference
All request and response bodies use JSON.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/tasks` | Get tasks; optional `?status=Pending` or `?status=Completed`; optional `?q=search-term` |
| POST | `/api/tasks` | Create a task |
| PUT | `/api/tasks/:id` | Update task fields and status |
| PATCH | `/api/tasks/:id/status` | Set status to `Pending` or `Completed` |
| DELETE | `/api/tasks/:id` | Delete a task |

Example POST body:
```json
{
  "title": "Finish DSA worksheet",
  "subject": "Algorithms",
  "description": "Complete questions 1 to 5",
  "due_date": "2026-10-20",
  "priority": "High"
}
```

Valid priorities: `Low`, `Medium`, `High`. Valid statuses: `Pending`, `Completed`. The server validates required fields and field lengths.

## Deployment option: Render

This app can be deployed as a Node web service. Because the app uses SQLite, **configure persistent disk storage** on your hosting provider if you want assignments to survive redeployments and restarts. Some free hosting plans have an ephemeral filesystem and may erase the database on redeploy/restart.

1. Push this folder to a GitHub repository.
2. Sign in to <https://render.com/> and choose **New → Web Service**.
3. Connect your GitHub repository.
4. Configure:
   - **Runtime:** Node
   - **Build command:** `npm install`
   - **Start command:** `npm start`
5. In the Render service settings, add a persistent disk if your plan supports it. Mount it at `/var/data`.
6. Add an environment variable:
   - `DB_PATH` = `/var/data/tasks.db`
7. Deploy the service and open the generated `https://...onrender.com` URL.
8. Check `https://YOUR-APP-URL/api/health` and create a test assignment.

If persistent disks are not available on your plan, use a managed database instead before treating the deployment as a reliable live app. Do not assume a local SQLite file will persist on an ephemeral host.

## Deployment option: any Node host with persistent storage

Set the build command to `npm install`, start command to `npm start`, and configure `DB_PATH` to a writable persistent path. The service reads the port from the host-provided `PORT` environment variable.

## Manual test plan

See [`docs/TEST_CASES.md`](docs/TEST_CASES.md) for functional test cases.

## Software Engineering documents
- [`docs/SRS.md`](docs/SRS.md) — software requirements specification
- [`docs/USE_CASES.md`](docs/USE_CASES.md) — actors and use cases
- [`docs/DIAGRAMS.md`](docs/DIAGRAMS.md) — UML diagram descriptions and Mermaid diagrams
- [`docs/TEST_CASES.md`](docs/TEST_CASES.md) — manual test cases

## Project structure
```text
student-task-manager/
├── server.js
├── package.json
├── .env.example
├── README.md
├── public/
│   ├── index.html
│   ├── style.css
│   └── script.js
└── docs/
    ├── SRS.md
    ├── USE_CASES.md
    ├── DIAGRAMS.md
    └── TEST_CASES.md
```

## Troubleshooting
- **`node` is not recognized:** install Node.js LTS, close and reopen VS Code, then run `node -v`.
- **Port 3000 is busy:** on PowerShell run `$env:PORT=3001; npm start`, then open `http://localhost:3001`.
- **Native SQLite package install fails:** use Node.js 20 LTS for the project, then delete `node_modules` and `package-lock.json` if present and run `npm install` again.
- **Changes are not showing:** refresh the browser; restart the server after changing `server.js` unless using `npm run dev`.
