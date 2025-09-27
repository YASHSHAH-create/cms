// Real-time synchronization utilities for enquiries and visitors

export interface EnquiryData {
  id?: string;
  visitorName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  service: string;
  status: string;
  priority: 'low' | 'medium' | 'high';
  assignedAgent?: string;
  createdAt: Date;
}

export interface VisitorData {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  service: string;
  enquiryDetails: string;
  source: 'chatbot' | 'email' | 'calls' | 'website';
  status: string;
  assignedAgent?: string;
  agentName?: string;
  createdAt: Date;
}

// Event system for real-time updates
type EventType = 'enquiry_added' | 'enquiry_updated' | 'visitor_added' | 'visitor_updated';

interface EventData {
  type: EventType;
  data: EnquiryData | VisitorData;
  timestamp: Date;
}

class RealtimeSync {
  private listeners: Map<EventType, Function[]> = new Map();
  private updateQueue: EventData[] = [];
  private isProcessing = false;

  // Subscribe to real-time updates
  subscribe(eventType: EventType, callback: Function): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(eventType);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  // Emit event to all subscribers
  emit(eventType: EventType, data: EnquiryData | VisitorData) {
    const event: EventData = {
      type: eventType,
      data,
      timestamp: new Date()
    };

    // Add to update queue
    this.updateQueue.push(event);
    
    // Process queue
    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing || this.updateQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.updateQueue.length > 0) {
      const event = this.updateQueue.shift()!;
      const callbacks = this.listeners.get(event.type);
      
      if (callbacks) {
        // Notify all subscribers
        callbacks.forEach(callback => {
          try {
            callback(event.data, event.timestamp);
          } catch (error) {
            console.error('Error in realtime callback:', error);
          }
        });
      }

      // Add small delay to prevent overwhelming the UI
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    this.isProcessing = false;
  }

  // Add new enquiry and notify all dashboards
  async addEnquiry(enquiryData: EnquiryData): Promise<boolean> {
    try {
      // Make API call to add enquiry
      const response = await fetch('/api/analytics/add-enquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('ems_token')}`
        },
        body: JSON.stringify(enquiryData)
      });

      if (!response.ok) {
        throw new Error('Failed to add enquiry');
      }

      const result = await response.json();
      
      // Emit event to notify all subscribers
      this.emit('enquiry_added', { ...enquiryData, id: result.enquiryId });
      
      return true;
    } catch (error) {
      console.error('Error adding enquiry:', error);
      return false;
    }
  }

  // Add new visitor and notify all dashboards
  async addVisitor(visitorData: VisitorData): Promise<boolean> {
    try {
      // Make API call to add visitor
      const response = await fetch('/api/visitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('ems_token')}`
        },
        body: JSON.stringify(visitorData)
      });

      if (!response.ok) {
        throw new Error('Failed to add visitor');
      }

      const result = await response.json();
      
      // Emit event to notify all subscribers
      this.emit('visitor_added', { ...visitorData, id: result.visitorId });
      
      return true;
    } catch (error) {
      console.error('Error adding visitor:', error);
      return false;
    }
  }

  // Update enquiry status
  async updateEnquiry(enquiryId: string, updates: Partial<EnquiryData>): Promise<boolean> {
    try {
      const response = await fetch('/api/analytics/update-enquiry', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('ems_token')}`
        },
        body: JSON.stringify({ enquiryId, ...updates })
      });

      if (!response.ok) {
        throw new Error('Failed to update enquiry');
      }

      const result = await response.json();
      
      // Emit event to notify all subscribers
      this.emit('enquiry_updated', { ...updates, id: enquiryId } as EnquiryData);
      
      return true;
    } catch (error) {
      console.error('Error updating enquiry:', error);
      return false;
    }
  }

  // Refresh data across all dashboards
  refreshAllDashboards() {
    // Emit a refresh event that dashboards can listen to
    window.dispatchEvent(new CustomEvent('dashboard_refresh', {
      detail: { timestamp: new Date() }
    }));
  }
}

// Create singleton instance
export const realtimeSync = new RealtimeSync();

// Hook for React components to use real-time sync
export function useRealtimeSync() {
  return {
    addEnquiry: (data: EnquiryData) => realtimeSync.addEnquiry(data),
    addVisitor: (data: VisitorData) => realtimeSync.addVisitor(data),
    updateEnquiry: (id: string, updates: Partial<EnquiryData>) => realtimeSync.updateEnquiry(id, updates),
    subscribe: (eventType: EventType, callback: Function) => realtimeSync.subscribe(eventType, callback),
    refreshAll: () => realtimeSync.refreshAllDashboards()
  };
}
