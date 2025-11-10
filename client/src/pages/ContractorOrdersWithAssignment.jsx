import { useState, useEffect } from 'react';
import { Package, MapPin, Calendar, DollarSign, User, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import AssignEmployeeDropdown from '../components/AssignEmployeeDropdown';

const ContractorOrdersWithAssignment = () => {
  const [orders, setOrders] = useState([]);
  const [assignmentMode, setAssignmentMode] = useState('all_access');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, assigned, unassigned

  useEffect(() => {
    loadOrders();
    loadSettings();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await fetch('/api/employee-assignment/orders', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/employee-assignment/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setAssignmentMode(data.assignmentMode);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleAssigned = (updatedOrder) => {
    setOrders(orders.map(order => 
      order.id === updatedOrder.id ? updatedOrder : order
    ));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Ausstehend' },
      accepted: { color: 'bg-blue-100 text-blue-800', label: 'Angenommen' },
      in_transit: { color: 'bg-purple-100 text-purple-800', label: 'Unterwegs' },
      completed: { color: 'bg-green-100 text-green-800', label: 'Abgeschlossen' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Storniert' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'assigned') return order.assigned_employee_id;
    if (filter === 'unassigned') return !order.assigned_employee_id;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Meine Aufträge</h1>
            <p className="text-gray-600 mt-1">
              {assignmentMode === 'manual_assignment' 
                ? 'Weisen Sie Aufträge Ihren Mitarbeitern zu'
                : 'Alle Mitarbeiter haben Zugriff auf diese Aufträge'
              }
            </p>
          </div>
          <Link
            to="/employee-settings"
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Settings className="h-5 w-5 text-gray-600" />
            <span className="text-gray-700">Einstellungen</span>
          </Link>
        </div>

        {/* Assignment Mode Info */}
        {assignmentMode === 'manual_assignment' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
            <User className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-blue-800 font-medium">
                Manuelle Zuweisung aktiv
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Mitarbeiter sehen nur Aufträge, die ihnen zugewiesen wurden. 
                Nicht zugewiesene Aufträge sind für Mitarbeiter nicht sichtbar.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      {assignmentMode === 'manual_assignment' && (
        <div className="mb-6 flex items-center space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Alle ({orders.length})
          </button>
          <button
            onClick={() => setFilter('assigned')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'assigned'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Zugewiesen ({orders.filter(o => o.assigned_employee_id).length})
          </button>
          <button
            onClick={() => setFilter('unassigned')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'unassigned'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Nicht zugewiesen ({orders.filter(o => !o.assigned_employee_id).length})
          </button>
        </div>
      )}

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Keine Aufträge gefunden
          </h3>
          <p className="text-gray-600">
            {filter === 'assigned' && 'Es wurden noch keine Aufträge zugewiesen.'}
            {filter === 'unassigned' && 'Alle Aufträge sind bereits zugewiesen.'}
            {filter === 'all' && 'Sie haben noch keine Aufträge angenommen.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Auftrag #{order.id}
                    </h3>
                    {getStatusBadge(order.status)}
                  </div>
                  
                  {/* Route */}
                  <div className="flex items-center space-x-2 text-gray-600 mb-3">
                    <MapPin className="h-5 w-5 text-primary-600" />
                    <span className="font-medium">{order.pickup_city}</span>
                    <span>→</span>
                    <span className="font-medium">{order.delivery_city}</span>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Datum</p>
                      <p className="font-medium text-gray-900 flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                        {new Date(order.pickup_date).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Fahrzeug</p>
                      <p className="font-medium text-gray-900">{order.vehicle_type}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Preis</p>
                      <p className="font-medium text-gray-900 flex items-center">
                        <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                        {order.price?.toFixed(2)} €
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Distanz</p>
                      <p className="font-medium text-gray-900">
                        {order.distance_km ? `${order.distance_km} km` : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Employee Assignment */}
              {assignmentMode === 'manual_assignment' && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Zugewiesen an:
                    </span>
                    <AssignEmployeeDropdown
                      orderId={order.id}
                      currentEmployeeId={order.assigned_employee_id}
                      currentEmployeeName={
                        order.employee_first_name
                          ? `${order.employee_first_name} ${order.employee_last_name}`
                          : null
                      }
                      onAssigned={handleAssigned}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContractorOrdersWithAssignment;
