const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const xlsx = require('xlsx');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Get all courses with optional filters
app.get('/api/courses', (req, res) => {
  try {
    const { search, program, credits, aok, school, department, sort, order } = req.query;

    let query = 'SELECT * FROM courses WHERE 1=1';
    const params = [];

    if (search) {
      query += ` AND (
        foreign_course_title LIKE ? OR
        foreign_course_code LIKE ? OR
        home_course_title LIKE ? OR
        home_course_code LIKE ? OR
        program LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (program) {
      query += ' AND program = ?';
      params.push(program);
    }

    if (credits) {
      query += ' AND foreign_credits = ?';
      params.push(credits);
    }

    if (aok) {
      query += ' AND aok LIKE ?';
      params.push(`%${aok}%`);
    }

    if (school) {
      query += ' AND pace_school = ?';
      params.push(school);
    }

    if (department) {
      query += ' AND pace_department = ?';
      params.push(department);
    }

    // Sorting
    const validColumns = ['program', 'foreign_course_title', 'foreign_course_code', 'foreign_credits', 'home_course_title', 'aok', 'home_course_code', 'pace_school', 'pace_department'];
    if (sort && validColumns.includes(sort)) {
      const sortOrder = order === 'desc' ? 'DESC' : 'ASC';
      query += ` ORDER BY ${sort} ${sortOrder}`;
    } else {
      query += ' ORDER BY program, foreign_course_title';
    }

    const courses = db.prepare(query).all(...params);
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Get filter options
app.get('/api/filters', (req, res) => {
  try {
    const programs = db.prepare('SELECT DISTINCT program FROM courses WHERE program IS NOT NULL AND program != "" ORDER BY program').all().map(r => r.program);
    const credits = db.prepare('SELECT DISTINCT foreign_credits FROM courses WHERE foreign_credits IS NOT NULL AND foreign_credits != "" ORDER BY foreign_credits').all().map(r => r.foreign_credits);
    const schools = db.prepare('SELECT DISTINCT pace_school FROM courses WHERE pace_school IS NOT NULL AND pace_school != "" ORDER BY pace_school').all().map(r => r.pace_school);
    const departments = db.prepare('SELECT DISTINCT pace_department FROM courses WHERE pace_department IS NOT NULL AND pace_department != "" ORDER BY pace_department').all().map(r => r.pace_department);

    // AOK can have multiple values, so we need to split and dedupe
    const aokRaw = db.prepare('SELECT DISTINCT aok FROM courses WHERE aok IS NOT NULL AND aok != ""').all().map(r => r.aok);
    const aokSet = new Set();
    aokRaw.forEach(a => {
      if (a) {
        a.split(/[,;]/).forEach(item => {
          const trimmed = item.trim();
          if (trimmed) aokSet.add(trimmed);
        });
      }
    });
    const aoks = Array.from(aokSet).sort();

    res.json({ programs, credits, aoks, schools, departments });
  } catch (error) {
    console.error('Error fetching filters:', error);
    res.status(500).json({ error: 'Failed to fetch filters' });
  }
});

// Admin: Upload Excel file
app.post('/api/admin/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    // Clear existing data
    db.prepare('DELETE FROM courses').run();

    // Insert new data
    const insert = db.prepare(`
      INSERT INTO courses (program, foreign_course_title, foreign_course_code, foreign_credits, home_course_title, aok, home_course_code, course_notes, pace_school, pace_department)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((rows) => {
      for (const row of rows) {
        insert.run(
          row['Program(s)'] || row['Study Abroad Program'] || row['Country'] || '',
          row['UCEAP Official Title'] || row['Foreign Course Title'] || '',
          row['UCEAP Course Number'] ? `UCEAP ${row['UCEAP Course Number']}${row['UCEAP Course Suffix'] || ''}` : (row['Foreign Course Code'] || ''),
          row['UCEAP Semester Units'] || row['UCEAP Quarter Units'] || row['Foreign Course Credits'] || '',
          row['Host Institution Course Title'] || row['Home Course Title Equivalent'] || '',
          row['UCEAP Subject Area(s)'] || row['AOK'] || '',
          row['Host Institution Course Number(s)'] || row['Home Course Code Equivalent'] || '',
          row['UCEAP Course Level'] || row['Course Notes'] || '',
          row['Host Institution'] || row['Pace School'] || '',
          row['Host Institution Department'] || row['Pace Department'] || ''
        );
      }
    });

    insertMany(data);

    res.json({
      success: true,
      message: `Successfully imported ${data.length} courses`,
      preview: data.slice(0, 5),
      total: data.length
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to process file: ' + error.message });
  }
});

// Get stats
app.get('/api/stats', (req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(*) as count FROM courses').get().count;
    const programs = db.prepare('SELECT COUNT(DISTINCT program) as count FROM courses').get().count;
    res.json({ total, programs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Serve React app for all other routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
