# Join 📋

A Kanban-based task management tool built with vanilla JavaScript and Firebase —
extended with an AI-powered issue collector that turns incoming emails into
board tickets.

🔗 [Live Demo](https://join.mischasiegrist.ch)

![Join Board](assets/img/board-screen.png)

## ✨ Features

### Kanban board
- Five columns: **Triage**, To do, In progress, Await feedback, Done
- Create, edit and delete tasks with subtasks, priorities and assignees
- Move tasks between columns via the move menu on each card
- Contact management
- User authentication via Firebase (including guest access)
- Responsive design for desktop and mobile

### AI issue collector
- Stakeholders submit feature requests **by email** — no account needed
- An [n8n](https://n8n.io) workflow reads the mailbox, analyses the mail with
  Google Gemini and creates a ready-made ticket
- The AI determines title, description, category, priority and deadline, and
  resolves names mentioned in the mail against the existing contacts to assign
  them automatically
- Generated tickets land in the **Triage** column and are marked as
  AI-generated in the task dialog
- Every ticket shows its creator, distinguishing internal team members from
  external stakeholders

## 🚀 Try the demo

**As a stakeholder — without an account:**

1. Open the [live demo](https://join.mischasiegrist.ch) and choose
   *Are you a stakeholder? → Create request*
2. Send an email to **join@siegristdigital.ch** describing what you need.
   Write it like a normal request — mention a deadline (“by Friday”), name a
   team member, or list several steps, and the AI will pick all of that up.
3. Within a minute the ticket appears in the **Triage** column of the board,
   flagged as AI-generated and carrying your name as the creator.

A maximum of 10 requests per day are processed by the AI. Beyond that limit
mails are still received, but reviewed manually.

**As a team member:**

Choose *Member log in* on the start page and use the guest login to explore the
board without registering.

## 🛠️ Technologies

- Vanilla JavaScript (ES Modules)
- Firebase Realtime Database & Authentication
- HTML5 / CSS3
- n8n for workflow automation
- Google Gemini for mail analysis

## 📁 Project structure

- `js/` — Application logic (auth, board, tasks, contacts)
- `css/` — Stylesheets per page
- `assets/` — Icons, images, fonts
- `index.html` — Start page with the stakeholder / team member split
- `stakeholder.html` — Landing page for external requests
- `n8n-workflow.json` — Exported n8n workflow

## ⚙️ Installation

1. Clone the repository
2. Copy `js/firebaseAuth.example.js` to `js/firebaseAuth.js` and add your
   Firebase credentials
3. Open `index.html` in your browser (or use a local server)

### Setting up the issue collector

1. Import `n8n-workflow.json` into your n8n instance
2. Create the credentials the workflow expects — they are **not** part of the
   export:
   - IMAP access to the mailbox that receives the requests
   - A Google Gemini API key
   - A Google service account with the scopes
     `https://www.googleapis.com/auth/userinfo.email` and
     `https://www.googleapis.com/auth/firebase.database`, used by the HTTP
     nodes to write to the Realtime Database
3. Point the HTTP nodes at your own database URL

The service account authenticates as an admin, so the database security rules
do not apply to the workflow. Keep its key out of version control.

## 👥 Team

Developed as a group project at Developer Akademie by Christopher Braun,
Filip Rozanowski and Mischa Siegrist. The AI issue collector was added
afterwards by Mischa Siegrist.

## ⚠️ Notice

Image assets are property of Developer Akademie GmbH and may not be used
without permission.
