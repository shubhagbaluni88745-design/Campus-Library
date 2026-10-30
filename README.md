# Campus-Library

**Group No.: 16**

**Group Members:**

Krity Kumari: 20252651030 <br>
Vinit Gaikwad Satyawan: 20252651019<br>
Ujjwal Sharma: 20252651060<br>
Shubhag Baluni: 20252651053<br>

## 1. Project Overview

Campus Library is a web-based application that demonstrates how a library's book and author information can be managed using a GraphQL API.

The application allows users to view authors and their associated books, as well as add new books by selecting an author. It uses MySQL to store the data and Node.js with Apollo Server to provide the GraphQL API.

## 2. Objectives

- To understand the fundamentals of GraphQL and API development.
- To connect a web application with a MySQL database.
- To retrieve related author and book information using GraphQL queries.
- To insert new book records using GraphQL mutations.
- To understand how a frontend communicates with a backend API.

## 3. Features

- **View Authors:** Display author names and their countries.
- **View Books:** Display books associated with each author, including publication years.
- **Add a Book:** Add a new book by entering its title, publication year, and author.
- **GraphQL Queries:** Fetch authors, individual author details, and books.
- **GraphQL Mutations:** Insert new book records into the database.
- **Database Integration:** Store and retrieve information using MySQL.
- **Web Interface:** Interact with the application through a simple HTML, CSS, and JavaScript frontend.

## 4. Technologies Used

| Technology | Purpose |
|---|---|
| HTML | Structure of the web interface |
| CSS | Styling and layout |
| JavaScript | Frontend interactions and API requests |
| Node.js | Backend JavaScript runtime |
| Apollo Server | GraphQL API server |
| GraphQL | Query language and API operations |
| MySQL | Relational database |
| mysql2 | Connect Node.js to MySQL |
| Git and GitHub | Version control and project collaboration |

## 5. Project Structure

```text
Campus-Library/
├── database/
│   └── schema.sql
├── public/
│   ├── index.html
│   └── style.css
├── server/
│   ├── index.js
│   ├── resolvers.js
│   └── schema.js
├── db.js
├── server.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

**Note:** The `node_modules/` directory is generated when dependencies are installed and should not be uploaded to GitHub.

## 6. Prerequisites

Before running the project, ensure that the following are installed:

- Node.js and npm
- MySQL Server
- Visual Studio Code
- Live Server extension for VS Code (for running the frontend)

## 7. Installation and Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/Krity717/Campus-Library.git
cd Campus-Library
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up the Database

Start MySQL and execute the database setup script from the project root:

```sql
SOURCE database/schema.sql;
```

This creates the `gqldemo` database, the `authors` and `books` tables, and inserts the initial sample records.

### Step 4: Configure the Database Connection

Configure the MySQL connection in `db.js` using your local database settings.

**Security:** Do not commit your actual database password or other credentials to GitHub. Keep sensitive configuration in environment variables or a local `.env` file excluded through `.gitignore`.

### Step 5: Start the GraphQL Server

From the project root, run:

```bash
node server.js
```

The GraphQL API will be available at:

```text
http://localhost:4000/
```

### Step 6: Run the Frontend

1. Open `public/index.html` in Visual Studio Code.
2. Right-click the file.
3. Select **Open with Live Server**.
4. Use the webpage to view authors and books or add a new book.

Keep the backend server running while using the frontend.

## 8. Example GraphQL Operations

### Query Authors and Their Books

```graphql
query {
  authors {
    id
    name
    country
    books {
      id
      title
      year
    }
  }
}
```

### Add a New Book

```graphql
mutation {
  addBook(title: "GraphQL Basics", year: 2024, authorId: "1") {
    id
    title
    year
  }
}
```

The mutation inserts a book associated with the specified author and returns the newly created book's details.

## 9. Team Details

**Group No.: 16**

| S. No. | Name | Roll Number |
|---|---|---|
| 1 | [Member 1 Name] | [Roll Number] |
| 2 | [Member 2 Name] | [Roll Number] |
| 3 | [Member 3 Name] | [Roll Number] |

**Faculty Guide:** To be added, if applicable.

## 10. Learning Outcomes

Through this project, we explore:

- Designing relational database tables and relationships.
- Developing a GraphQL API using Apollo Server.
- Implementing queries and mutations.
- Connecting a frontend to a backend API.
- Retrieving and inserting data in a MySQL database.
- Using Git and GitHub to manage a software project.

## 11. Future Enhancements

- Add, update, and delete book records.
- Implement book search and filtering.
- Add user authentication and role-based access.
- Track book availability and borrowing records.
- Improve validation and error handling.

---

**Project:** Campus Library Management System  
**Group:** 16  
**Repository:** https://github.com/Krity717/Campus-Library
