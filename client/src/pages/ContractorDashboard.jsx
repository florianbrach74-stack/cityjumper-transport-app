import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI, bidsAPI, verificationAPI } from '../services/api';
import Navbar from '../components/Navbar';
import CMRViewer from '../components/CMRViewer';
import CMRSignature from '../components/CMRSignature';
import BidModal from '../components/BidModal';
import EmployeeManagement from '../components/EmployeeManagement';
import NotificationSettings from '../components/NotificationSettings';
import { Package, Clock, CheckCircle, Truck, Calendar, MapPin, AlertCircle, FileText, Bell } from 'lucide-react';

const ContractorDashboard = () => {
  const navigate = useNavigate();
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available');
  const [selectedOrderForBid, setSelectedOrderForBid] = useState(null);
  const [selectedOrderForCMR, setSelectedOrderForCMR] = useState(null);
  const [selectedOrderForPickup, setSelectedOrderForPickup] = useState(null);
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);

  const fetchOrders = async () => {
    try {
      const [availableRes, myOrdersRes, myBidsRes] = await Promise.all([
        ordersAPI.getAvailableOrders(),
        ordersAPI.getOrders(),
        bidsAPI.getMyBids(),
      ]);
      setAvailableOrders(availableRes.data.orders);
      setMyOrders(myOrdersRes.data.orders);
      setMyBids(myBidsRes.data.bids);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchVerificationStatus();
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      const response = await verificationAPI.getStatus();
      setVerificationStatus(response.data.verificationStatus);
    } catch (error) {
      console.error('Error fetching verification status:', error);
    }
  };

  const handleBidSuccess = () => {
    setSelectedOrderForBid(null);
    fetchOrders();
    alert('Bewerbung erfolgreich eingereicht! Sie werden benachrichtigt wenn Ihre Bewerbung akzeptiert wird.');
    setActiveTab('my-bids');
  };

  const handlePickupComplete = async (data) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/cmr/order/${selectedOrderForPickup.id}/pickup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Pickup confirmation failed');

      alert('Abholung erfolgreich bestätigt! Der Kunde wurde benachrichtigt.');
      setSelectedOrderForPickup(null);
      fetchOrders();
    } catch (error) {
      console.error('Error confirming pickup:', error);
      throw error;
    }
  };

  const handleDeliveryComplete = async (data) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/cmr/order/${selectedOrderForDelivery.id}/delivery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Delivery confirmation failed');

      alert('Zustellung erfolgreich bestätigt! Der Kunde wurde benachrichtigt und das CMR-Dokument wurde versendet.');
      setSelectedOrderForDelivery(null);
      fetchOrders();
    } catch (error) {
      console.error('Error confirming delivery:', error);
      throw error;
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    const statusMessages = {
      'picked_up': 'Möchten Sie den Auftrag als "Abgeholt" markieren?\n\nDer Kunde wird per Email benachrichtigt.',
      'delivered': 'Möchten Sie die Zustellung abschließen?\n\nSie werden zur Unterschrifts-Seite weitergeleitet.'
    };

    if (!confirm(statusMessages[newStatus])) {
      return;
    }

    try {
      await ordersAPI.updateOrderStatus(orderId, newStatus);
      
      if (newStatus === 'delivered') {
        // Open CMR signature page
        setSelectedOrderForCMR(orderId);
      } else {
        // Just refresh orders
        await fetchOrders();
        alert('Status erfolgreich aktualisiert! Kunde wurde benachrichtigt.');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      console.error('Error details:', error.response?.data);
      alert(`Fehler beim Aktualisieren des Status: ${error.response?.data?.error || error.message}`);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Ausstehend', icon: Clock },
      accepted: { color: 'bg-blue-100 text-blue-800', text: 'Angenommen', icon: CheckCircle },
      picked_up: { color: 'bg-green-100 text-green-800', text: 'Abgeholt', icon: Package },
      in_transit: { color: 'bg-purple-100 text-purple-800', text: 'Unterwegs', icon: Truck },
      delivered: { color: 'bg-green-600 text-white', text: 'Zugestellt', icon: CheckCircle },
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

        {/* Distance and Duration */}
        {(order.distance_km || order.duration_minutes) && (
          <div className="grid grid-cols-2 gap-4 pt-3 border-t bg-blue-50 -mx-6 px-6 py-3">
            {order.distance_km && (
              <div className="text-sm">
                <div className="text-gray-500 flex items-center">
                  <span className="mr-1">🛣️</span> Entfernung
                </div>
                <div className="font-semibold text-blue-600">{order.distance_km} km</div>
              </div>
            )}
            {order.duration_minutes && (
              <div className="text-sm">
                <div className="text-gray-500 flex items-center">
                  <span className="mr-1">⏱️</span> Fahrzeit
                </div>
                <div className="font-semibold text-blue-600">
                  {Math.floor(order.duration_minutes / 60)}h {order.duration_minutes % 60}min
                </div>
              </div>
            )}
          </div>
        )}

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

        {/* Waiting Time Notice for completed/delivered orders */}
        {!showAcceptButton && (order.status === 'delivered' || order.status === 'completed' || order.status === 'pending_approval') && (
          (order.pickup_waiting_minutes > 0 || order.delivery_waiting_minutes > 0) && (
            <div className={`pt-3 border-t ${
              order.status === 'pending_approval' ? 'bg-orange-50' : 
              order.waiting_time_approved ? 'bg-green-50' : 'bg-gray-50'
            } -mx-6 px-6 py-3`}>
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0">
                  {order.status === 'pending_approval' ? '⏱️' : 
                   order.waiting_time_approved ? '✅' : 'ℹ️'}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    Wartezeit-Vergütung
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Abholung: {order.pickup_waiting_minutes || 0} Min. | 
                    Zustellung: {order.delivery_waiting_minutes || 0} Min.
                  </div>
                  {order.waiting_time_fee > 0 && (
                    <div className="text-sm font-semibold text-green-600 mt-1">
                      Vergütung: €{order.waiting_time_fee}
                    </div>
                  )}
                  <div className={`text-xs mt-2 px-3 py-2 rounded ${
                    order.status === 'pending_approval' ? 'bg-orange-100 text-orange-800' :
                    order.waiting_time_approved ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status === 'pending_approval' ? (
                      <>⚠️ <strong>Bitte noch nicht abrechnen!</strong> Wartezeit muss erst vom Admin freigegeben werden.</>
                    ) : order.waiting_time_approved ? (
                      <>✓ <strong>Freigegeben!</strong> Sie können die Wartezeit-Vergütung abrechnen.</>
                    ) : (
                      <>❌ Wartezeit-Vergütung wurde abgelehnt.</>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
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
            <div className="text-lg font-bold text-primary-600">
              €{showAcceptButton ? (order.price * 0.85).toFixed(2) : order.price}
              {showAcceptButton && (
                <span className="text-xs text-gray-500 ml-1">(max.)</span>
              )}
              {!showAcceptButton && order.waiting_time_fee > 0 && order.waiting_time_approved && (
                <span className="text-sm text-green-600 ml-2">
                  + €{order.waiting_time_fee}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Status Buttons and CMR for accepted orders */}
        {!showAcceptButton && (
          <div className="mt-4 space-y-2">
            {/* Status: Accepted - Show "Paket abholen" button */}
            {order.status === 'accepted' && (
              <button
                onClick={() => setSelectedOrderForPickup(order)}
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                <Package className="h-5 w-5 mr-2" />
                Paket abholen
              </button>
            )}

            {/* Status: Picked Up - Show "Zustellung" button */}
            {order.status === 'picked_up' && (
              <button
                onClick={() => setSelectedOrderForDelivery(order)}
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Truck className="h-5 w-5 mr-2" />
                Zustellung abschließen
              </button>
            )}

            {/* CMR Button - visible after pickup */}
            {(order.status === 'picked_up' || order.status === 'delivered') && (
              <button
                onClick={() => setSelectedOrderForCMR(order.id)}
                className="w-full flex justify-center items-center px-4 py-2 border border-primary-600 rounded-lg text-sm font-medium text-primary-600 hover:bg-primary-50"
              >
                <FileText className="h-5 w-5 mr-2" />
                CMR anzeigen
              </button>
            )}
          </div>
        )}

        {/* Apply Button */}
        {showAcceptButton && (
          <button
            onClick={() => setSelectedOrderForBid(order)}
            className="w-full mt-4 flex justify-center items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            Auf Auftrag bewerben
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

        {/* Verification Banner */}
        {verificationStatus && verificationStatus !== 'approved' && (
          <div className={`mb-6 rounded-lg p-4 ${
            verificationStatus === 'pending' 
              ? 'bg-yellow-50 border border-yellow-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start">
              <AlertCircle className={`h-5 w-5 ${
                verificationStatus === 'pending' ? 'text-yellow-600' : 'text-red-600'
              } mr-3 mt-0.5`} />
              <div className="flex-1">
                {verificationStatus === 'pending' ? (
                  <>
                    <h3 className="font-semibold text-yellow-900">Verifizierung ausstehend</h3>
                    <p className="text-sm text-yellow-800 mt-1">
                      Ihre Dokumente werden geprüft. Sie werden benachrichtigt sobald Ihr Account freigegeben wurde.
                    </p>
                  </>
                ) : verificationStatus === 'rejected' ? (
                  <>
                    <h3 className="font-semibold text-red-900">Verifizierung abgelehnt</h3>
                    <p className="text-sm text-red-800 mt-1">
                      Ihre Dokumente wurden abgelehnt. Bitte laden Sie die korrekten Dokumente erneut hoch.
                    </p>
                    <button
                      onClick={() => navigate('/verification')}
                      className="mt-2 text-sm font-medium text-red-700 hover:text-red-800 underline"
                    >
                      Dokumente erneut hochladen
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="font-semibold text-red-900">Account nicht verifiziert</h3>
                    <p className="text-sm text-red-800 mt-1">
                      Bitte verifizieren Sie Ihren Account um sich auf Aufträge bewerben zu können.
                    </p>
                    <button
                      onClick={() => navigate('/verification')}
                      className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                    >
                      Jetzt verifizieren
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
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
              <span>Verfügbare Aufträge ({availableOrders.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('my-orders')}
              className={`${
                activeTab === 'my-orders'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <Truck className="h-5 w-5" />
              <span>Aktive Aufträge ({myOrders.filter(o => o.status !== 'delivered' && o.status !== 'completed').length})</span>
            </button>
            <button
              onClick={() => setActiveTab('my-bids')}
              className={`${
                activeTab === 'my-bids'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <Clock className="h-5 w-5" />
              <span>Meine Bewerbungen ({myBids.length})</span>
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
              <span>Abgeschlossene Aufträge ({myOrders.filter(o => o.status === 'delivered' || o.status === 'completed' || o.status === 'pending_approval').length})</span>
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
            {myOrders.filter(o => o.status !== 'delivered' && o.status !== 'completed').length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Keine aktiven Aufträge</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Sie haben momentan keine aktiven Aufträge.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {myOrders.filter(o => o.status !== 'delivered' && o.status !== 'completed').map((order) => (
                  <OrderCard key={order.id} order={order} showAcceptButton={false} />
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'my-bids' ? (
          <div>
            {myBids.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <Clock className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Bewerbungen</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Sie haben sich noch auf keine Aufträge beworben.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {myBids.map((bid) => (
                  <div key={bid.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Bewerbung #{bid.id}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(bid.created_at).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        bid.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        bid.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {bid.status === 'pending' ? 'Ausstehend' :
                         bid.status === 'accepted' ? 'Akzeptiert' : 'Abgelehnt'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        <strong>Route:</strong> {bid.pickup_city} → {bid.delivery_city}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Ihr Gebot:</strong> <span className="text-primary-600 font-semibold">€{bid.bid_amount}</span>
                      </p>
                      {bid.message && (
                        <p className="text-sm text-gray-600">
                          <strong>Ihre Nachricht:</strong> {bid.message}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'completed' ? (
          <div>
            {myOrders.filter(o => o.status === 'delivered' || o.status === 'completed' || o.status === 'pending_approval').length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Keine abgeschlossenen Aufträge</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Sie haben noch keine Aufträge abgeschlossen.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {myOrders.filter(o => o.status === 'delivered' || o.status === 'completed' || o.status === 'pending_approval').map((order) => (
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

      {/* Bid Modal */}
      {selectedOrderForBid && (
        <BidModal
          order={selectedOrderForBid}
          onClose={() => setSelectedOrderForBid(null)}
          onSuccess={handleBidSuccess}
        />
      )}

      {/* CMR Viewer Modal */}
      {selectedOrderForCMR && (
        <CMRViewer
          orderId={selectedOrderForCMR}
          onClose={() => setSelectedOrderForCMR(null)}
        />
      )}

      {/* Pickup Signature Modal */}
      {selectedOrderForPickup && (
        <CMRSignature
          order={selectedOrderForPickup}
          mode="pickup"
          onClose={() => setSelectedOrderForPickup(null)}
          onComplete={handlePickupComplete}
        />
      )}

      {/* Delivery Signature Modal */}
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

export default ContractorDashboard;
