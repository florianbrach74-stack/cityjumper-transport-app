import React, { useState, useEffect } from 'react';
import { ordersAPI } from '../services/api';
import Navbar from '../components/Navbar';
import CMRViewer from '../components/CMRViewer';
import EmployeeManagement from '../components/EmployeeManagement';
import NotificationSettings from '../components/NotificationSettings';
import { Package, Clock, CheckCircle, Truck, Calendar, MapPin, AlertCircle, FileText, Bell } from 'lucide-react';

const ContractorDashboard = () => {
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available');
  const [acceptingOrder, setAcceptingOrder] = useState(null);
  const [selectedOrderForCMR, setSelectedOrderForCMR] = useState(null);

  const fetchOrders = async () => {
    try {
      const [availableRes, myOrdersRes] = await Promise.all([
        ordersAPI.getAvailableOrders(),
        ordersAPI.getOrders(),
      ]);
      setAvailableOrders(availableRes.data.orders);
      setMyOrders(myOrdersRes.data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleAcceptOrder = async (orderId) => {
    if (!confirm('Möchten Sie diesen Auftrag wirklich annehmen?')) {
      return;
    }

    setAcceptingOrder(orderId);
    try {
      await ordersAPI.acceptOrder(orderId);
      await fetchOrders();
      setActiveTab('my-orders');
    } catch (error) {
      console.error('Error accepting order:', error);
      alert('Fehler beim Annehmen des Auftrags');
    } finally {
      setAcceptingOrder(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Ausstehend', icon: Clock },
      accepted: { color: 'bg-blue-100 text-blue-800', text: 'Angenommen', icon: CheckCircle },
      in_transit: { color: 'bg-purple-100 text-purple-800', text: 'Unterwegs', icon: Truck },
      completed: { color: 'bg-green-100 text-green-800', text: 'Abgeschlossen', icon: CheckCircle },
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="h-3 w-3" />
        <span>{badge.text}</span>
      </span>
    );
  };

  const OrderCard = ({ order, showAcceptButton = false }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Auftrag #{order.id}</h3>
          <p className="text-sm text-gray-500">
            Erstellt am {new Date(order.created_at).toLocaleDateString('de-DE')}
          </p>
        </div>
        {!showAcceptButton && getStatusBadge(order.status)}
      </div>

      <div className="space-y-3">
        {/* Route */}
        <div className="flex items-start space-x-3">
          <MapPin className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-sm">
              <div className="font-medium text-gray-900">Abholung</div>
              {showAcceptButton ? (
                // Nur PLZ für nicht-angenommene Aufträge
                <div className="text-gray-600">
                  <span className="font-semibold text-lg">PLZ {order.pickup_postal_code}</span>
                  <span className="text-gray-500 ml-2">({order.pickup_city})</span>
                </div>
              ) : (
                // Vollständige Adresse für angenommene Aufträge
                <>
                  <div className="text-gray-600">
                    {order.pickup_address}, {order.pickup_postal_code} {order.pickup_city}
                  </div>
                  {order.pickup_contact_name && (
                    <div className="text-gray-500 text-xs mt-1">
                      Kontakt: {order.pickup_contact_name}
                      {order.pickup_contact_phone && ` - ${order.pickup_contact_phone}`}
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="text-sm mt-2">
              <div className="font-medium text-gray-900">Zustellung</div>
              {showAcceptButton ? (
                // Nur PLZ für nicht-angenommene Aufträge
                <div className="text-gray-600">
                  <span className="font-semibold text-lg">PLZ {order.delivery_postal_code}</span>
                  <span className="text-gray-500 ml-2">({order.delivery_city})</span>
                </div>
              ) : (
                // Vollständige Adresse für angenommene Aufträge
                <>
                  <div className="text-gray-600">
                    {order.delivery_address}, {order.delivery_postal_code} {order.delivery_city}
                  </div>
                  {order.delivery_contact_name && (
                    <div className="text-gray-500 text-xs mt-1">
                      Kontakt: {order.delivery_contact_name}
                      {order.delivery_contact_phone && ` - ${order.delivery_contact_phone}`}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Date and Vehicle */}
        <div className="grid grid-cols-2 gap-4 pt-3 border-t">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <div className="text-sm">
              <div className="text-gray-500">Abholdatum</div>
              <div className="font-medium text-gray-900">
                {new Date(order.pickup_date).toLocaleDateString('de-DE')}
                {order.pickup_time && ` ${order.pickup_time}`}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Truck className="h-4 w-4 text-gray-400" />
            <div className="text-sm">
              <div className="text-gray-500">Fahrzeug</div>
              <div className="font-medium text-gray-900">{order.vehicle_type}</div>
            </div>
          </div>
        </div>

        {/* Additional Details - Only for accepted orders */}
        {!showAcceptButton && (order.weight || order.pallets || order.description) && (
          <div className="pt-3 border-t">
            <div className="text-sm space-y-1">
              {order.weight && (
                <div className="text-gray-600">Gewicht: {order.weight} kg</div>
              )}
              {order.pallets && (
                <div className="text-gray-600">Paletten: {order.pallets}</div>
              )}
              {order.description && (
                <div className="text-gray-600">
                  <span className="font-medium">Beschreibung:</span> {order.description}
                </div>
              )}
              {order.special_requirements && (
                <div className="text-gray-600">
                  <span className="font-medium">Besondere Anforderungen:</span>{' '}
                  {order.special_requirements}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Price and Customer - Hide customer name for pending orders */}
        <div className="flex justify-between items-center pt-3 border-t">
          {!showAcceptButton && (
            <div className="text-sm text-gray-600">
              Kunde: {order.customer_company || `${order.customer_first_name} ${order.customer_last_name}`}
            </div>
          )}
          {showAcceptButton && (
            <div className="text-sm text-gray-500 italic">
              Kundendetails nach Annahme sichtbar
            </div>
          )}
          {order.price && (
            <div className="text-lg font-bold text-primary-600">€{order.price}</div>
          )}
        </div>

        {/* CMR Button for accepted orders */}
        {!showAcceptButton && (
          <button
            onClick={() => setSelectedOrderForCMR(order.id)}
            className="w-full mt-4 flex justify-center items-center px-4 py-2 border border-primary-600 rounded-lg text-sm font-medium text-primary-600 hover:bg-primary-50"
          >
            <FileText className="h-5 w-5 mr-2" />
            CMR anzeigen
          </button>
        )}

        {/* Accept Button */}
        {showAcceptButton && (
          <button
            onClick={() => handleAcceptOrder(order.id)}
            disabled={acceptingOrder === order.id}
            className="w-full mt-4 flex justify-center items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {acceptingOrder === order.id ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Wird angenommen...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Auftrag annehmen
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Aufträge</h1>
          <p className="mt-2 text-gray-600">Verfügbare Aufträge annehmen und verwalten</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('available')}
              className={`${
                activeTab === 'available'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <Package className="h-5 w-5" />
              <span>Verfügbare Aufträge</span>
              <span className="bg-primary-100 text-primary-600 py-0.5 px-2 rounded-full text-xs font-semibold">
                {availableOrders.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('my-orders')}
              className={`${
                activeTab === 'my-orders'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <CheckCircle className="h-5 w-5" />
              <span>Meine Aufträge</span>
              <span className="bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs font-semibold">
                {myOrders.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('employees')}
              className={`${
                activeTab === 'employees'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <Truck className="h-5 w-5" />
              <span>Mitarbeiter</span>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`${
                activeTab === 'notifications'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <Bell className="h-5 w-5" />
              <span>Benachrichtigungen</span>
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'available' ? (
          <div>
            {availableOrders.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Keine verfügbaren Aufträge</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Momentan sind keine neuen Aufträge verfügbar. Schauen Sie später wieder vorbei.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {availableOrders.map((order) => (
                  <OrderCard key={order.id} order={order} showAcceptButton={true} />
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'my-orders' ? (
          <div>
            {myOrders.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Keine angenommenen Aufträge</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Sie haben noch keine Aufträge angenommen. Wechseln Sie zu "Verfügbare Aufträge", um Aufträge anzunehmen.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {myOrders.map((order) => (
                  <OrderCard key={order.id} order={order} showAcceptButton={false} />
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'employees' ? (
          <EmployeeManagement />
        ) : (
          <NotificationSettings />
        )}
      </div>

      {/* CMR Viewer Modal */}
      {selectedOrderForCMR && (
        <CMRViewer
          orderId={selectedOrderForCMR}
          onClose={() => setSelectedOrderForCMR(null)}
        />
      )}
    </div>
  );
};

export default ContractorDashboard;
