
// Browser Runtime Error Listener for AeroSuite
// Add this to your index.html or App.js to capture runtime errors

(function() {
  const errors = [];
  
  // Capture unhandled errors
  window.addEventListener('error', function(event) {
    const error = {
      type: 'javascript',
      message: event.message,
      filename: event.filename,
      line: event.lineno,
      column: event.colno,
      stack: event.error ? event.error.stack : null,
      timestamp: new Date().toISOString()
    };
    
    errors.push(error);
    
    // Send to your error collection endpoint
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(error)
    }).catch(() => {
      // Store locally if network fails
      localStorage.setItem('aerosuite_errors', JSON.stringify(errors));
    });
  });
  
  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    const error = {
      type: 'promise',
      message: event.reason ? event.reason.toString() : 'Unhandled promise rejection',
      stack: event.reason ? event.reason.stack : null,
      timestamp: new Date().toISOString()
    };
    
    errors.push(error);
    
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(error)
    }).catch(() => {
      localStorage.setItem('aerosuite_errors', JSON.stringify(errors));
    });
  });
  
  // Capture React errors (if using error boundary)
  window.captureReactError = function(error, errorInfo) {
    const reactError = {
      type: 'react',
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    };
    
    errors.push(reactError);
    
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reactError)
    }).catch(() => {
      localStorage.setItem('aerosuite_errors', JSON.stringify(errors));
    });
  };
  
  console.log('AeroSuite Runtime Error Listener initialized');
})();
