import { useState } from 'react';
import './App.css';

const API_URL = '/api';

function App() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_URL}/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to submit entry');
      }

      const newEntry = await response.json();
      setEntries(prev => [newEntry, ...prev]);
      setFormData({ name: '', email: '', message: '' });
      setSuccess('Entry submitted successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEntries = async () => {
    try {
      const response = await fetch(`${API_URL}/entries`);
      if (response.ok) {
        const data = await response.json();
        setEntries(data);
      }
    } catch (err) {
      setError('Failed to load entries');
    }
  };

  return (
    <div className="container">
      <h1>Entry Form</h1>
      
      <form onSubmit={handleSubmit} className="entry-form">
        <h2>Submit Entry</h2>
        
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
        
        <div className="form-group">
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Enter your name"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="Enter your email"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="message">Message:</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            placeholder="Enter your message"
            rows={4}
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Entry'}
        </button>
      </form>

      <div className="entries-section">
        <h2>Submitted Entries</h2>
        <button onClick={fetchEntries}>Load Entries</button>
        
        <div className="entries-list">
          {entries.length === 0 ? (
            <p>No entries yet. Click "Load Entries" to see submissions.</p>
          ) : (
            entries.map(entry => (
              <div key={entry.id} className="entry-card">
                <h3>{entry.name}</h3>
                <p className="email">{entry.email}</p>
                <p className="message">{entry.message}</p>
                <small>#{entry.id}</small>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
