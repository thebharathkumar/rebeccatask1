const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const db = require('./db');

// Try multiple possible Excel file names
const possibleFiles = [
  'VIEW ONLY Pre-Approved Foreign Courses Database.xlsx',
  'course-catalog-download.xlsx'
];

let excelPath = null;
for (const file of possibleFiles) {
  const p = path.join(__dirname, '..', file);
  if (fs.existsSync(p)) {
    excelPath = p;
    break;
  }
}

if (!excelPath) {
  console.error('No Excel file found! Please add one of:', possibleFiles);
  process.exit(1);
}

console.log('Reading Excel file:', path.basename(excelPath));
const workbook = xlsx.readFile(excelPath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet);

console.log(`Found ${data.length} rows`);
console.log('Column names:', Object.keys(data[0] || {}));

// Map rows to our schema
const courses = data.map(row => ({
  program: row['Program(s)'] || row['Study Abroad Program'] || row['Program'] || row['Country'] || '',
  foreign_course_title: row['UCEAP Official Title'] || row['Foreign Course Title'] || row['Course Title'] || '',
  foreign_course_code: row['UCEAP Course Number'] ? `UCEAP ${row['UCEAP Course Number']}${row['UCEAP Course Suffix'] || ''}` : (row['Foreign Course Code'] || row['Course Code'] || ''),
  foreign_credits: String(row['UCEAP Semester Units'] || row['UCEAP Quarter Units'] || row['Foreign Course Credits'] || row['Credits'] || ''),
  home_course_title: row['Host Institution Course Title'] || row['Home Course Title Equivalent'] || row['Home Course Title'] || '',
  aok: row['UCEAP Subject Area(s)'] || row['AOK'] || row['Area of Knowledge'] || '',
  home_course_code: row['Host Institution Course Number(s)'] || row['Home Course Code Equivalent'] || row['Home Course Code'] || '',
  course_notes: row['UCEAP Course Level'] || row['Course Notes'] || row['Notes'] || '',
  pace_school: row['Host Institution'] || row['Pace School'] || row['School'] || '',
  pace_department: row['Host Institution Department'] || row['Pace Department'] || row['Department'] || ''
}));

// Save to SQLite
db.prepare('DELETE FROM courses').run();
const insert = db.prepare(`
  INSERT INTO courses (program, foreign_course_title, foreign_course_code, foreign_credits, home_course_title, aok, home_course_code, course_notes, pace_school, pace_department)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertMany = db.transaction((rows) => {
  for (const row of rows) {
    insert.run(
      row.program, row.foreign_course_title, row.foreign_course_code,
      row.foreign_credits, row.home_course_title, row.aok,
      row.home_course_code, row.course_notes, row.pace_school, row.pace_department
    );
  }
});
insertMany(courses);

// Also save to JSON for Vercel deployment
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
fs.writeFileSync(path.join(dataDir, 'courses.json'), JSON.stringify(courses, null, 2));

console.log(`Successfully imported ${courses.length} courses!`);
console.log('JSON file saved to data/courses.json for Vercel deployment');
