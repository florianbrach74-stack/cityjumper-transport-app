import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import CMRViewer from '../components/CMRViewer';
import CMRSignature from '../components/CMRSignature';
import { Package, Clock, CheckCircle, Truck, Calendar, MapPin, FileText, UserCheck } from 'lucide-react';

const EmployeeDashboardNew = () => {
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignmentMode, setAssignmentMode] = useState('all_access');
  const [selectedOrderForCMR, setSelectedOrderForCMR] = useState(null);
  const [selectedOrderForPickup, setSelectedOrderForPickup] = useState(null);
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // all, accepted, in_transit, completed

  const fetchOrders = async () => {
    try {
      const response = await fetch('https://cityjumper-api-production-01e4.up.railway.app/api/employee-assignment/employee/orders', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      console.log('📦 Employee orders response:', data);
      
      const orders = data.orders || [];
      setAllOrders(orders);
      setAssignmentMode(data.assignmentMode || 'all_access');
      
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleTakeOrder = async (orderId) => {
    if (!confirm('Möchten Sie diesen Auftrag übernehmen?')) return;
    
    try {
      const response = await fetch(`https://cityjumper-api-production-01e4.up.railway.app/api/employee-assignment/employee/take-order/${orderId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        alert('Auftrag erfolgreich übernommen!');
        fetchOrders();
      } else {
        alert('Fehler beim Übernehmen des Auftrags');
      }
    } catch (error) {
      console.error('Error taking order:', error);
      alert('Fehler beim Übernehmen des Auftrags');
    }
  };

  const handlePickup = (order) => {
    setSelectedOrderForPickup(order);
  };

  const handleDelivery = (order) => {
    setSelectedOrderForDelivery(order);
  };

  const handlePickupComplete = () => {
    setSelectedOrderForPickup(null);
    fetchOrders();
  };

  const handleDeliveryComplete = () => {
    setSelectedOrderForDelivery(null);
    fetchOrders();
  };

  // Filter orders based on status
  const getFilteredOrders = () => {
    const myId = parseInt(localStorage.getItem('userId') || '0');
    
    switch (activeTab) {
      case 'all':
        // All accepted orders of contractor
        return allOrders;
        
      case 'accepted':
        // Orders assigned to me (manual) OR all orders if all_access
        if (assignmentMode === 'manual' || assignmentMode === 'manual_assignment') {
          return allOrders.filter(o => o.assigned_employee_id === myId && !o.pickup_confirmed);
        } else {
          // all_access: show unassigned orders with "Übernehmen" button
          return allOrders.filter(o => !o.pickup_confirmed);
        }
        
      case 'in_transit':
        // Orders I'm working on (picked up but not delivered)
        return allOrders.filter(o => o.assigned_employee_id === myId && o.pickup_confirmed && !o.delivery_confirmed);
        
      case 'completed':
        // Orders I completed
        return allOrders.filter(o => o.assigned_employee_id === myId && o.delivery_confirmed);
        
      default:
        return allOrders;
    }
  };

  const filteredOrders = getFilteredOrders();
  const myId = parseInt(localStorage.getItem('userId') || '0');

  // Calculate stats
  const stats = {
    all: allOrders.length,
    accepted: (assignmentMode === 'manual' || assignmentMode === 'manual_assignment')
      ? allOrders.filter(o => o.assigned_employee_id === myId && !o.pickup_confirmed).length
      : allOrders.filter(o => !o.pickup_confirmed).length,
    in_transit: allOrders.filter(o => o.assigned_employee_id === myId && o.pickup_confirmed && !o.delivery_confirmed).length,
    completed: allOrders.filter(o => o.assigned_employee_id === myId && o.delivery_confirmed).length
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
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
            Mitarbeiter Dashboard
          </h1>
          <p className="text-gray-600">Übersicht Ihrer Aufträge</p>
          {assignmentMode === 'all_access' && (
            <p className="text-sm text-blue-600 mt-1">
              ℹ️ Sie können alle Aufträge übernehmen
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`bg-white rounded-xl shadow-soft p-6 text-left transition-all ${
              activeTab === 'all' ? 'ring-2 ring-primary-500' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gesamt Aufträge</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.all}</p>
              </div>
              <div className="bg-primary-100 p-3 rounded-lg">
                <Package className="h-6 w-6 text-primary-600" />
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('accepted')}
            className={`bg-white rounded-xl shadow-soft p-6 text-left transition-all ${
              activeTab === 'accepted' ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Akzeptiert</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.accepted}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('in_transit')}
            className={`bg-white rounded-xl shadow-soft p-6 text-left transition-all ${
              activeTab === 'in_transit' ? 'ring-2 ring-purple-500' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unterwegs</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{stats.in_transit}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Truck className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`bg-white rounded-xl shadow-soft p-6 text-left transition-all ${
              activeTab === 'completed' ? 'ring-2 ring-green-500' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Abgeschlossen</p>
                <p className="text-3xl font-bold text-success-600 mt-2">{stats.completed}</p>
              </div>
              <div className="bg-success-100 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-success-600" />
              </div>
            </div>
          </button>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-xl shadow-soft">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {activeTab === 'all' && 'Alle Aufträge'}
              {activeTab === 'accepted' && 'Akzeptierte Aufträge'}
              {activeTab === 'in_transit' && 'Unterwegs'}
              {activeTab === 'completed' && 'Abgeschlossen'}
            </h2>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Aufträge</h3>
              <p className="mt-1 text-sm text-gray-500">
                {activeTab === 'all' && 'Keine Aufträge verfügbar'}
                {activeTab === 'accepted' && 'Keine akzeptierten Aufträge'}
                {activeTab === 'in_transit' && 'Keine Aufträge unterwegs'}
                {activeTab === 'completed' && 'Keine abgeschlossenen Aufträge'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fahrzeug</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => {
                    const isAssignedToMe = order.assigned_employee_id === myId;
                    const canTakeOrder = assignmentMode === 'all_access' && !order.assigned_employee_id && activeTab === 'accepted';
                    
                    return (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{order.id}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="font-medium">{order.pickup_city}</div>
                              <div className="text-gray-500">→ {order.delivery_city}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(order.pickup_date).toLocaleDateString('de-DE')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.vehicle_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isAssignedToMe && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <UserCheck className="h-3 w-3 mr-1" />
                              Mir zugewiesen
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center space-x-2">
                            {/* Übernehmen Button (all_access mode) */}
                            {canTakeOrder && (
                              <button
                                onClick={() => handleTakeOrder(order.id)}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                              >
                                <UserCheck className="h-4 w-4 mr-1" />
                                Übernehmen
                              </button>
                            )}
                            
                            {/* Paket abholen (assigned to me, not picked up yet) */}
                            {isAssignedToMe && !order.pickup_confirmed && (
                              <button
                                onClick={() => handlePickup(order)}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                              >
                                <Package className="h-4 w-4 mr-1" />
                                Paket abholen
                              </button>
                            )}
                            
                            {/* Zustellung (picked up, not delivered) */}
                            {isAssignedToMe && order.pickup_confirmed && !order.delivery_confirmed && (
                              <button
                                onClick={() => handleDelivery(order)}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                              >
                                <Truck className="h-4 w-4 mr-1" />
                                Zustellung
                              </button>
                            )}
                            
                            {/* CMR anzeigen */}
                            {order.cmr_number && (
                              <button
                                onClick={() => setSelectedOrderForCMR(order.id)}
                                className="text-primary-600 hover:text-primary-900 flex items-center space-x-1"
                              >
                                <FileText className="h-4 w-4" />
                                <span>CMR</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedOrderForCMR && (
        <CMRViewer
          orderId={selectedOrderForCMR}
          onClose={() => setSelectedOrderForCMR(null)}
        />
      )}

      {selectedOrderForPickup && (
        <CMRSignature
          order={selectedOrderForPickup}
          mode="pickup"
          onClose={() => setSelectedOrderForPickup(null)}
          onComplete={handlePickupComplete}
        />
      )}

      {selectedOrderForDelivery && (
        <CMRSignature
          order={selectedOrderForDelivery}
          mode="delivery"
          onClose={() => setSelectedOrderForDelivery(null)}
          onComplete={handleDeliveryComplete}
        />
      )}
    </div>
  );
};

export default EmployeeDashboardNew;
