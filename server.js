'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const defaultDbPath = path.join(__dirname, 'data', 'tasks.db');
const dbPath = process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : defaultDbPath;

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    due_date TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'Medium' CHECK(priority IN ('Low','Medium','High')),
    status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending','Completed')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const selectAll = db.prepare('SELECT * FROM tasks ORDER BY CASE status WHEN \'Pending\' THEN 0 ELSE 1 END, due_date ASC, id DESC');
const selectOne = db.prepare('SELECT * FROM tasks WHERE id = ?');
const insertTask = db.prepare(`INSERT INTO tasks (title, subject, description, due_date, priority)
  VALUES (@title, @subject, @description, @due_date, @priority)`);
const updateTask = db.prepare(`UPDATE tasks SET title=@title, subject=@subject, description=@description,
  due_date=@due_date, priority=@priority, status=@status, updated_at=datetime('now') WHERE id=@id`);
const updateStatus = db.prepare(`UPDATE tasks SET status=?, updated_at=datetime('now') WHERE id=?`);
const deleteTask = db.prepare('DELETE FROM tasks WHERE id = ?');

function cleanTask(body, includeStatus = false) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const due_date = typeof body.due_date === 'string' ? body.due_date.trim() : '';
  const priority = ['Low', 'Medium', 'High'].includes(body.priority) ? body.priority : 'Medium';
  const status = ['Pending', 'Completed'].includes(body.status) ? body.status : 'Pending';
  const errors = [];
  if (!title) errors.push('Assignment title is required.');
  if (title.length > 120) errors.push('Title must be 120 characters or fewer.');
  if (!subject) errors.push('Subject is required.');
  if (subject.length > 80) errors.push('Subject must be 80 characters or fewer.');
  if (description.length > 1000) errors.push('Description must be 1000 characters or fewer.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(due_date) || Number.isNaN(Date.parse(`${due_date}T00:00:00Z`))) {
    errors.push('Please provide a valid due date.');
  }
  const result = { title, subject, description, due_date, priority };
  if (includeStatus) result.status = status;
  return { result, errors };
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok', app: 'Student Task and Assignment Manager' }));

app.get('/api/tasks', (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : 'All';
  const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
  let tasks = selectAll.all();
  if (status === 'Pending' || status === 'Completed') tasks = tasks.filter(task => task.status === status);
  if (q) {
    const query = q.toLocaleLowerCase();
    tasks = tasks.filter(task => [task.title, task.subject, task.description].some(value => value.toLocaleLowerCase().includes(query)));
  }
  res.json({ tasks });
});

app.post('/api/tasks', (req, res) => {
  const { result, errors } = cleanTask(req.body || {});
  if (errors.length) return res.status(400).json({ error: errors.join(' ') });
  const info = insertTask.run(result);
  return res.status(201).json({ task: selectOne.get(info.lastInsertRowid) });
});

app.put('/api/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid task ID.' });
  if (!selectOne.get(id)) return res.status(404).json({ error: 'Assignment not found.' });
  const { result, errors } = cleanTask(req.body || {}, true);
  if (errors.length) return res.status(400).json({ error: errors.join(' ') });
  updateTask.run({ ...result, id });
  return res.json({ task: selectOne.get(id) });
});

app.patch('/api/tasks/:id/status', (req, res) => {
  const id = Number(req.params.id);
  const status = req.body && req.body.status;
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid task ID.' });
  if (!['Pending', 'Completed'].includes(status)) return res.status(400).json({ error: 'Status must be Pending or Completed.' });
  if (!selectOne.get(id)) return res.status(404).json({ error: 'Assignment not found.' });
  updateStatus.run(status, id);
  return res.json({ task: selectOne.get(id) });
});

app.delete('/api/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid task ID.' });
  const info = deleteTask.run(id);
  if (!info.changes) return res.status(404).json({ error: 'Assignment not found.' });
  return res.json({ message: 'Assignment deleted successfully.' });
});

// Multi-page client routes
app.get('/dashboard', (_req, res) => res.redirect('/'));
app.get('/assignments', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'assignments.html')));
app.get('/calendar', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'calendar.html')));
app.get('/schedule', (_req, res) => res.redirect('/calendar'));

app.use('/api', (_req, res) => res.status(404).json({ error: 'API endpoint not found.' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Student Task Manager is running at http://localhost:${PORT}`);
  console.log(`SQLite database: ${dbPath}`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
