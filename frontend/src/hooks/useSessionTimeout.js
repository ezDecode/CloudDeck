import { useEffect, useRef, useCallback } from 'react';
import { clearStoredCredentials } from '../utils/authUtils';

/**
 * Hook to handle session timeout after inactivity
 * @param {number} timeoutMinutes - Timeout in minutes
 * @param {Function} onTimeout - Function to call when timeout occurs
 */
export default function useSessionTimeout(timeoutMinutes = 3, onTimeout = null) {
  const timeoutRef = useRef(null);

  const handleTimeout = useCallback(() => {
    // Clear any session data
    clearStoredCredentials();
    
    // Call the provided onTimeout callback if available
    if (onTimeout && typeof onTimeout === 'function') {
      onTimeout();
    } else {
      // Default behavior: redirect to login page
      window.location.href = '/login';
    }
  }, [onTimeout]);

  const resetTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(handleTimeout, timeoutMinutes * 60 * 1000);
  }, [timeoutMinutes, handleTimeout]);

  useEffect(() => {
    // Event listeners to detect user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    // Reset the timeout initially
    resetTimeout();
    
    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, resetTimeout);
    });
    
    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      events.forEach(event => {
        document.removeEventListener(event, resetTimeout);
      });
    };
  }, [resetTimeout]);
}
