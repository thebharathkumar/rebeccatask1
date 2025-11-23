# Pace University Course Equivalency Search Tool

A web application for searching and filtering study abroad course equivalencies.

## Quick Start

### 1. Install Dependencies

```bash
npm install
cd client && npm install && cd ..
```

### 2. Seed Database from Excel

```bash
npm run seed
```

### 3. Run Development Server

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Features

- Live search with instant results
- Multi-filter by Program, Credits, AOK, School, Department
- Sortable columns
- Admin panel for Excel uploads
- Responsive design with Pace University branding

## Project Structure

```
/
  package.json          # Root dependencies (backend)
  /server
    index.js            # Express server
    db.js               # SQLite database setup
    seed.js             # Excel to DB seeder
    courses.db          # SQLite database (generated)
  /client
    package.json        # React dependencies
    /src
      App.js            # Main React app
      index.js          # Entry point
      index.css         # Styles
```

## API Endpoints

- `GET /api/courses` - Get courses (supports search, filter, sort params)
- `GET /api/filters` - Get filter options
- `GET /api/stats` - Get statistics
- `POST /api/admin/upload` - Upload Excel file

## Deployment (Vercel)

1. Build frontend: `npm run build`
2. Deploy with Vercel CLI or connect GitHub repo
3. Set `NODE_ENV=production`

## Tech Stack

- Frontend: React, CSS
- Backend: Node.js, Express
- Database: SQLite (better-sqlite3)
- Excel Parsing: xlsx
