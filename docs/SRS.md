# Software Requirements Specification (SRS)

## 1. Introduction

### 1.1 Purpose
StudyFlow — Student Task and Assignment Manager is a web application that helps a student organize academic assignments, due dates, and completion status. This document records the requirements for implementation and testing.

### 1.2 Scope
The system provides a dashboard and assignment CRUD operations. It uses a browser-based frontend, an Express backend, and a SQLite database. The first release is a single-user project and does not provide accounts or multi-user access control.

### 1.3 Intended users
- Student: manages their assignments.
- Developer/evaluator: runs the app and verifies its features for the Software Engineering course.

## 2. Overall description

### 2.1 Product perspective
The application is a three-layer web application:
1. Presentation layer: HTML, CSS, and client-side JavaScript.
2. Application layer: Node.js and Express REST API.
3. Data layer: SQLite database.

### 2.2 Operating environment
A current desktop or mobile browser, Node.js 20 or later, npm, and a computer or hosting service that can run a Node application.

### 2.3 Constraints
- Initial release is designed for one user and has no authentication.
- The server must be able to write to the configured SQLite database directory.
- Hosting requires persistent storage if records must survive restarts and redeployments.

## 3. Functional requirements
- **FR-01:** The system shall display total, pending, completed, and due-soon assignment counts.
- **FR-02:** The student shall create an assignment with title, subject, due date, priority, and optional description.
- **FR-03:** The system shall reject an assignment with missing required fields or invalid values.
- **FR-04:** The student shall view saved assignments.
- **FR-05:** The student shall edit assignment details.
- **FR-06:** The student shall mark an assignment Pending or Completed.
- **FR-07:** The student shall delete an assignment after confirmation.
- **FR-08:** The student shall search assignments by title, subject, or description.
- **FR-09:** The student shall filter assignments by status.
- **FR-10:** The system shall show due-date indicators and overall completion progress.
- **FR-11:** The system shall persist assignment records in SQLite.
- **FR-12:** The API shall return meaningful HTTP status codes and JSON error messages.

## 4. Non-functional requirements
- **NFR-01 Usability:** Common actions should be accessible from the dashboard with clear labels.
- **NFR-02 Responsiveness:** The interface should adapt to desktop and mobile viewport widths.
- **NFR-03 Performance:** For a small student task list, normal CRUD operations should complete promptly on a typical laptop.
- **NFR-04 Data integrity:** Required fields and allowed priority/status values must be validated by the server.
- **NFR-05 Maintainability:** Frontend, backend, and documentation should be stored in separate files.
- **NFR-06 Reliability:** Data should remain after a local server restart when the same SQLite file is used.
- **NFR-07 Security:** SQL statements should use parameters; the app must not expose database credentials or accept arbitrary SQL.

## 5. Data requirements

| Field | Type | Required | Rules |
|---|---|---|---|
| id | Integer | System-generated | Primary key |
| title | Text | Yes | 1–120 characters |
| subject | Text | Yes | 1–80 characters |
| description | Text | No | Maximum 1000 characters |
| due_date | Date text | Yes | YYYY-MM-DD |
| priority | Text | Yes | Low, Medium, or High |
| status | Text | Yes | Pending or Completed |
| created_at | Date/time text | System-generated | Creation time |
| updated_at | Date/time text | System-generated | Last update time |

## 6. External interface requirements
- Browser interface: form, dashboard summary cards, search, status filter, task list, and edit/delete controls.
- REST API: JSON requests and responses under `/api`.
- Database: SQLite file configured by `DB_PATH` or the default `data/tasks.db` path.

## 7. Acceptance criteria
The release is acceptable when a user can create, read, update, complete, search/filter, and delete assignments; the dashboard reflects the current data; invalid input is rejected; records persist after a local restart; and the documented test cases pass.

## 8. Out of scope
Authentication, multiple student accounts, file attachments, email reminders, push notifications, and integration with a college learning management system.
