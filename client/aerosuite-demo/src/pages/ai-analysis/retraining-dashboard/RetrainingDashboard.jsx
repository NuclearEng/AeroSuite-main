import React, { useEffect, useState, useRef } from 'react';
import { io as socketIOClient } from 'socket.io-client';

const API = '/api/retraining';

function RetrainingDashboard() {
  const [modelId, setModelId] = useState('');
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [inputModelId, setInputModelId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [models, setModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [live, setLive] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimeout = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const fetchModels = async () => {
      setModelsLoading(true);
      try {
        const res = await fetch(`${API}/models`);
        const data = await res.json();
        setModels(data.models || []);
      } catch (e) {
        setModels([]);
      }
      setModelsLoading(false);
    };
    fetchModels();
  }, []);

  useEffect(() => {
    // Setup socket.io connection
    const socket = socketIOClient({ path: '/socket.io' });
    socketRef.current = socket;
    socket.on('connect', () => setLive(true));
    socket.on('disconnect', () => setLive(false));
    socket.on('retraining-event', (event) => {
      if (event.modelId === modelId) {
        setToast(`${event.type.replace(/-/g, ' ')} for model ${event.modelId}`);
        fetchStatus(modelId);
        fetchHistory(modelId);
      }
    });
    socket.on('retraining-audit', (event) => {
      if (event.modelId === modelId) {
        fetchHistory(modelId);
      }
    });
    return () => {
      socket.disconnect();
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
    };
     
  }, [modelId]);

  useEffect(() => {
    if (toast) {
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
      toastTimeout.current = setTimeout(() => setToast(null), 3500);
    }
  }, [toast]);

  const fetchStatus = async (id) => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${API}/${id}/status`);
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      setMessage('Failed to fetch status');
    }
    setLoading(false);
  };

  const fetchHistory = async (id) => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${API}/${id}/history`);
      const data = await res.json();
      setHistory(data.history || []);
    } catch (e) {
      setMessage('Failed to fetch history');
    }
    setLoading(false);
  };

  const handleLoad = () => {
    setModelId(inputModelId);
    fetchStatus(inputModelId);
    fetchHistory(inputModelId);
  };

  const handleModelSelect = (e) => {
    setInputModelId(e.target.value);
    setModelId(e.target.value);
    fetchStatus(e.target.value);
    fetchHistory(e.target.value);
  };

  const handleTrigger = async () => {
    setLoading(true);
    setMessage('');
    try {
      await fetch(`${API}/${modelId}/trigger`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: 'manual' }) });
      setMessage('Retraining triggered.');
      fetchHistory(modelId);
      fetchStatus(modelId);
    } catch (e) {
      setMessage('Failed to trigger retraining');
    }
    setLoading(false);
  };

  const handleApprove = async () => {
    setLoading(true);
    setMessage('');
    try {
      await fetch(`${API}/${modelId}/approve`, { method: 'POST' });
      setMessage('Retrain approved.');
    } catch (e) {
      setMessage('Failed to approve retrain');
    }
    setLoading(false);
  };

  const handleDeny = async () => {
    setLoading(true);
    setMessage('');
    try {
      await fetch(`${API}/${modelId}/deny`, { method: 'POST' });
      setMessage('Retrain denied.');
    } catch (e) {
      setMessage('Failed to deny retrain');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', padding: 32, border: '1px solid #ccc', borderRadius: 12, background: '#fafbfc', fontFamily: 'sans-serif', position: 'relative' }}>
      <h2 style={{ marginBottom: 24 }}>
        Automated Retraining Dashboard
        {live && <span style={{ marginLeft: 16, color: '#43a047', fontSize: 16, fontWeight: 600 }}>● Live</span>}
      </h2>
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, background: '#1976d2', color: '#fff', padding: '12px 24px', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 1000 }}>
          {toast}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, gap: 16 }}>
        <div>
          <label style={{ fontWeight: 500, marginRight: 8 }}>Select Model:</label>
          <select value={inputModelId} onChange={handleModelSelect} disabled={modelsLoading || loading} style={{ padding: 6, minWidth: 180 }}>
            <option value="">-- Choose a model --</option>
            {models.map(m => (
              <option key={m.id || m.name} value={m.id || m.name}>{m.name || m.id}</option>
            ))}
          </select>
          {modelsLoading && <span style={{ marginLeft: 8, color: '#888' }}>Loading models...</span>}
        </div>
        <span style={{ color: '#888', fontSize: 13 }}>or</span>
        <input
          type="text"
          placeholder="Enter Model ID"
          value={inputModelId}
          onChange={e => setInputModelId(e.target.value)}
          style={{ marginRight: 8, padding: 6, minWidth: 180 }}
          disabled={loading}
        />
        <button onClick={handleLoad} disabled={loading || !inputModelId} style={{ padding: '6px 16px' }}>Load</button>
      </div>
      {modelId && (
        <>
          <h3 style={{ margin: '24px 0 8px 0' }}>Model: <span style={{ color: '#1976d2' }}>{modelId}</span></h3>
          <div style={{ marginBottom: 12, display: 'flex', gap: 12 }}>
            <button onClick={handleTrigger} disabled={loading} style={{ padding: '6px 16px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4 }}>Trigger Retraining</button>
            <button onClick={handleApprove} disabled={loading} style={{ padding: '6px 16px', background: '#43a047', color: '#fff', border: 'none', borderRadius: 4 }}>Approve</button>
            <button onClick={handleDeny} disabled={loading} style={{ padding: '6px 16px', background: '#e53935', color: '#fff', border: 'none', borderRadius: 4 }}>Deny</button>
            {loading && <span style={{ color: '#888', marginLeft: 8 }}>Loading...</span>}
          </div>
          {message && <div style={{ color: '#388e3c', marginBottom: 8, fontWeight: 500 }}>{message}</div>}
          <div style={{ marginBottom: 20 }}>
            <strong>Status:</strong>
            <pre style={{ background: '#f7f7f7', padding: 12, borderRadius: 6 }}>{JSON.stringify(status, null, 2)}</pre>
            <strong>Next Eligible Retrain:</strong> {status?.nextEligible ? new Date(status.nextEligible).toLocaleString() : 'N/A'}
          </div>
          <div>
            <strong>Retrain History:</strong>
            <pre style={{ background: '#f7f7f7', padding: 12, borderRadius: 6, maxHeight: 320, overflow: 'auto' }}>{JSON.stringify(history, null, 2)}</pre>
          </div>
        </>
      )}
    </div>
  );
}

export default RetrainingDashboard; 