import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '';

function App() {
  const [page, setPage] = useState('home');
  const [courses, setCourses] = useState([]);
  const [filters, setFilters] = useState({ programs: [], credits: [], aoks: [], schools: [], departments: [] });
  const [stats, setStats] = useState({ total: 0, programs: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    program: '', credits: '', aok: '', school: '', department: ''
  });
  const [sort, setSort] = useState({ column: '', order: 'asc' });

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedFilters.program) params.append('program', selectedFilters.program);
      if (selectedFilters.credits) params.append('credits', selectedFilters.credits);
      if (selectedFilters.aok) params.append('aok', selectedFilters.aok);
      if (selectedFilters.school) params.append('school', selectedFilters.school);
      if (selectedFilters.department) params.append('department', selectedFilters.department);
      if (sort.column) {
        params.append('sort', sort.column);
        params.append('order', sort.order);
      }

      const res = await axios.get(`${API_URL}/api/courses?${params}`);
      setCourses(res.data);
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
    setLoading(false);
  }, [search, selectedFilters, sort]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [filtersRes, statsRes] = await Promise.all([
          axios.get(`${API_URL}/api/filters`),
          axios.get(`${API_URL}/api/stats`)
        ]);
        setFilters(filtersRes.data);
        setStats(statsRes.data);
      } catch (err) {
        console.error('Error fetching initial data:', err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const debounce = setTimeout(fetchCourses, 300);
    return () => clearTimeout(debounce);
  }, [fetchCourses]);

  const handleSort = (column) => {
    setSort(prev => ({
      column,
      order: prev.column === column && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedFilters({ program: '', credits: '', aok: '', school: '', department: '' });
    setSort({ column: '', order: 'asc' });
  };

  const SortIcon = ({ column }) => (
    <span className={`sort-icon ${sort.column === column ? 'active' : ''}`}>
      {sort.column === column ? (sort.order === 'asc' ? ' ^' : ' v') : ''}
    </span>
  );

  if (page === 'admin') {
    return <AdminPage onBack={() => setPage('home')} />;
  }

  return (
    <div className="app">
      <header className="header">
        <div className="container header-content">
          <div className="logo">
            <span className="logo-icon">PACE</span>
            Course Equivalency Search
          </div>
          <nav className="nav-links">
            <a href="#home" className="nav-link" onClick={() => setPage('home')}>Home</a>
            <a href="#admin" className="nav-link" onClick={() => setPage('admin')}>Admin</a>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="container">
          <h1>Find Your Course Equivalencies</h1>
          <p>Search and filter study abroad course equivalencies for Pace University students</p>

          <div className="search-container">
            <div className="search-wrapper">
              <span className="search-icon">Q</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search by course title, code, or program..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="stats">
            <div className="stat">
              <div className="stat-value">{stats.total.toLocaleString()}</div>
              <div className="stat-label">Course Equivalencies</div>
            </div>
            <div className="stat">
              <div className="stat-value">{stats.programs}</div>
              <div className="stat-label">Study Abroad Programs</div>
            </div>
          </div>
        </div>
      </section>

      <main className="container main-content">
        <aside className="filters-panel">
          <div className="filters-header">
            <h3 className="filters-title">Filters</h3>
            <button className="reset-btn" onClick={resetFilters}>Reset All</button>
          </div>

          <div className="filter-group">
            <label className="filter-label">Study Abroad Program</label>
            <select
              className="filter-select"
              value={selectedFilters.program}
              onChange={(e) => setSelectedFilters(f => ({ ...f, program: e.target.value }))}
            >
              <option value="">All Programs</option>
              {filters.programs.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Foreign Credits</label>
            <select
              className="filter-select"
              value={selectedFilters.credits}
              onChange={(e) => setSelectedFilters(f => ({ ...f, credits: e.target.value }))}
            >
              <option value="">All Credits</option>
              {filters.credits.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">AOK (Area of Knowledge)</label>
            <select
              className="filter-select"
              value={selectedFilters.aok}
              onChange={(e) => setSelectedFilters(f => ({ ...f, aok: e.target.value }))}
            >
              <option value="">All AOK</option>
              {filters.aoks.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Pace School</label>
            <select
              className="filter-select"
              value={selectedFilters.school}
              onChange={(e) => setSelectedFilters(f => ({ ...f, school: e.target.value }))}
            >
              <option value="">All Schools</option>
              {filters.schools.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Pace Department</label>
            <select
              className="filter-select"
              value={selectedFilters.department}
              onChange={(e) => setSelectedFilters(f => ({ ...f, department: e.target.value }))}
            >
              <option value="">All Departments</option>
              {filters.departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </aside>

        <section className="results-section">
          <div className="results-header">
            <span className="results-count">
              Showing <strong>{courses.length}</strong> results
            </span>
          </div>

          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Loading courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="results-table-container">
              <div className="empty-state">
                <div className="empty-icon">O</div>
                <p>No courses found matching your criteria</p>
              </div>
            </div>
          ) : (
            <div className="results-table-container">
              <table className="results-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('program')}>Program<SortIcon column="program" /></th>
                    <th onClick={() => handleSort('foreign_course_title')}>Foreign Course<SortIcon column="foreign_course_title" /></th>
                    <th onClick={() => handleSort('foreign_credits')}>Credits<SortIcon column="foreign_credits" /></th>
                    <th onClick={() => handleSort('home_course_title')}>Home Equivalent<SortIcon column="home_course_title" /></th>
                    <th onClick={() => handleSort('aok')}>AOK<SortIcon column="aok" /></th>
                    <th onClick={() => handleSort('pace_school')}>School<SortIcon column="pace_school" /></th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course, idx) => (
                    <tr key={idx}>
                      <td>{course.program}</td>
                      <td>
                        <strong>{course.foreign_course_title}</strong>
                        {course.foreign_course_code && <div style={{fontSize: '0.75rem', color: '#6b7280'}}>{course.foreign_course_code}</div>}
                      </td>
                      <td>{course.foreign_credits}</td>
                      <td>
                        <strong>{course.home_course_title}</strong>
                        {course.home_course_code && <div style={{fontSize: '0.75rem', color: '#6b7280'}}>{course.home_course_code}</div>}
                      </td>
                      <td>
                        {course.aok && course.aok.split(/[,;]/).map((a, i) => (
                          <span key={i} className="tag tag-aok">{a.trim()}</span>
                        ))}
                      </td>
                      <td>
                        {course.pace_school && <span className="tag tag-school">{course.pace_school}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function AdminPage({ onBack }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${API_URL}/api/admin/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage({ type: 'success', text: res.data.message });
      setPreview(res.data.preview);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Upload failed' });
    }
    setUploading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.name.endsWith('.xlsx') || droppedFile?.name.endsWith('.xls')) {
      setFile(droppedFile);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="container header-content">
          <div className="logo">
            <span className="logo-icon">PACE</span>
            Course Equivalency Search
          </div>
          <nav className="nav-links">
            <a href="#home" className="nav-link" onClick={onBack}>Back to Search</a>
          </nav>
        </div>
      </header>

      <div className="admin-page container">
        <div className="admin-card">
          <h2 className="admin-title">Upload Course Data</h2>
          <p className="admin-subtitle">Upload an Excel file to update the course equivalency database</p>

          <div
            className={`upload-zone ${dragging ? 'dragging' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('fileInput').click()}
          >
            <div className="upload-icon">+</div>
            <p className="upload-text">
              {file ? file.name : 'Drop your Excel file here or click to browse'}
            </p>
            <p className="upload-hint">Supports .xlsx and .xls files</p>
          </div>

          <input
            id="fileInput"
            type="file"
            className="file-input"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files[0])}
          />

          <button
            className="upload-btn"
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload and Import'}
          </button>

          {message && (
            <div className={`alert alert-${message.type}`}>
              {message.text}
            </div>
          )}

          {preview && preview.length > 0 && (
            <div className="preview-section">
              <h3 className="preview-title">Preview (first 5 rows)</h3>
              <div style={{overflowX: 'auto'}}>
                <table className="preview-table">
                  <thead>
                    <tr>
                      {Object.keys(preview[0]).map(key => (
                        <th key={key}>{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, idx) => (
                      <tr key={idx}>
                        {Object.values(row).map((val, i) => (
                          <td key={i}>{String(val || '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
