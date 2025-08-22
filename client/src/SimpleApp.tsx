import React from 'react';

const SimpleApp: React.FC = () => {
  const [apiStatus, setApiStatus] = React.useState<any>('Checking...');

  React.useEffect(() => {
    // Check API status
    fetch('http://localhost:5002/api/health')
      .then(res => res.json())
      .then(data => {
        setApiStatus('✅ API Server is running');
      })
      .catch(err => {
        setApiStatus('❌ API Server is not responding');
      });
  }, []);

  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif',
      padding: '2rem',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1 style={{ color: '#1976d2' }}>Welcome to AeroSuite</h1>
      <p style={{ fontSize: '1.2rem', color: '#666' }}>
        Your aerospace supply chain management platform
      </p>
      
      <div style={{ 
        marginTop: '2rem',
        padding: '1.5rem',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px'
      }}>
        <h2>System Status</h2>
        <p>{apiStatus}</p>
        <p>React Client: ✅ Running on port 3000</p>
      </div>

      <div style={{ 
        marginTop: '2rem',
        padding: '1.5rem',
        backgroundColor: '#e3f2fd',
        borderRadius: '8px'
      }}>
        <h2>Quick Links</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: '0.5rem' }}>
            <a href="/demo.html" style={{ color: '#1976d2', textDecoration: 'none' }}>
              📊 API Demo Page
            </a>
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <a href="http://localhost:5002/api/health" target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2', textDecoration: 'none' }}>
              🔍 API Health Check
            </a>
          </li>
        </ul>
      </div>

      <div style={{ 
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#fff3cd',
        borderRadius: '8px',
        border: '1px solid #ffeaa7'
      }}>
        <h3>Note</h3>
        <p>The full application with routing is temporarily disabled due to configuration issues. Use the API Demo Page to test functionality.</p>
      </div>
    </div>
  );
};

export default SimpleApp; 