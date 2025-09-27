import React, { useState } from 'react';
import { useRealtimeSync } from '@/lib/utils/realtimeSync';

interface EnquiryFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function EnquiryForm({ onClose, onSuccess }: EnquiryFormProps) {
  const { addEnquiry } = useRealtimeSync();
  const [formData, setFormData] = useState({
    visitorName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    service: 'General Inquiry',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.visitorName.trim() || !formData.message.trim()) {
        setError('Name and message are required');
        return;
      }

      if (!formData.email.trim() && !formData.phone.trim()) {
        setError('Either email or phone number is required');
        return;
      }

      // Prepare enquiry data
      const enquiryData = {
        visitorName: formData.visitorName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        subject: formData.subject.trim() || 'General Inquiry',
        message: formData.message.trim(),
        service: formData.service,
        status: 'enquiry_required',
        priority: formData.priority,
        createdAt: new Date()
      };

      // Add enquiry using real-time sync
      const success = await addEnquiry(enquiryData);

      if (success) {
        console.log('✅ Enquiry added successfully');
        onSuccess?.();
        onClose();
        
        // Show success message
        if (window.confirm('Enquiry added successfully! The dashboard will refresh to show the new enquiry.')) {
          window.location.reload();
        }
      } else {
        setError('Failed to add enquiry. Please try again.');
      }
    } catch (err) {
      console.error('Error adding enquiry:', err);
      setError('An error occurred while adding the enquiry');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Add New Enquiry</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Visitor Name *
              </label>
              <input
                type="text"
                name="visitorName"
                value={formData.visitorName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief subject of the enquiry"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service
              </label>
              <select
                name="service"
                value={formData.service}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="General Inquiry">General Inquiry</option>
                <option value="Environmental Consulting">Environmental Consulting</option>
                <option value="Water Quality Testing">Water Quality Testing</option>
                <option value="Air Quality Monitoring">Air Quality Monitoring</option>
                <option value="Waste Management">Waste Management</option>
                <option value="Laboratory Services">Laboratory Services</option>
                <option value="Training Programs">Training Programs</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message *
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Detailed enquiry message..."
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Enquiry'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
