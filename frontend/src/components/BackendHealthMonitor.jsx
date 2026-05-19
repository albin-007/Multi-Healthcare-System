import { useState, useEffect, useRef } from 'react';
import api, { healthApi } from '../services/api';
import { AlertCircle, RefreshCw, Terminal } from 'lucide-react';

export default function BackendHealthMonitor() {
  const [isOffline, setIsOffline] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  // Track consecutive failures before showing the banner
  const failCount = useRef(0);
  const hasCheckedOnce = useRef(false);

  const checkHealth = async () => {
    setIsChecking(true);
    try {
      await healthApi.get(''); // Hits the configured API_URL bypassing interceptors
      failCount.current = 0;
      setIsOffline(false);
    } catch (err) {
      if (!err.response) {
        // No response = server truly unreachable (not just 401/403)
        failCount.current += 1;
        // Only show banner after 2 consecutive failures
        // This prevents false positives on initial cold start or slow boot
        if (failCount.current >= 2) {
          setIsOffline(true);
        }
      } else {
        // Server returned something (even 4xx/5xx) — it IS running
        failCount.current = 0;
        setIsOffline(false);
      }
    } finally {
      setIsChecking(false);
      hasCheckedOnce.current = true;
    }
  };

  useEffect(() => {
    // Delay the first check by 3 seconds to let the server fully
    // initialize before declaring it offline (eliminates cold-start flash)
    const firstCheckTimer = setTimeout(() => {
      checkHealth();
    }, 3000);

    // Then poll every 15 seconds (increased from 10s to reduce noise)
    const interval = setInterval(checkHealth, 15000);

    return () => {
      clearTimeout(firstCheckTimer);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isOffline) return null;

  const getBaseUrlDisplay = () => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    return `http://${window.location.hostname}:8000/api/`;
  };

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      animation: 'fadeUp 0.4s ease both',
    }}>
      <div style={{
        background: 'white',
        border: '2px solid #ffe4e6',
        boxShadow: '0 25px 50px -12px rgba(244, 63, 94, 0.15)',
        borderRadius: 24,
        padding: '20px 24px',
        maxWidth: 340,
        display: 'flex',
        gap: 16,
        alignItems: 'flex-start',
        fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{
          background: '#fee2e2',
          color: '#e11d48',
          padding: 10,
          borderRadius: 14,
          display: 'flex',
          flexShrink: 0,
        }}>
          <AlertCircle style={{ width: 22, height: 22 }} />
        </div>
        <div>
          <h3 style={{
            fontSize: 12, fontWeight: 900, color: '#0f172a',
            textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6,
          }}>
            Backend Offline
          </h3>
          <p style={{
            fontSize: 11, color: '#94a3b8', lineHeight: 1.6, fontWeight: 600,
          }}>
            Cannot reach the Django server at{' '}
            <code style={{ color: '#e11d48' }}>{getBaseUrlDisplay()}</code>.
            <br />Make sure it is running.
          </p>
          <div style={{ display: 'flex', gap: 16, marginTop: 12, alignItems: 'center' }}>
            <button
              onClick={checkHealth}
              disabled={isChecking}
              style={{
                fontSize: 10, fontWeight: 900, textTransform: 'uppercase',
                letterSpacing: '.08em', color: '#1A3C34', background: 'none',
                border: 'none', cursor: isChecking ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 5, opacity: isChecking ? 0.5 : 1,
              }}
            >
              <RefreshCw style={{ width: 11, height: 11, ...(isChecking ? { animation: 'spin 1s linear infinite' } : {}) }} />
              Retry
            </button>
            <div style={{
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '.06em', color: '#94a3b8',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <Terminal style={{ width: 11, height: 11 }} />
              python manage.py runserver
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
