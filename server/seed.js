const xlsx = require('xlsx');
const path = require('path');
const db = require('./db');

const excelPath = path.join(__dirname, '../course-catalog-download.xlsx');

console.log('Reading Excel file...');
const workbook = xlsx.readFile(excelPath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet);

console.log(`Found ${data.length} rows`);
console.log('Column names:', Object.keys(data[0] || {}));

// Clear existing data
db.prepare('DELETE FROM courses').run();

// Insert data
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

console.log(`Successfully imported ${data.length} courses!`);
console.log('Sample data:', data.slice(0, 2));
