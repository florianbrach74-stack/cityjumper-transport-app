import { useState } from 'react';
import { X, TrendingUp, AlertCircle } from 'lucide-react';
import { ordersAPI } from '../services/api';

export default function UpdatePriceModal({ order, onClose, onSuccess }) {
  const [newPrice, setNewPrice] = useState(order.price);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const priceValue = parseFloat(newPrice);
    
    if (priceValue <= order.price) {
      setError('Der neue Preis muss höher sein als der aktuelle Preis.');
      return;
    }

    if (order.minimum_price_at_creation && priceValue < order.minimum_price_at_creation) {
      setError(`Der Preis sollte mindestens €${order.minimum_price_at_creation.toFixed(2)} betragen (Mindestlohn).`);
      return;
    }

    setLoading(true);

    try {
      await ordersAPI.updateOrderPrice(order.id, priceValue);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error updating price:', err);
      setError(err.response?.data?.message || 'Fehler beim Aktualisieren des Preises');
    } finally {
      setLoading(false);
    }
  };

  const priceIncrease = parseFloat(newPrice) - order.price;
  const percentageIncrease = ((priceIncrease / order.price) * 100).toFixed(1);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
            Preis erhöhen
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900 mb-2">
            <strong>💡 Tipp:</strong> Höhere Preise erhöhen die Wahrscheinlichkeit, 
            dass ein Auftragnehmer Ihren Auftrag schneller annimmt.
          </p>
          <p className="text-xs text-blue-700">
            Als Vermittlungsplattform können wir keine Auftragsübernahme garantieren.
          </p>
        </div>

        <div className="mb-4">
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">Aktueller Preis:</span>
              <span className="text-lg font-semibold text-gray-900">€{order.price.toFixed(2)}</span>
            </div>
            {order.minimum_price_at_creation && (
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Mindestpreis:</span>
                <span>€{order.minimum_price_at_creation.toFixed(2)}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Neuer Preis (€) *
              </label>
              <input
                type="number"
                step="0.01"
                min={order.price + 0.01}
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-lg font-semibold"
                required
              />
              {priceIncrease > 0 && (
                <p className="text-sm text-green-600 mt-1">
                  ↗ +€{priceIncrease.toFixed(2)} ({percentageIncrease}% Erhöhung)
                </p>
              )}
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={loading || priceIncrease <= 0}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Wird aktualisiert...' : 'Preis erhöhen'}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Der neue Preis wird sofort für alle Auftragnehmer sichtbar.
          </p>
        </div>
      </div>
    </div>
  );
}
