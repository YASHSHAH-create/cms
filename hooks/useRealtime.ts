/**
 * Real-time data hooks for SSE/WebSocket support
 * 
 * Usage: Set NEXT_PUBLIC_REALTIME=sse to enable Server-Sent Events
 * If not set, silently no-ops (non-blocking)
 */

import { useEffect, useCallback } from 'react';

type RealtimeEvent = 'visitor_added' | 'enquiry_added' | 'conversation_updated';

type RealtimeCallback = (event: RealtimeEvent, data?: any) => void;

/**
 * Hook for real-time updates via Server-Sent Events
 * Non-blocking: if NEXT_PUBLIC_REALTIME is not set, silently no-ops
 */
export function useRealtime(onEvent: RealtimeCallback) {
  const isRealtimeEnabled = process.env.NEXT_PUBLIC_REALTIME === 'sse';

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      const { type, payload } = data;
      
      if (type && onEvent) {
        onEvent(type as RealtimeEvent, payload);
      }
    } catch (error) {
      console.warn('Failed to parse real-time event:', error);
    }
  }, [onEvent]);

  const handleError = useCallback((error: Event) => {
    console.warn('Real-time connection error:', error);
  }, []);

  useEffect(() => {
    if (!isRealtimeEnabled) {
      return; // Silently no-op if not enabled
    }

    let eventSource: EventSource | null = null;

    try {
      // Connect to Server-Sent Events endpoint
      eventSource = new EventSource('/api/realtime/sse');
      
      eventSource.addEventListener('visitor_added', handleMessage);
      eventSource.addEventListener('enquiry_added', handleMessage);
      eventSource.addEventListener('conversation_updated', handleMessage);
      eventSource.addEventListener('message', handleMessage);
      eventSource.addEventListener('error', handleError);

      console.log('Real-time connection established');
    } catch (error) {
      console.warn('Failed to establish real-time connection:', error);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
        console.log('Real-time connection closed');
      }
    };
  }, [isRealtimeEnabled, handleMessage, handleError]);
}

/**
 * Hook for manual real-time event triggering
 * Useful for testing or when SSE is not available
 */
export function useRealtimeTrigger() {
  const triggerEvent = useCallback((event: RealtimeEvent, data?: any) => {
    // Dispatch custom event for manual triggering
    window.dispatchEvent(new CustomEvent('realtime_event', {
      detail: { type: event, data }
    }));
  }, []);

  return { triggerEvent };
}

/**
 * Hook to listen for manual real-time events
 */
export function useRealtimeListener(onEvent: RealtimeCallback) {
  useEffect(() => {
    const handleCustomEvent = (event: CustomEvent) => {
      const { type, data } = event.detail;
      if (type && onEvent) {
        onEvent(type as RealtimeEvent, data);
      }
    };

    window.addEventListener('realtime_event', handleCustomEvent as EventListener);

    return () => {
      window.removeEventListener('realtime_event', handleCustomEvent as EventListener);
    };
  }, [onEvent]);
}
