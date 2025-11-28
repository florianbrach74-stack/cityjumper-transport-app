import React, { useState } from 'react';
import { bidsAPI } from '../services/api';
import { X, DollarSign, MessageSquare, Shield } from 'lucide-react';

const BidModal = ({ order, onClose, onSuccess }) => {
  const existingBid = order?.existingBid;
  const isEditing = !!existingBid;
  
  const [bidAmount, setBidAmount] = useState(existingBid?.bid_amount || '');
  const [message, setMessage] = useState(existingBid?.message || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [customerProtectionConsent, setCustomerProtectionConsent] = useState(isEditing); // Auto-accept if editing

  // Safety check
  if (!order) {
    return null;
  }

  // Ensure price is a number
  const orderPrice = parseFloat(order.price) || 0;
  
  // Suggested bid (85% of customer price - contractor doesn't see the actual customer price)
  const suggestedBid = orderPrice * 0.85;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const bidValue = parseFloat(bidAmount);
    if (isNaN(bidValue) || bidValue <= 0) {
      setError('Bitte geben Sie einen gültigen Preis ein');
      return;
    }

    if (!customerProtectionConsent) {
      setError('Bitte bestätigen Sie die Kundenschutzvereinbarung');
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing) {
        // Update existing bid
        await bidsAPI.updateBid(existingBid.id, {
          bidAmount: bidValue,
          message: message.trim() || null,
        });
      } else {
        // Create new bid
        await bidsAPI.createBid(order.id, {
          bidAmount: bidValue,
          message: message.trim() || null,
        });
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || `Fehler beim ${isEditing ? 'Aktualisieren' : 'Senden'} der Bewerbung`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Gebot bearbeiten' : 'Auf Auftrag bewerben'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Order Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Auftrags-Details</h4>
            <p className="text-sm text-gray-600">
              <strong>Route:</strong> {order.pickup_city} → {order.delivery_city}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Datum:</strong> {new Date(order.pickup_date).toLocaleDateString('de-DE')}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Fahrzeug:</strong> {order.vehicle_type}
            </p>
            
            {/* Badges for special services */}
            {(order.legal_delivery || order.needs_loading_help || order.needs_unloading_help) && (
              <div className="flex flex-wrap gap-2 mt-3 mb-3">
                {order.legal_delivery && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                    ⚖️ Rechtssichere Zustellung
                  </span>
                )}
                {order.needs_loading_help && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    📦 Beladehilfe (+€6)
                  </span>
                )}
                {order.needs_unloading_help && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    🚢 Entladehilfe (+€6)
                  </span>
                )}
              </div>
            )}
            
            <p className="text-sm text-gray-600">
              <strong>Vorgeschlagener Preis:</strong> <span className="font-semibold text-primary-600">€{suggestedBid.toFixed(2)}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Sie können jeden beliebigen Preis anbieten
            </p>
          </div>

          {/* Bid Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="inline h-4 w-4 mr-1" />
              Ihr Preis-Angebot *
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder="Ihr Preis-Angebot in €"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
              <button
                type="button"
                onClick={() => setBidAmount(suggestedBid.toFixed(2))}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-primary-600 hover:text-primary-700"
              >
                Vorschlag
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Geben Sie Ihr gewünschtes Angebot ein
            </p>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MessageSquare className="inline h-4 w-4 mr-1" />
              Nachricht (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Warum sind Sie der richtige Auftragnehmer für diesen Job?"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Customer Protection Agreement */}
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
            <div className="flex items-start">
              <Shield className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="ml-3">
                <h4 className="text-sm font-semibold text-amber-900 mb-2">
                  Kundenschutzvereinbarung
                </h4>
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="customerProtectionConsent"
                    checked={customerProtectionConsent}
                    onChange={(e) => setCustomerProtectionConsent(e.target.checked)}
                    className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="customerProtectionConsent" className="text-sm text-amber-800">
                    Hiermit erkläre ich mich ausdrücklich mit der in den{' '}
                    <a 
                      href="/agb" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 underline font-semibold"
                    >
                      AGBs geregelten Kundenschutzvereinbarung
                    </a>
                    {' '}einverstanden. Ich verpflichte mich, Kunden des Auftraggebers nicht direkt oder indirekt zu kontaktieren und die Geheimhaltungspflicht einzuhalten.
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Wird gesendet...' : 'Bewerbung absenden'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BidModal;
