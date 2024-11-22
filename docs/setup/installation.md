# Installation Guide
Welcome to the Scholars Website project! This guide will help you set up the project locally for development and testing.

## Prerequisites
Ensure you have the following installed:

- Node.js (v16 or higher)
- npm (Node Package Manager, comes with Node.js)
- PostgreSQL (for database management)

## Setting Up the Project
### Step 1: Clone the Repository
Clone the project repository to your local machine:

```bash
git clone <repository-url>
cd scholars-website
```

### Step 2: Install Dependencies
Install all necessary dependencies for the root workspace and its sub-packages (client, server, and shared):

```bash
npm install
```
This will automatically install dependencies for all workspaces defined in the project.

### Step 3: Configure the Database
Create a PostgreSQL Database:

Open your PostgreSQL client.
Create a new database for the project (e.g., scholars_db).
```sql
CREATE DATABASE scholars_db;
```
### Set Up Environment Variables:

Create a .env file in the root directory.

Add the following variables (replace placeholders with actual values):

```php
DATABASE_URL=postgresql://<username>:<password>@<host>:<port>/<database_name>
```
### Step 4: Initialize the Database
Run the Prisma migrations to set up the database schema:

``` bash
npx prisma migrate dev
```
Seed the database with initial data:

```bash
npm run seed
```

Step 5: Start the Development Servers
Run the following command to start both the client and server concurrently:

```bash
npm run dev
```

Client: The frontend will be accessible at http://localhost:3000.

Server: The backend will run at http://localhost:4000 (or another port if specified).

### Step 6: Build for Production
To create a production build of both the client and server, run:

```bash
npm run build
```

Step 7: Run Tests
To run tests for both the client and server:

```bash
npm run test
```
