import React, { useState, useEffect } from 'react';
import { ordersAPI } from '../services/api';
import Navbar from '../components/Navbar';
import CreateOrderModal from '../components/CreateOrderModal';
import UpdatePriceModal from '../components/UpdatePriceModal';
import CMRViewer from '../components/CMRViewer';
import ReportsSummary from '../components/ReportsSummary';
import RoleSwitcher from '../components/RoleSwitcher';
import { formatPrice } from '../utils/formatPrice';
import { Plus, Package, Clock, CheckCircle, Truck, Calendar, MapPin, FileText, TrendingUp, BarChart3, XCircle } from 'lucide-react';
import CancellationModal from '../components/CancellationModal';

const CustomerDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrderForCMR, setSelectedOrderForCMR] = useState(null);
  const [selectedOrderForPriceUpdate, setSelectedOrderForPriceUpdate] = useState(null);
  const [selectedOrderForCancellation, setSelectedOrderForCancellation] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    completed: 0,
  });

  const fetchOrders = async () => {
    try {
      const response = await ordersAPI.getOrders();
      const ordersData = response.data.orders;
      setOrders(ordersData);

      // Calculate stats (exclude cancelled orders)
      const activeOrders = ordersData.filter((o) => o.status !== 'cancelled');
      setStats({
        total: activeOrders.length,
        pending: activeOrders.filter((o) => o.status === 'pending').length,
        accepted: activeOrders.filter((o) => o.status === 'accepted' || o.status === 'in_transit').length,
        completed: activeOrders.filter((o) => o.status === 'completed' || o.status === 'pending_approval').length,
      });
    } catch (error) {
      console.error('❌ Error fetching orders:', error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    
    // Check for pending order from landing page
    const pendingOrder = localStorage.getItem('pendingOrder');
    if (pendingOrder) {
      // Show modal with pre-filled data
      setShowCreateModal(true);
      // Clear the pending order after opening modal
      localStorage.removeItem('pendingOrder');
    }
  }, []);

  const handleOrderCreated = () => {
    setShowCreateModal(false);
    fetchOrders();
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Ausstehend', icon: Clock },
      accepted: { color: 'bg-blue-100 text-blue-800', text: 'Angenommen', icon: CheckCircle },
      in_transit: { color: 'bg-purple-100 text-purple-800', text: 'Unterwegs', icon: Truck },
      completed: { color: 'bg-green-100 text-green-800', text: 'Abgeschlossen', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', text: 'Storniert', icon: Clock },
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
          <h1 className="text-3xl font-bold text-gray-900">Meine Aufträge</h1>
          <p className="mt-2 text-gray-600">Verwalten Sie Ihre Transportaufträge</p>
        </div>

        {/* Role Switcher */}
        <div className="mb-6">
          <RoleSwitcher />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Gesamt</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Package className="h-10 w-10 text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ausstehend</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-10 w-10 text-yellow-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aktiv</p>
                <p className="text-2xl font-bold text-blue-600">{stats.accepted}</p>
              </div>
              <Truck className="h-10 w-10 text-blue-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Abgeschlossen</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-400" />
            </div>
          </div>
        </div>

        {/* Create Order Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Plus className="h-5 w-5 mr-2" />
            Neuen Auftrag erstellen
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('active')}
              className={`${
                activeTab === 'active'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <Truck className="h-5 w-5" />
              <span>Aktive Aufträge ({orders.filter(o => o.status !== 'completed' && o.status !== 'pending_approval' && o.status !== 'cancelled').length})</span>
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`${
                activeTab === 'completed'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <CheckCircle className="h-5 w-5" />
              <span>Abgeschlossene Aufträge ({orders.filter(o => 
                o.status === 'completed' || 
                o.status === 'pending_approval' ||
                o.cancellation_status === 'cancelled_by_customer'
              ).length})</span>
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`${
                activeTab === 'reports'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <BarChart3 className="h-5 w-5" />
              <span>Abrechnungen</span>
            </button>
          </nav>
        </div>

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <ReportsSummary userRole="customer" />
        )}

        {/* Orders List */}
        {activeTab !== 'reports' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {orders.filter(o => activeTab === 'active' ? (o.status !== 'completed' && o.status !== 'pending_approval' && o.status !== 'cancelled') : (o.status === 'completed' || o.status === 'pending_approval' || o.cancellation_status === 'cancelled_by_customer')).length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Aufträge</h3>
              <p className="mt-1 text-sm text-gray-500">
                Erstellen Sie Ihren ersten Transportauftrag
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Auftrag erstellen
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Auftrag
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Route
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Datum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fahrzeug
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Auftragnehmer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Preis
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CMR
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.filter(o => activeTab === 'active' ? (o.status !== 'completed' && o.status !== 'pending_approval' && o.status !== 'cancelled') : (o.status === 'completed' || o.status === 'pending_approval' || o.cancellation_status === 'cancelled_by_customer')).map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-gray-900">#{order.id}</div>
                          {order.legal_delivery && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">
                              ⚖️
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleDateString('de-DE')}
                        </div>
                        {(order.needs_loading_help || order.needs_unloading_help) && (
                          <div className="flex gap-1 mt-1">
                            {order.needs_loading_help && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                                📦
                              </span>
                            )}
                            {order.needs_unloading_help && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                                📤
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-2">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{order.pickup_city}</div>
                            <div className="text-gray-500">→ {order.delivery_city}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1 text-sm text-gray-900">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{new Date(order.pickup_date).toLocaleDateString('de-DE')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.vehicle_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.contractor_company || order.contractor_first_name
                          ? `${order.contractor_company || ''} ${order.contractor_first_name || ''} ${order.contractor_last_name || ''}`.trim()
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex flex-col space-y-1">
                          {/* Zeige customer_price (was Kunde zahlt), oder price als Fallback für alte Orders */}
                          <span className="font-semibold">
                            {order.customer_price 
                              ? formatPrice(parseFloat(order.customer_price)) 
                              : order.price 
                                ? formatPrice(parseFloat(order.price))
                                : '-'}
                          </span>
                          
                          {/* Wartezeit-Gebühr für abgeschlossene Aufträge */}
                          {(order.status === 'completed' || order.status === 'pending_approval') && order.waiting_time_fee && parseFloat(order.waiting_time_fee) > 0 && (
                            <div className="text-xs bg-yellow-50 border border-yellow-200 rounded p-3 mt-2 space-y-2">
                              <div className="font-semibold text-yellow-900 border-b border-yellow-300 pb-1">
                                ⏱️ Wartezeit-Vergütung
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2">
                                <div className="bg-white p-2 rounded">
                                  <p className="text-xs text-gray-500">Abholung</p>
                                  <p className="font-semibold">{order.pickup_waiting_minutes || 0} Min.</p>
                                </div>
                                <div className="bg-white p-2 rounded">
                                  <p className="text-xs text-gray-500">Zustellung</p>
                                  <p className="font-semibold">{order.delivery_waiting_minutes || 0} Min.</p>
                                </div>
                              </div>
                              
                              {/* Begründungen */}
                              {(order.pickup_waiting_notes || order.delivery_waiting_notes || order.waiting_time_notes) && (
                                <div className="bg-white p-2 rounded space-y-1">
                                  {order.pickup_waiting_notes && order.pickup_waiting_minutes > 0 && (
                                    <div>
                                      <p className="text-xs text-gray-500 font-medium">Begründung Abholung:</p>
                                      <p className="text-xs text-gray-700">{order.pickup_waiting_notes}</p>
                                    </div>
                                  )}
                                  {order.delivery_waiting_notes && order.delivery_waiting_minutes > 0 && (
                                    <div>
                                      <p className="text-xs text-gray-500 font-medium">Begründung Zustellung:</p>
                                      <p className="text-xs text-gray-700">{order.delivery_waiting_notes}</p>
                                    </div>
                                  )}
                                  {!order.pickup_waiting_notes && !order.delivery_waiting_notes && order.waiting_time_notes && (
                                    <div>
                                      <p className="text-xs text-gray-500 font-medium">Begründung:</p>
                                      <p className="text-xs text-gray-700">{order.waiting_time_notes}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <div className="bg-green-50 border border-green-200 p-2 rounded space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-600">Zusätzliche Kosten:</span>
                                  <span className="font-bold text-green-700">+€{parseFloat(order.waiting_time_fee || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-1 border-t border-green-300">
                                  <span className="text-xs font-semibold text-gray-700">Gesamtpreis:</span>
                                  <span className="font-bold text-gray-900">
                                    {formatPrice(parseFloat(order.customer_price || 0) + parseFloat(order.waiting_time_fee || 0))}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  (Erste 30 Min. kostenlos, danach €3 pro 5 Min.)
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {/* Stornierungsgebühr */}
                          {order.cancellation_status === 'cancelled_by_customer' && order.cancellation_fee && parseFloat(order.cancellation_fee) > 0 && (
                            <div className="text-xs bg-red-50 border border-red-200 rounded p-2 mt-2">
                              <div className="font-semibold text-red-900">
                                🚫 Stornierungsgebühr
                              </div>
                              <div className="text-red-700 font-bold mt-1">
                                €{parseFloat(order.cancellation_fee).toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                Storniert am: {new Date(order.cancelled_at).toLocaleDateString('de-DE')}
                              </div>
                            </div>
                          )}
                          
                          {/* Retourengebühr */}
                          {order.return_status && order.return_status !== 'none' && order.return_fee && parseFloat(order.return_fee) > 0 && (
                            <div className="text-xs bg-orange-50 border border-orange-200 rounded p-2 mt-2">
                              <div className="font-semibold text-orange-900">
                                🔄 Retourengebühr
                              </div>
                              <div className="text-orange-700 font-bold mt-1">
                                +€{parseFloat(order.return_fee).toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                Grund: {order.return_reason}
                              </div>
                              {order.return_status === 'completed' && (
                                <div className="text-xs text-green-600 mt-1">
                                  ✓ Retoure abgeschlossen
                                </div>
                              )}
                              {order.return_status === 'pending' && (
                                <div className="text-xs text-orange-600 mt-1">
                                  ⏳ Retoure läuft
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Preis erhöhen für ausstehende Aufträge */}
                          {order.status === 'pending' && (
                            <button
                              onClick={() => setSelectedOrderForPriceUpdate(order)}
                              className="text-green-600 hover:text-green-800 text-xs font-medium flex items-center space-x-1 hover:underline"
                              title="Preis erhöhen um schneller einen Auftragnehmer zu finden"
                            >
                              <TrendingUp className="h-3 w-3" />
                              <span>Preis erhöhen</span>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {(order.status === 'accepted' || order.status === 'in_transit' || order.status === 'completed' || order.status === 'pending_approval') && (
                          <button
                            onClick={() => setSelectedOrderForCMR(order.id)}
                            className="text-primary-600 hover:text-primary-900 flex items-center space-x-1"
                          >
                            <FileText className="h-4 w-4" />
                            <span>Anzeigen</span>
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {order.status !== 'cancelled' && order.status !== 'completed' && !order.cancellation_status && (
                          <button
                            onClick={() => setSelectedOrderForCancellation(order)}
                            className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                          >
                            <XCircle className="h-4 w-4" />
                            <span>Stornieren</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        )}
      </div>

      {/* Create Order Modal */}
      {showCreateModal && (
        <CreateOrderModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleOrderCreated}
        />
      )}

      {/* CMR Viewer Modal */}
      {selectedOrderForCMR && (
        <CMRViewer
          orderId={selectedOrderForCMR}
          onClose={() => setSelectedOrderForCMR(null)}
        />
      )}

      {/* Update Price Modal */}
      {selectedOrderForPriceUpdate && (
        <UpdatePriceModal
          order={selectedOrderForPriceUpdate}
          onClose={() => setSelectedOrderForPriceUpdate(null)}
          onSuccess={() => {
            setSelectedOrderForPriceUpdate(null);
            fetchOrders();
          }}
        />
      )}

      {/* Cancellation Modal */}
      {selectedOrderForCancellation && (
        <CancellationModal
          order={selectedOrderForCancellation}
          userRole="customer"
          onClose={() => setSelectedOrderForCancellation(null)}
          onSuccess={() => {
            setSelectedOrderForCancellation(null);
            fetchOrders();
          }}
        />
      )}
    </div>
  );
};

export default CustomerDashboard;
