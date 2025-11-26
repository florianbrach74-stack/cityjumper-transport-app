import React, { useState } from 'react';
import { X, TruckIcon, AlertTriangle } from 'lucide-react';
import api from '../services/api';

const InitiateReturnModal = ({ order, onClose, onSuccess }) => {
  const [returnFee, setReturnFee] = useState(order.customer_price || order.price);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  
  const maxReturnFee = parseFloat(order.customer_price || order.price);
  
  const reasons = [
    'Empfänger nicht angetroffen',
    'Falsche Adresse',
    'Empfänger verweigert Annahme',
    'Beschädigtes Transportgut',
    'Sonstiges'
  ];
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await api.post(`/admin/orders/${order.id}/initiate-return`, {
        returnFee: parseFloat(returnFee),
        reason,
        notes
      });
      
      alert('Retoure erfolgreich gestartet');
      onSuccess();
    } catch (error) {
      console.error('Error initiating return:', error);
      alert(error.response?.data?.error || 'Fehler beim Starten der Retoure');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center">
            <TruckIcon className="mr-2 text-orange-600" />
            Retoure starten
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X />
          </button>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
          <div className="flex items-start">
            <AlertTriangle className="text-yellow-600 mr-2 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-yellow-800">
              <strong>Hinweis:</strong> Der Fahrer muss das Transportgut zum Absender zurückbringen.
              Die Retourengebühr wird automatisch zur Rechnung hinzugefügt.
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded p-3 mb-4 text-sm">
          <div className="font-semibold mb-2">Auftrags-Details:</div>
          <div className="space-y-1 text-gray-700">
            <div><strong>Auftrag:</strong> #{order.id}</div>
            <div><strong>Von:</strong> {order.pickup_city}</div>
            <div><strong>Nach:</strong> {order.delivery_city}</div>
            <div><strong>Auftragswert:</strong> €{maxReturnFee.toFixed(2)}</div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grund für Retoure *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Bitte wählen...</option>
              {reasons.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Retourengebühr * (max. €{maxReturnFee.toFixed(2)})
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">€</span>
              <input
                type="number"
                step="0.01"
                min="0"
                max={maxReturnFee}
                value={returnFee}
                onChange={(e) => setReturnFee(e.target.value)}
                required
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Die Retourengebühr wird dem Kunden in Rechnung gestellt
            </p>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zusätzliche Notizen
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="z.B. Kontaktversuche, besondere Umstände..."
            />
          </div>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Wird gestartet...' : 'Retoure starten'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InitiateReturnModal;
