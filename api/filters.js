const fs = require('fs');
const path = require('path');

let courses = [];
const jsonPath = path.join(process.cwd(), 'data', 'courses.json');
if (fs.existsSync(jsonPath)) {
  courses = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
}

module.exports = (req, res) => {
  const programs = [...new Set(courses.map(c => c.program).filter(Boolean))].sort();
  const credits = [...new Set(courses.map(c => c.foreign_credits).filter(Boolean))].sort();
  const schools = [...new Set(courses.map(c => c.pace_school).filter(Boolean))].sort();
  const departments = [...new Set(courses.map(c => c.pace_department).filter(Boolean))].sort();

  const aokSet = new Set();
  courses.forEach(c => {
    if (c.aok) {
      c.aok.split(/[,;]/).forEach(a => {
        const trimmed = a.trim();
        if (trimmed) aokSet.add(trimmed);
      });
    }
  });
  const aoks = [...aokSet].sort();

  res.json({ programs, credits, aoks, schools, departments });
};
