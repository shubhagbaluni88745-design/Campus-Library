# Campus Library — End-to-End GraphQL Application

A complete three-tier Campus Library web application built with HTML5/CSS3/Vanilla JavaScript, Node.js + Apollo Server v4 (GraphQL), and MySQL.

**Course Reference:** CS543 Web Services · Hands-On GraphQL Tutorial  
**Database:** MySQL (`gqldemo`)  
**GraphQL Server:** Apollo Server standalone on port 4000 (`http://localhost:4000/`)  
**Frontend:** Responsive Vanilla HTML/CSS/JS served via Live Server / static server

---

## 🏛 Architecture

```
Browser (Vanilla HTML / CSS / JavaScript)
      │
      │ HTTP POST (GraphQL Queries & Mutations)
      ▼
Apollo GraphQL API (Node.js @ port 4000)
      │
      │ Parameterized SQL Queries (mysql2/promise)
      ▼
MySQL Database (gqldemo @ port 3306)
```

1. **Frontend:** Plain HTML, modern academic-styled CSS, and vanilla JavaScript using standard `fetch()` POST requests. The author dropdown is dynamically populated directly from GraphQL data.
2. **Backend:** Apollo Server with GraphQL SDL schema and resolvers for authors, books, author-book relationships (`Author.books`, `Book.author`), and `addBook` mutation.
3. **Database:** MySQL relational database with foreign key constraints between `authors` and `books`.

---

## 📁 Project Structure

```
Campus-Library/
│
├── schema.sql           # MySQL DDL script (database, tables, sample rows)
├── db.js                # MySQL connection pool via mysql2/promise & dotenv
├── server.js            # Apollo Server 4 GraphQL schema & resolvers
├── package.json         # Project metadata, dependencies, and test scripts
├── package-lock.json    # Exact dependency tree lockfile
├── .env                 # Local database credentials (ignored by Git)
├── .env.example         # Template for environment configuration
├── .gitignore           # Git ignore rules (node_modules, .env, OS files)
│
├── public/
│   ├── index.html       # Campus Library UI with dynamic GraphQL client
│   └── style.css        # Academic library theme (blue/teal, cards, responsive)
│
├── screenshots/
│   ├── before-mutation.png  # Initial load screenshot (3 sample books)
│   └── after-mutation.png   # After addBook mutation screenshot
│
├── test-backend.js      # Backend verification script (queries & mutations)
├── test-frontend.js     # End-to-end headless Chrome verification script
└── README.md            # Comprehensive documentation
```

---

## ⚙️ Prerequisites

- **Node.js:** v18.x or newer (Tested with v24.11.1)
- **npm:** v9.x or newer (Tested with v11.6.2)
- **MySQL Community Server:** 8.0 or 9.x (Running on localhost:3306)

---

## 🚀 Step-by-Step Setup Instructions

### 1. Database Setup (MySQL)

Log into MySQL and execute the `schema.sql` file:

```bash
mysql -u root -p < schema.sql
```

This creates:
- Database: `gqldemo`
- Table `authors`:
  - `id` (INT AUTO_INCREMENT PRIMARY KEY)
  - `name` (VARCHAR(100) NOT NULL)
  - `country` (VARCHAR(50))
- Table `books`:
  - `id` (INT AUTO_INCREMENT PRIMARY KEY)
  - `title` (VARCHAR(200) NOT NULL)
  - `year` (INT)
  - `author_id` (INT NOT NULL, FOREIGN KEY referencing `authors(id)`)
- Sample records:
  - Authors: *Asha Patel* (India), *Ravi Kumar* (India)
  - Books: *Databases 101* (2020), *SQL in Practice* (2022), *Web Services Basics* (2023)

---

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` to match your local MySQL configuration:

```env
PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD="YOUR_MYSQL_PASSWORD"
DB_NAME=gqldemo
```

---

### 3. Install Dependencies

```bash
npm install
```

Installed packages:
- `@apollo/server` — Apollo GraphQL Server
- `graphql` — Core GraphQL engine
- `mysql2` — MySQL connection pool & promise client
- `dotenv` — Environment configuration loader
- `puppeteer-core` *(dev)* — Automated Chrome E2E testing

---

### 4. Start the GraphQL Backend Server

```bash
npm start
```
*(Or `node server.js`)*

Expected console output:
```text
GraphQL API ready at http://localhost:4000/
```

Opening `http://localhost:4000/` in a web browser opens Apollo Studio Sandbox for interactive querying.

---

### 5. Launch the Frontend

Option A: **VS Code Live Server (Recommended in Assignment)**
1. Open the project folder in VS Code.
2. Right-click `public/index.html` → Click **"Open with Live Server"**.
3. Browser opens automatically at `http://127.0.0.1:5500/` (or port 5500).

Option B: **Any Local HTTP Static Server**
```bash
npx serve public -p 5500
```
Then visit `http://localhost:5500/` in your browser.

---

## 🔍 GraphQL Operations

### 1. Read Query (Fetch Authors and Books in One Request)
```graphql
query {
  authors {
    id
    name
    country
    books {
      title
      year
    }
  }
}
```

### 2. Write Mutation (Add a New Book)
```graphql
mutation($t: String!, $y: Int, $a: ID!) {
  addBook(title: $t, year: $y, authorId: $a) {
    id
    title
    year
  }
}
```
**Variables:**
```json
{
  "t": "GraphQL for Beginners",
  "y": 2025,
  "a": "2"
}
```

---

## 🧪 Automated Testing

### Backend Unit & Integration Tests:
```bash
npm test
```
Verifies:
- MySQL connectivity and table existence
- Foreign key constraint enforcement
- `authors` query with nested `books`
- `author(id)` query
- `books` query with nested `Book.author` relationship resolver
- `addBook` mutation insertion into MySQL
- Verification of new book under Ravi Kumar
- Direct MySQL `SELECT` validation
- Input validation (empty title, invalid year, invalid author ID)

### End-to-End Browser & UI Tests:
```bash
npm run test:e2e
```
Verifies:
- Dynamic population of author dropdown
- Rendering of author cards and book badges
- Form submission and live list refresh
- Success alert banner
- Form reset
- Zero browser console errors
- Captures `before-mutation.png` and `after-mutation.png` screenshots
