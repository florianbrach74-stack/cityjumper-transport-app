import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { ArrowLeft, Package, MapPin, Calendar, Truck, FileText } from 'lucide-react';

export default function ContractorOrdersView() {
  const { contractorId } = useParams();
  const navigate = useNavigate();
  const [contractor, setContractor] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderForCMR, setSelectedOrderForCMR] = useState(null);

  useEffect(() => {
    loadData();
  }, [contractorId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load contractor info
      const usersRes = await api.get('/admin/users');
      const contractorData = usersRes.data.users.find(u => u.id === parseInt(contractorId));
      setContractor(contractorData);

      // Load all orders and filter by contractor
      const ordersRes = await api.get('/admin/orders');
      const contractorOrders = ordersRes.data.orders.filter(
        o => o.contractor_id === parseInt(contractorId)
      );
      setOrders(contractorOrders);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Ausstehend', color: 'bg-yellow-100 text-yellow-800' },
      accepted: { label: 'Akzeptiert', color: 'bg-blue-100 text-blue-800' },
      picked_up: { label: 'Abgeholt', color: 'bg-indigo-100 text-indigo-800' },
      delivered: { label: 'Zugestellt', color: 'bg-green-100 text-green-800' },
      pending_approval: { label: 'Wartet auf Freigabe', color: 'bg-orange-100 text-orange-800' },
      completed: { label: 'Abgeschlossen', color: 'bg-gray-100 text-gray-800' },
      cancelled: { label: 'Storniert', color: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const viewCMR = async (orderId) => {
    try {
      const response = await api.get(`/cmr/order/${orderId}`);
      if (response.data.cmr) {
        // Use the production backend URL and CMR number (not ID!)
        const baseURL = 'https://cityjumper-api-production-01e4.up.railway.app';
        const cmrNumber = response.data.cmr.cmr_number;
        // Open CMR PDF in new tab
        window.open(`${baseURL}/api/cmr/${cmrNumber}/download`, '_blank');
      } else {
        alert('CMR noch nicht verfügbar für diesen Auftrag');
      }
    } catch (error) {
      console.error('Error viewing CMR:', error);
      if (error.response?.status === 404) {
        alert('CMR wurde noch nicht erstellt. Der Auftrag muss erst abgeholt werden.');
      } else {
        alert('Fehler beim Laden des CMR');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Lädt...</div>
        </div>
      </div>
    );
  }

  if (!contractor) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Auftragnehmer nicht gefunden</h2>
            <button
              onClick={() => navigate('/admin')}
              className="mt-4 text-primary-600 hover:text-primary-700"
            >
              Zurück zum Admin-Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Zurück zum Admin-Dashboard
          </button>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Aufträge von {contractor.company_name || `${contractor.first_name} ${contractor.last_name}`}
            </h1>
            <p className="text-gray-600">{contractor.email}</p>
            <div className="mt-4 flex items-center space-x-4">
              <div className="text-sm">
                <span className="text-gray-500">Gesamt Aufträge:</span>
                <span className="ml-2 font-semibold text-gray-900">{orders.length}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Aktiv:</span>
                <span className="ml-2 font-semibold text-blue-600">
                  {orders.filter(o => !['completed', 'cancelled', 'delivered'].includes(o.status)).length}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Abgeschlossen:</span>
                <span className="ml-2 font-semibold text-green-600">
                  {orders.filter(o => ['completed', 'delivered'].includes(o.status)).length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Aufträge</h3>
            <p className="mt-1 text-sm text-gray-500">
              Dieser Auftragnehmer hat noch keine Aufträge übernommen.
            </p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Auftrag</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kunde</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preis</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wartezeit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.customer_company || `${order.customer_first_name} ${order.customer_last_name}`}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                          {order.pickup_city} → {order.delivery_city}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                          {new Date(order.pickup_date).toLocaleDateString('de-DE')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        €{order.price}
                        {order.waiting_time_fee > 0 && order.waiting_time_approved && (
                          <span className="text-green-600 ml-1">+€{order.waiting_time_fee}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(order.pickup_waiting_minutes > 0 || order.delivery_waiting_minutes > 0) ? (
                          <div className="text-xs">
                            <div>{(order.pickup_waiting_minutes || 0) + (order.delivery_waiting_minutes || 0)} Min.</div>
                            {order.waiting_time_fee > 0 && (
                              <div className={order.waiting_time_approved ? 'text-green-600' : 'text-orange-600'}>
                                €{order.waiting_time_fee}
                                {order.status === 'pending_approval' && ' (pending)'}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {order.contractor_id && (
                          <button
                            onClick={() => viewCMR(order.id)}
                            className="text-purple-600 hover:text-purple-900 font-medium flex items-center"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            CMR
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
