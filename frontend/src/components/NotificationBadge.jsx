import { useEffect, useState, useRef } from 'react';
import { getToken } from '../lib/auth.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export function NotificationBadge() {
  const [count, setCount] = useState(0);
  const token = getToken();
  const isMountedRef = useRef(true);

  useEffect(() => {
    if (!token) return;

    isMountedRef.current = true;

    const loadCount = async () => {
      // Prevent multiple simultaneous requests
      if (!isMountedRef.current) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/borrower/notifications/count/`, {
          headers: { Authorization: `Token ${token}` },
        });

        if (response.ok && isMountedRef.current) {
          const data = await response.json();
          setCount(data.unread_count || 0);
        }
      } catch (err) {
        // Silently fail - don't spam console
        if (isMountedRef.current) {
          console.error('Failed to load notification count:', err);
        }
      }
    };

    // Load immediately
    loadCount();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      if (isMountedRef.current) {
        loadCount();
      }
    }, 30000);
    
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [token]);

  if (count === 0) return null;

  return (
    <span style={{
      position: 'absolute',
      top: '-8px',
      right: '-8px',
      background: '#ef4444',
      color: '#fff',
      borderRadius: '12px',
      padding: '4px 8px',
      fontSize: '12px',
      fontWeight: 700,
      minWidth: '20px',
      textAlign: 'center',
      boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
    }}>
      {count > 9 ? '9+' : count}
    </span>
  );
}
