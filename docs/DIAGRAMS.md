# UML and Design Diagrams

These diagrams can be pasted into a Mermaid-compatible Markdown viewer or recreated in draw.io/StarUML for the report.

## 1. Use-case diagram (text representation)

```mermaid
flowchart LR
    Student([Student])
    subgraph StudyFlow[Student Task and Assignment Manager]
      Dashboard((View dashboard))
      Add((Add assignment))
      Browse((View, search and filter assignments))
      Edit((Edit assignment))
      Status((Change completion status))
      Delete((Delete assignment))
    end
    Student --- Dashboard
    Student --- Add
    Student --- Browse
    Student --- Edit
    Student --- Status
    Student --- Delete
```

## 2. Class/data model

```mermaid
classDiagram
    class Task {
      +Integer id
      +String title
      +String subject
      +String description
      +Date due_date
      +Priority priority
      +Status status
      +DateTime created_at
      +DateTime updated_at
    }
    class TaskService {
      +listTasks(status, query)
      +createTask(taskData)
      +updateTask(id, taskData)
      +changeStatus(id, status)
      +deleteTask(id)
    }
    class TaskAPI {
      +GET /api/tasks
      +POST /api/tasks
      +PUT /api/tasks/:id
      +PATCH /api/tasks/:id/status
      +DELETE /api/tasks/:id
    }
    TaskAPI --> TaskService : calls
    TaskService --> Task : reads/writes
```

## 3. Sequence diagram: create assignment

```mermaid
sequenceDiagram
    actor Student
    participant UI as Browser UI
    participant API as Express API
    participant DB as SQLite database
    Student->>UI: Enter assignment details
    UI->>API: POST /api/tasks (JSON)
    API->>API: Validate fields
    alt Valid input
      API->>DB: INSERT task
      DB-->>API: New task ID
      API-->>UI: 201 Created + task JSON
      UI->>API: GET /api/tasks
      API->>DB: SELECT tasks
      DB-->>API: Task rows
      API-->>UI: Updated task list
    else Invalid input
      API-->>UI: 400 Bad Request + error
      UI-->>Student: Display validation message
    end
```

## 4. Activity diagram: task completion

```mermaid
flowchart TD
    A([Start]) --> B[Student checks completion box]
    B --> C[Frontend sends PATCH request]
    C --> D{Status valid and task exists?}
    D -- No --> E[Show error]
    D -- Yes --> F[Update SQLite row]
    F --> G[Reload task list and dashboard]
    E --> H([End])
    G --> H
```

## 5. Architecture diagram

```mermaid
flowchart TB
    Browser[Browser: HTML, CSS, JavaScript]
    Express[Node.js + Express REST API]
    SQLite[(SQLite database file)]
    Browser <-->|HTTP + JSON| Express
    Express <-->|SQL queries| SQLite
```
