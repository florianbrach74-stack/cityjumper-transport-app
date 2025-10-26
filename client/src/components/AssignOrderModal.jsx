import { useState, useEffect } from 'react';
import api from '../services/api';
import { X, User, AlertCircle } from 'lucide-react';

export default function AssignOrderModal({ order, onClose, onSuccess }) {
  const [contractors, setContractors] = useState([]);
  const [selectedContractor, setSelectedContractor] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadContractors();
  }, []);

  const loadContractors = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users');
      const contractorsList = response.data.users.filter(u => u.role === 'contractor');
      setContractors(contractorsList);
    } catch (error) {
      console.error('Error loading contractors:', error);
      setError('Fehler beim Laden der Auftragnehmer');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedContractor) {
      setError('Bitte wählen Sie einen Auftragnehmer aus');
      return;
    }

    try {
      setAssigning(true);
      setError('');

      await api.post(`/admin/orders/${order.id}/assign`, {
        contractor_id: parseInt(selectedContractor)
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error assigning order:', error);
      setError(error.response?.data?.error || 'Fehler beim Zuweisen des Auftrags');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
        {/* Header */}
        <div className="border-b px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Auftrag zuweisen</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2 mb-4">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Order Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Auftragsdetails:</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Auftrag #:</span>
                <span className="ml-2 font-medium">{order.id}</span>
              </div>
              <div>
                <span className="text-gray-600">Kunde:</span>
                <span className="ml-2 font-medium">
                  {order.customer_first_name} {order.customer_last_name}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Route:</span>
                <span className="ml-2 font-medium">
                  {order.pickup_postal_code} {order.pickup_city} → {order.delivery_postal_code} {order.delivery_city}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Datum:</span>
                <span className="ml-2 font-medium">
                  {new Date(order.pickup_date).toLocaleDateString('de-DE')}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Fahrzeug:</span>
                <span className="ml-2 font-medium">{order.vehicle_type}</span>
              </div>
            </div>
          </div>

          {/* Contractor Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Auftragnehmer auswählen *
            </label>
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : (
              <select
                value={selectedContractor}
                onChange={(e) => setSelectedContractor(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">-- Bitte wählen --</option>
                {contractors.map((contractor) => (
                  <option key={contractor.id} value={contractor.id}>
                    {contractor.first_name} {contractor.last_name}
                    {contractor.company_name ? ` (${contractor.company_name})` : ''}
                    {contractor.notification_postal_codes && contractor.notification_postal_codes.length > 0 
                      ? ` - PLZ: ${contractor.notification_postal_codes.join(', ')}`
                      : ''}
                  </option>
                ))}
              </select>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Nach der Zuweisung erhält der Auftragnehmer eine E-Mail mit allen Auftragsdetails.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Abbrechen
          </button>
          <button
            onClick={handleAssign}
            disabled={assigning || !selectedContractor}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {assigning ? 'Zuweisen...' : 'Auftrag zuweisen'}
          </button>
        </div>
      </div>
    </div>
  );
}
