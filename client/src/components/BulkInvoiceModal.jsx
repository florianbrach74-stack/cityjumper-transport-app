import { useState } from 'react';
import { X } from 'lucide-react';
import api from '../services/api';

export default function BulkInvoiceModal({ orders, onClose, onSuccess }) {
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Calculate totals
  const subtotal = orders.reduce((sum, order) => sum + parseFloat(order.price || 0), 0);
  const taxRate = 19;
  const taxAmount = (subtotal * taxRate) / 100;
  const totalAmount = subtotal + taxAmount;

  // Get customer (all orders should have same customer)
  const customer = orders[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      const response = await api.post('/invoices/bulk', {
        orderIds: orders.map(o => o.id),
        customerId: customer.customer_id,
        notes,
        dueDate: dueDate || null
      });
      
      alert('Sammelrechnung erfolgreich erstellt!');
      onSuccess(response.data.invoice);
      onClose();
      
    } catch (err) {
      console.error('Create bulk invoice error:', err);
      setError(err.response?.data?.error || 'Fehler beim Erstellen der Rechnung');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">Sammelrechnung erstellen</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Customer Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Kunde</h3>
            <p className="text-sm">
              {customer.customer_first_name} {customer.customer_last_name}
              {customer.customer_email && ` (${customer.customer_email})`}
            </p>
          </div>

          {/* Orders List */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Aufträge ({orders.length})</h3>
            <div className="space-y-2">
              {orders.map((order, index) => (
                <div key={order.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div className="flex-1">
                    <div className="font-medium">#{order.id} - {order.pickup_city} → {order.delivery_city}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                  <div className="font-semibold text-blue-600">
                    €{parseFloat(order.price).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Zwischensumme:</span>
                <span>€{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>MwSt. ({taxRate}%):</span>
                <span>€{taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-blue-200 pt-2">
                <span>Gesamtsumme:</span>
                <span className="text-blue-600">€{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Due Date */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fälligkeitsdatum (optional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Standard: 14 Tage ab heute
            </p>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Anmerkungen (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="z.B. Zahlungsbedingungen, Rabatte, etc."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Erstelle Rechnung...' : 'Rechnung erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
