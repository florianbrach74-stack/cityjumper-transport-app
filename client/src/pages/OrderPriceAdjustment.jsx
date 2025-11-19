import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DollarSign, MapPin, Calendar, Truck, AlertCircle, CheckCircle } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function OrderPriceAdjustment() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [newPrice, setNewPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/orders/${id}/price-adjustment`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Laden');
      }

      const data = await response.json();
      setOrder(data.order);
      setNewPrice(data.order.current_price.toString());
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const priceValue = parseFloat(newPrice);
    
    if (!priceValue || priceValue <= 0) {
      setError('Bitte geben Sie einen gültigen Preis ein');
      return;
    }
    
    if (priceValue === order.current_price) {
      setError('Der neue Preis muss sich vom aktuellen Preis unterscheiden');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/orders/${id}/price-adjustment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ newPrice: priceValue })
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Speichern');
      }

      setSuccess(true);
      
      // Redirect nach 2 Sekunden
      setTimeout(() => {
        navigate('/customer');
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Lade Auftragsdaten...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start">
              <AlertCircle className="h-6 w-6 text-red-600 mr-3 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Fehler</h3>
                <p className="text-red-800 mt-1">{error}</p>
                <button
                  onClick={() => navigate('/customer')}
                  className="mt-4 text-red-600 hover:text-red-700 font-medium"
                >
                  ← Zurück zum Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start">
              <CheckCircle className="h-6 w-6 text-green-600 mr-3 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900">Preis erfolgreich angepasst!</h3>
                <p className="text-green-800 mt-1">
                  Der Auftrag wird jetzt mit dem neuen Preis angeboten.
                </p>
                <p className="text-sm text-green-700 mt-2">
                  Sie werden automatisch weitergeleitet...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const priceIncrease = newPrice ? ((parseFloat(newPrice) - order.current_price) / order.current_price * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Preis anpassen</h1>
          <p className="mt-2 text-gray-600">
            Erhöhen Sie den Preis, um die Vermittlungswahrscheinlichkeit zu steigern
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold">Ihr Auftrag konnte noch nicht vermittelt werden</p>
              <p className="mt-1">
                Das Abholzeitfenster hat bereits begonnen. Eine Preiserhöhung kann die Chancen auf eine schnelle Vermittlung deutlich verbessern.
              </p>
            </div>
          </div>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Auftragsdetails</h2>
          
          <div className="space-y-4">
            {/* Route */}
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm">
                  <div className="font-medium text-gray-900">Abholung</div>
                  <div className="text-gray-600">
                    {order.pickup_city} ({order.pickup_postal_code})
                  </div>
                </div>
                <div className="text-sm mt-2">
                  <div className="font-medium text-gray-900">Zustellung</div>
                  <div className="text-gray-600">
                    {order.delivery_city} ({order.delivery_postal_code})
                  </div>
                </div>
              </div>
            </div>

            {/* Date & Time */}
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div className="text-sm">
                <div className="font-medium text-gray-900">Abholdatum</div>
                <div className="text-gray-600">
                  {new Date(order.pickup_date).toLocaleDateString('de-DE')} 
                  {' '}
                  {order.pickup_time_from} - {order.pickup_time_to || 'flexibel'}
                </div>
              </div>
            </div>

            {/* Vehicle */}
            <div className="flex items-center space-x-3">
              <Truck className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div className="text-sm">
                <div className="font-medium text-gray-900">Fahrzeug</div>
                <div className="text-gray-600">{order.vehicle_type}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Price Adjustment Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Neuen Preis festlegen</h2>
          
          {/* Current Price */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Aktueller Preis:</span>
              <span className="text-2xl font-bold text-gray-900">
                €{order.current_price.toFixed(2)}
              </span>
            </div>
          </div>

          {/* New Price Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Neuer Preis *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="number"
                step="0.01"
                min={order.current_price}
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg"
                placeholder="0.00"
                required
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500">EUR</span>
              </div>
            </div>
            
            {newPrice && parseFloat(newPrice) > order.current_price && (
              <div className="mt-2 text-sm">
                <span className="text-green-600 font-medium">
                  +€{(parseFloat(newPrice) - order.current_price).toFixed(2)}
                </span>
                <span className="text-gray-600 ml-2">
                  ({priceIncrease > 0 ? '+' : ''}{priceIncrease}%)
                </span>
              </div>
            )}
          </div>

          {/* Recommendation */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>💡 Empfehlung:</strong> Eine Erhöhung um 10-20% erhöht die Vermittlungschancen deutlich.
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setNewPrice((order.current_price * 1.1).toFixed(2))}
                className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                +10% (€{(order.current_price * 1.1).toFixed(2)})
              </button>
              <button
                type="button"
                onClick={() => setNewPrice((order.current_price * 1.15).toFixed(2))}
                className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                +15% (€{(order.current_price * 1.15).toFixed(2)})
              </button>
              <button
                type="button"
                onClick={() => setNewPrice((order.current_price * 1.2).toFixed(2))}
                className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                +20% (€{(order.current_price * 1.2).toFixed(2)})
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/customer')}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={submitting || !newPrice || parseFloat(newPrice) <= order.current_price}
              className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            >
              {submitting ? 'Speichere...' : 'Preis aktualisieren'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
