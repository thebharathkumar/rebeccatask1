const fs = require('fs');
const path = require('path');

let courses = [];
const jsonPath = path.join(process.cwd(), 'data', 'courses.json');
if (fs.existsSync(jsonPath)) {
  courses = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
}

module.exports = (req, res) => {
  const total = courses.length;
  const programs = new Set(courses.map(c => c.program).filter(Boolean)).size;
  res.json({ total, programs });
};
