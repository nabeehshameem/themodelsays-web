import React from 'react';
import ReactDOM from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import App from './App.jsx';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ background: '#0d0118', color: '#b9aed0', fontFamily: 'sans-serif', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 32 }}>⚽</div>
          <div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>Something went wrong</div>
          <div style={{ fontSize: 14, maxWidth: 360 }}>The app hit an unexpected error. Try refreshing the page.</div>
          <button onClick={() => window.location.reload()} style={{ marginTop: 8, padding: '10px 24px', background: '#00FF87', color: '#0d0118', border: 0, borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Refresh</button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
    <Analytics />
  </React.StrictMode>
);
