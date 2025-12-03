import { useState, useEffect } from 'react';
import { X, AlertTriangle, DollarSign, User, FileText } from 'lucide-react';
import axios from 'axios';

export default function CancellationModal({ order, onClose, onSuccess, userRole = 'customer' }) {
  // Security: Only admins can cancel on behalf of contractor
  const [cancelledBy, setCancelledBy] = useState('customer');
  const [reason, setReason] = useState('');
  const [priceIncrease, setPriceIncrease] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [contractorPreview, setContractorPreview] = useState(null);
  
  // Check if user is admin
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    fetchCancellationPreview();
  }, [cancelledBy]);

  const fetchCancellationPreview = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/cancellation/${order.id}/cancellation-preview`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Cancellation preview response:', response.data);
      if (response.data && response.data.preview) {
        setPreview(response.data.preview);
      } else {
        console.error('Invalid preview data:', response.data);
        setPreview(null);
      }
    } catch (error) {
      console.error('Error fetching preview:', error);
      setPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const endpoint = cancelledBy === 'customer' 
        ? `/api/cancellation/${order.id}/cancel-by-customer`
        : `/api/cancellation/${order.id}/cancel-by-contractor`;

      const data = cancelledBy === 'customer'
        ? { reason }
        : { 
            reason, 
            priceIncrease: parseFloat(priceIncrease) || 0,
            notes 
          };

      await axios.post(
        `${import.meta.env.VITE_API_URL}${endpoint}`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Stornierung erfolgreich durchgeführt');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert(error.response?.data?.error || 'Fehler bei der Stornierung');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => `€${parseFloat(price || 0).toFixed(2)}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-red-50 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <AlertTriangle className="h-6 w-6 mr-2 text-red-600" />
            Auftrag stornieren #{order.id}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Order Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Auftragsdetails</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Route:</span>
                <p className="font-medium">{order.pickup_city} → {order.delivery_city}</p>
              </div>
              <div>
                <span className="text-gray-600">Preis:</span>
                <p className="font-medium">{formatPrice(order.price)}</p>
              </div>
              <div>
                <span className="text-gray-600">Abholung:</span>
                <p className="font-medium">{new Date(order.pickup_date).toLocaleDateString('de-DE')}</p>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <p className="font-medium">{order.status}</p>
              </div>
            </div>
          </div>

          {/* Cancelled By Selection - Only show for admins */}
          {isAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Storniert durch
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setCancelledBy('customer')}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    cancelledBy === 'customer'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <User className="h-5 w-5 mb-2 text-primary-600" />
                  <div className="font-semibold">Kunde</div>
                  <div className="text-xs text-gray-600">Gebühren nach AGB</div>
                </button>
                <button
                  type="button"
                  onClick={() => setCancelledBy('contractor')}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    cancelledBy === 'contractor'
                      ? 'border-red-600 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <AlertTriangle className="h-5 w-5 mb-2 text-red-600" />
                  <div className="font-semibold">Auftragnehmer</div>
                  <div className="text-xs text-gray-600">Strafe + Kompensation</div>
                </button>
              </div>
            </div>
          )}
          
          {/* Info for non-admin users */}
          {!isAdmin && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>ℹ️ Kundenstornierung</strong><br />
                Sie stornieren diesen Auftrag als Kunde. Es gelten die Stornogebühren gemäß AGB.
              </p>
            </div>
          )}

          {/* Customer Cancellation */}
          {cancelledBy === 'customer' && preview && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-3">Automatische Gebührenberechnung (AGB)</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-800">Stunden bis Abholung:</span>
                  <span className="font-semibold">{preview.hoursUntilPickup ? preview.hoursUntilPickup.toFixed(1) : '0.0'}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-800">Fahrer-Status:</span>
                  <span className="font-semibold">
                    {preview.driverStatus === 'not_started' && 'Noch nicht gestartet'}
                    {preview.driverStatus === 'en_route' && '🚗 Unterwegs'}
                    {preview.driverStatus === 'past_pickup' && 'Nach Abholzeit'}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-blue-200 pt-2 mt-2">
                  <span className="text-blue-900">Stornogebühr ({preview.feePercentage}%):</span>
                  <span className={preview.feePercentage === 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatPrice(preview.cancellationFee)}
                  </span>
                </div>
                {preview.canCancelFree && (
                  <p className="text-green-700 text-xs italic">✓ Kostenlose Stornierung möglich</p>
                )}
              </div>
            </div>
          )}

          {/* Contractor Cancellation */}
          {cancelledBy === 'contractor' && preview && (
            <div className="space-y-4">
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                <h4 className="font-semibold text-red-900 mb-3">Auftragnehmer-Stornierung (AGB)</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-red-800">Stunden bis Abholung:</span>
                    <span className="font-semibold">{preview.hoursUntilPickup.toFixed(1)}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-800">Stornogebühr (AGB):</span>
                    <span className="font-semibold">{preview.feePercentage}%</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-red-200 pt-2 mt-2">
                    <span className="text-red-900">Strafe Auftragnehmer:</span>
                    <span className="text-red-600">{formatPrice(preview.cancellationFee)}</span>
                  </div>
                  <p className="text-red-700 text-xs italic mt-2">
                    ⚠️ Auftragnehmer zahlt {preview.feePercentage}% Stornogebühr gemäß AGB
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preiserhöhung für neuen Auftragnehmer
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    value={priceIncrease}
                    onChange={(e) => setPriceIncrease(e.target.value)}
                    placeholder="0.00"
                    max={preview.cancellationFee}
                    className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Max: {formatPrice(preview.cancellationFee)} (= Stornogebühr)
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  💡 Erhöhung = Anreiz für schnelle Neubesetzung
                </p>
              </div>

              {priceIncrease && parseFloat(priceIncrease) > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg text-sm">
                  <p className="font-semibold text-blue-900">Neuer Auftragspreis:</p>
                  <p className="text-blue-800">
                    {formatPrice(order.price)} + {formatPrice(priceIncrease)} = {formatPrice(parseFloat(order.price) + parseFloat(priceIncrease))}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin-Notizen
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="2"
                  placeholder="Interne Notizen zur Stornierung..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grund für Stornierung *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows="3"
              placeholder="Bitte geben Sie den Grund für die Stornierung an..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50 flex items-center"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              {loading ? 'Wird storniert...' : 'Auftrag stornieren'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
