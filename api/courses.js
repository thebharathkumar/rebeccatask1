const fs = require('fs');
const path = require('path');

let courses = [];
const jsonPath = path.join(process.cwd(), 'data', 'courses.json');
if (fs.existsSync(jsonPath)) {
  courses = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
}

module.exports = (req, res) => {
  const { search, program, credits, aok, school, department, sort, order } = req.query;

  let filtered = [...courses];

  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(c =>
      (c.foreign_course_title || '').toLowerCase().includes(s) ||
      (c.foreign_course_code || '').toLowerCase().includes(s) ||
      (c.home_course_title || '').toLowerCase().includes(s) ||
      (c.home_course_code || '').toLowerCase().includes(s) ||
      (c.program || '').toLowerCase().includes(s)
    );
  }

  if (program) filtered = filtered.filter(c => c.program === program);
  if (credits) filtered = filtered.filter(c => c.foreign_credits === credits);
  if (aok) filtered = filtered.filter(c => (c.aok || '').includes(aok));
  if (school) filtered = filtered.filter(c => c.pace_school === school);
  if (department) filtered = filtered.filter(c => c.pace_department === department);

  if (sort) {
    filtered.sort((a, b) => {
      const aVal = a[sort] || '';
      const bVal = b[sort] || '';
      return order === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
    });
  }

  res.json(filtered);
};
