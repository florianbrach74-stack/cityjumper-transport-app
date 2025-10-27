import React, { useState } from 'react';
import { bidsAPI } from '../services/api';
import { X, DollarSign, MessageSquare } from 'lucide-react';

const BidModal = ({ order, onClose, onSuccess }) => {
  const [bidAmount, setBidAmount] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Calculate max bid (85% of customer price)
  const maxBid = order.price * 0.85;
  const suggestedBid = maxBid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const bidValue = parseFloat(bidAmount);
    if (isNaN(bidValue) || bidValue <= 0) {
      setError('Bitte geben Sie einen gültigen Preis ein');
      return;
    }

    if (bidValue > maxBid) {
      setError(`Ihr Gebot darf maximal ${maxBid.toFixed(2)}€ betragen`);
      return;
    }

    setSubmitting(true);
    try {
      await bidsAPI.createBid(order.id, {
        bidAmount: bidValue,
        message: message.trim() || null,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Fehler beim Senden der Bewerbung');
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
            Auf Auftrag bewerben
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
            <p className="text-sm text-gray-600">
              <strong>Max. Gebot:</strong> <span className="font-semibold text-primary-600">€{maxBid.toFixed(2)}</span>
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
                max={maxBid}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={`Max. ${maxBid.toFixed(2)}€`}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
              <button
                type="button"
                onClick={() => setBidAmount(suggestedBid.toFixed(2))}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-primary-600 hover:text-primary-700"
              >
                Max. verwenden
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Sie erhalten 85% des Kundenpreises (€{order.price})
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
