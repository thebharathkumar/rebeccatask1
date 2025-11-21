const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'courses.db'));

// Create courses table
db.exec(`
  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    program TEXT,
    foreign_course_title TEXT,
    foreign_course_code TEXT,
    foreign_credits TEXT,
    home_course_title TEXT,
    aok TEXT,
    home_course_code TEXT,
    course_notes TEXT,
    pace_school TEXT,
    pace_department TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create indexes for better search performance
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_program ON courses(program);
  CREATE INDEX IF NOT EXISTS idx_pace_school ON courses(pace_school);
  CREATE INDEX IF NOT EXISTS idx_pace_department ON courses(pace_department);
`);

module.exports = db;
