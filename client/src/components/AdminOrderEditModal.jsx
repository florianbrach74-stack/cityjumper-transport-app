import { useState, useEffect } from 'react';
import api from '../services/api';

export default function AdminOrderEditModal({ order, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    price: '',
    pickup_waiting_minutes: '',
    delivery_waiting_minutes: '',
    pickup_waiting_notes: '',
    delivery_waiting_notes: '',
    clarification_minutes: '',
    clarification_notes: '',
    waiting_time_fee: ''
  });
  
  const [additionalStops, setAdditionalStops] = useState([]);
  const [showAddStopForm, setShowAddStopForm] = useState(false);
  const [newStop, setNewStop] = useState({
    address: '',
    city: '',
    postal_code: '',
    country: 'Deutschland',
    contact_name: '',
    contact_phone: '',
    notes: '',
    stop_type: 'delivery'
  });
  const [loading, setLoading] = useState(false);
  const [editHistory, setEditHistory] = useState([]);

  useEffect(() => {
    if (order) {
      setFormData({
        price: order.price || '',
        pickup_waiting_minutes: order.pickup_waiting_minutes || '',
        delivery_waiting_minutes: order.delivery_waiting_minutes || '',
        pickup_waiting_notes: order.pickup_waiting_notes || '',
        delivery_waiting_notes: order.delivery_waiting_notes || '',
        clarification_minutes: order.clarification_minutes || '',
        clarification_notes: order.clarification_notes || '',
        waiting_time_fee: order.waiting_time_fee || ''
      });
      setAdditionalStops(order.additional_stops || []);
      setEditHistory(order.edit_history || []);
    }
  }, [order]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNewStopChange = (e) => {
    const { name, value } = e.target;
    setNewStop(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert string values to numbers where needed
      const updateData = {
        price: formData.price ? parseFloat(formData.price) : undefined,
        pickup_waiting_minutes: formData.pickup_waiting_minutes ? parseInt(formData.pickup_waiting_minutes) : undefined,
        delivery_waiting_minutes: formData.delivery_waiting_minutes ? parseInt(formData.delivery_waiting_minutes) : undefined,
        pickup_waiting_notes: formData.pickup_waiting_notes || undefined,
        delivery_waiting_notes: formData.delivery_waiting_notes || undefined,
        clarification_minutes: formData.clarification_minutes ? parseInt(formData.clarification_minutes) : undefined,
        clarification_notes: formData.clarification_notes || undefined,
        waiting_time_fee: formData.waiting_time_fee ? parseFloat(formData.waiting_time_fee) : undefined
      };

      await api.patch(`/admin/orders/${order.id}/completed-order-edit`, updateData);
      alert('Auftrag erfolgreich aktualisiert!');
      onSuccess();
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Fehler beim Aktualisieren: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAddStop = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post(`/admin/orders/${order.id}/additional-stop`, newStop);
      alert('Zusätzliche Adresse erfolgreich hinzugefügt!');
      
      // Reset form
      setNewStop({
        address: '',
        city: '',
        postal_code: '',
        country: 'Deutschland',
        contact_name: '',
        contact_phone: '',
        notes: '',
        stop_type: 'delivery'
      });
      setShowAddStopForm(false);
      onSuccess();
    } catch (error) {
      console.error('Error adding stop:', error);
      alert('Fehler beim Hinzufügen: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStop = async (stopId) => {
    if (!confirm('Möchten Sie diese zusätzliche Adresse wirklich entfernen?')) return;

    setLoading(true);
    try {
      await api.delete(`/admin/orders/${order.id}/additional-stop/${stopId}`);
      alert('Zusätzliche Adresse entfernt!');
      onSuccess();
    } catch (error) {
      console.error('Error removing stop:', error);
      alert('Fehler beim Entfernen: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              ✏️ Auftrag #{order.id} bearbeiten
            </h3>
            <p className="text-sm text-gray-600">
              {order.pickup_city} → {order.delivery_city} | Status: {order.status}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        <div className="p-6">
          {/* Main Edit Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3">💰 Preis & Vergütung</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preis (€)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wartezeit-Vergütung (€)
                  </label>
                  <input
                    type="number"
                    name="waiting_time_fee"
                    value={formData.waiting_time_fee}
                    onChange={handleChange}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-900 mb-3">⏱️ Wartezeiten</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wartezeit Abholung (Min.)
                  </label>
                  <input
                    type="number"
                    name="pickup_waiting_minutes"
                    value={formData.pickup_waiting_minutes}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <textarea
                    name="pickup_waiting_notes"
                    value={formData.pickup_waiting_notes}
                    onChange={handleChange}
                    placeholder="Begründung..."
                    rows="2"
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wartezeit Zustellung (Min.)
                  </label>
                  <input
                    type="number"
                    name="delivery_waiting_minutes"
                    value={formData.delivery_waiting_minutes}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <textarea
                    name="delivery_waiting_notes"
                    value={formData.delivery_waiting_notes}
                    onChange={handleChange}
                    placeholder="Begründung..."
                    rows="2"
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-3">🔍 Klärungszeit</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Klärungszeit (Min.)
                  </label>
                  <input
                    type="number"
                    name="clarification_minutes"
                    value={formData.clarification_minutes}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notizen zur Klärung
                  </label>
                  <textarea
                    name="clarification_notes"
                    value={formData.clarification_notes}
                    onChange={handleChange}
                    placeholder="z.B. Adresskorrektur, Rückfragen..."
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Speichern...' : 'Änderungen speichern'}
              </button>
            </div>
          </form>

          {/* Additional Stops Section */}
          <div className="mt-8 border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-gray-900">📍 Zusätzliche Adressen</h4>
              <button
                onClick={() => setShowAddStopForm(!showAddStopForm)}
                className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
              >
                {showAddStopForm ? '✕ Abbrechen' : '+ Adresse hinzufügen'}
              </button>
            </div>

            {showAddStopForm && (
              <form onSubmit={handleAddStop} className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Typ
                    </label>
                    <select
                      name="stop_type"
                      value={newStop.stop_type}
                      onChange={handleNewStopChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="pickup">Abholung</option>
                      <option value="delivery">Zustellung</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adresse *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={newStop.address}
                      onChange={handleNewStopChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stadt *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={newStop.city}
                      onChange={handleNewStopChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PLZ
                    </label>
                    <input
                      type="text"
                      name="postal_code"
                      value={newStop.postal_code}
                      onChange={handleNewStopChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kontaktperson
                    </label>
                    <input
                      type="text"
                      name="contact_name"
                      value={newStop.contact_name}
                      onChange={handleNewStopChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      name="contact_phone"
                      value={newStop.contact_phone}
                      onChange={handleNewStopChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notizen
                  </label>
                  <textarea
                    name="notes"
                    value={newStop.notes}
                    onChange={handleNewStopChange}
                    rows="2"
                    placeholder="z.B. Grund für zusätzliche Adresse..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Hinzufügen...' : 'Adresse hinzufügen'}
                </button>
              </form>
            )}

            {additionalStops.length > 0 ? (
              <div className="space-y-2">
                {additionalStops.map((stop) => (
                  <div key={stop.id} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            stop.stop_type === 'pickup' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {stop.stop_type === 'pickup' ? '📦 Abholung' : '🚚 Zustellung'}
                          </span>
                          <span className="text-xs text-gray-500">
                            Hinzugefügt: {new Date(stop.added_at).toLocaleString('de-DE')}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900">{stop.address}</p>
                        <p className="text-sm text-gray-600">{stop.postal_code} {stop.city}</p>
                        {stop.contact_name && (
                          <p className="text-sm text-gray-600">Kontakt: {stop.contact_name} {stop.contact_phone}</p>
                        )}
                        {stop.notes && (
                          <p className="text-sm text-gray-500 mt-1 italic">{stop.notes}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveStop(stop.id)}
                        disabled={loading}
                        className="ml-3 text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Entfernen
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Keine zusätzlichen Adressen</p>
            )}
          </div>

          {/* Edit History */}
          {editHistory.length > 0 && (
            <div className="mt-8 border-t pt-6">
              <h4 className="font-semibold text-gray-900 mb-4">📝 Bearbeitungsverlauf</h4>
              <div className="space-y-2">
                {editHistory.slice().reverse().map((entry, index) => (
                  <div key={index} className="bg-gray-50 border rounded-lg p-3 text-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-gray-900">
                        Admin #{entry.admin_id}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(entry.timestamp).toLocaleString('de-DE')}
                      </span>
                    </div>
                    <div className="space-y-1 text-gray-700">
                      {Object.entries(entry.changes).map(([key, value]) => (
                        <div key={key} className="text-xs">
                          <span className="font-medium">{key}:</span>{' '}
                          {typeof value === 'object' && value.old !== undefined ? (
                            <span>
                              <span className="text-red-600">{value.old}</span> → <span className="text-green-600">{value.new}</span>
                            </span>
                          ) : (
                            <span>{JSON.stringify(value)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
