import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import CMRViewer from '../components/CMRViewer';
import CMRSignature from '../components/CMRSignature';
import BidModal from '../components/BidModal';
import EmployeeManagement from '../components/EmployeeManagement';
import NotificationSettings from '../components/NotificationSettings';
import ReportsSummary from '../components/ReportsSummary';
import AssignEmployeeDropdown from '../components/AssignEmployeeDropdown';
import MobileBottomNav from '../components/MobileBottomNav';
import MobileMenuModal from '../components/MobileMenuModal';
import MobileOrderCard from '../components/MobileOrderCard';
import RoleSwitcher from '../components/RoleSwitcher';
import { formatPrice } from '../utils/formatPrice';
import { Package, Clock, CheckCircle, Truck, Calendar, MapPin, AlertCircle, FileText, Bell, BarChart3 } from 'lucide-react';

// API helpers
const ordersAPI = {
  getAvailableOrders: () => api.get('/orders/available'),
  getOrders: () => api.get('/orders'),
  updateOrderStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
};

const bidsAPI = {
  getMyBids: () => api.get('/bids/my-bids'),
};

const verificationAPI = {
  getStatus: () => api.get('/contractors/verification-status'),
};

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
  const [assignmentMode, setAssignmentMode] = useState('all_access');
  const [penalties, setPenalties] = useState([]);
  const [pendingPenaltiesTotal, setPendingPenaltiesTotal] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const fetchOrders = async () => {
    try {
      const [availableRes, myOrdersRes, myBidsRes] = await Promise.all([
        ordersAPI.getAvailableOrders(),
        ordersAPI.getOrders(),
        bidsAPI.getMyBids(),
      ]);
      
      // Debug logging for multi-stop orders
      console.log('📦 Available Orders:', availableRes.data.orders.length);
      availableRes.data.orders.forEach(order => {
        console.log(`Order #${order.id}:`, {
          pickup_stops_type: typeof order.pickup_stops,
          pickup_stops_value: order.pickup_stops,
          delivery_stops_type: typeof order.delivery_stops,
          delivery_stops_value: order.delivery_stops,
          has_pickup_stops: order.pickup_stops ? true : false,
          has_delivery_stops: order.delivery_stops ? true : false
        });
      });
      
      setAvailableOrders(availableRes.data.orders);
      setMyOrders(myOrdersRes.data.orders);
      setMyBids(myBidsRes.data.bids);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPenalties = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = JSON.parse(atob(token.split('.')[1])).id;
      const response = await api.get(`/penalties/contractor/${userId}`);
      setPenalties(response.data.penalties);
      setPendingPenaltiesTotal(response.data.pendingTotal);
    } catch (error) {
      // Silently handle 404 - penalties feature might not be available
      if (error.response?.status !== 404) {
        console.error('Error fetching penalties:', error);
      }
      setPenalties([]);
      setPendingPenaltiesTotal(0);
    }
  };

  const fetchAssignmentMode = async () => {
    try {
      const response = await api.get('/employee-assignment/settings');
      setAssignmentMode(response.data.assignmentMode || 'all_access');
    } catch (error) {
      console.error('Error fetching assignment mode:', error);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchVerificationStatus();
    fetchAssignmentMode();
    fetchPenalties();
    
    // Mobile detection
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      const response = await verificationAPI.getStatus();
      setVerificationStatus(response.data.verificationStatus);
    } catch (error) {
      // Silently handle 404 - verification feature might not be available
      if (error.response?.status !== 404) {
        console.error('Error fetching verification status:', error);
      }
      setVerificationStatus(null);
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
    console.log('🚀 [DASHBOARD] handleDeliveryComplete called');
    console.log('📦 [DASHBOARD] Order ID:', selectedOrderForDelivery?.id);
    console.log('📦 [DASHBOARD] Data:', {
      cmrId: data.cmrId,
      receiverName: data.receiverName,
      hasSignature: !!data.receiverSignature,
      signatureLength: data.receiverSignature ? data.receiverSignature.length : 0,
      signaturePreview: data.receiverSignature ? data.receiverSignature.substring(0, 50) + '...' : 'null',
      hasPhoto: !!data.deliveryPhoto,
      photoLength: data.deliveryPhoto ? data.deliveryPhoto.length : 0,
      photoPreview: data.deliveryPhoto ? data.deliveryPhoto.substring(0, 50) + '...' : 'null',
      deliveryWaitingMinutes: data.deliveryWaitingMinutes,
      waitingNotes: data.waitingNotes
    });
    
    try {
      const token = localStorage.getItem('token');
      const url = `${import.meta.env.VITE_API_URL}/api/cmr/order/${selectedOrderForDelivery.id}/delivery`;
      
      console.log('🌐 [DASHBOARD] Making API call to:', url);
      console.log('📤 [DASHBOARD] Request body:', JSON.stringify(data, null, 2));
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      console.log('📥 [DASHBOARD] Response status:', response.status);
      const result = await response.json();
      console.log('📥 [DASHBOARD] Response data:', result);

      if (!response.ok) {
        console.error('❌ [DASHBOARD] API error:', result.error);
        throw new Error(result.error || 'Delivery confirmation failed');
      }

      // Check if all stops are completed
      if (result.allStopsCompleted) {
        console.log('🎉 [DASHBOARD] All stops completed!');
        alert('Zustellung erfolgreich bestätigt! Der Kunde wurde benachrichtigt und das CMR-Dokument wurde versendet.');
      } else {
        console.log('✅ [DASHBOARD] Stop completed, more stops remaining');
        // Don't show alert here - CMRSignature will handle it
      }
      
      setSelectedOrderForDelivery(null);
      fetchOrders();
      
      // Return result so CMRSignature can use it
      return result;
    } catch (error) {
      console.error('❌ [DASHBOARD] Error confirming delivery:', error);
      console.error('❌ [DASHBOARD] Error message:', error.message);
      console.error('❌ [DASHBOARD] Error stack:', error.stack);
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

  const getStatusBadge = (status, cancellationStatus) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Ausstehend', icon: Clock },
      accepted: { color: 'bg-blue-100 text-blue-800', text: 'Angenommen', icon: CheckCircle },
      picked_up: { color: 'bg-green-100 text-green-800', text: 'Abgeholt', icon: Package },
      in_transit: { color: 'bg-purple-100 text-purple-800', text: 'Unterwegs', icon: Truck },
      delivered: { color: 'bg-green-600 text-white', text: 'Zugestellt', icon: CheckCircle },
      completed: { color: 'bg-green-100 text-green-800', text: 'Abgeschlossen', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', text: 'Storniert', icon: AlertCircle },
    };
    
    // If order is cancelled, show cancellation status
    if (cancellationStatus) {
      return (
        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <AlertCircle className="h-3 w-3" />
          <span>Storniert</span>
        </span>
      );
    }
    
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
        {!showAcceptButton && getStatusBadge(order.status, order.cancellation_status)}
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
                  
                  {/* Multi-Stop Pickup Indicator */}
                  {(() => {
                    const pickupStops = order.pickup_stops
                      ? (typeof order.pickup_stops === 'string' ? JSON.parse(order.pickup_stops) : order.pickup_stops)
                      : [];
                    const deliveryStops = order.delivery_stops
                      ? (typeof order.delivery_stops === 'string' ? JSON.parse(order.delivery_stops) : order.delivery_stops)
                      : [];
                    const hasMultiStop = pickupStops.length > 0 || deliveryStops.length > 0;
                    
                    // Debug logging for this specific order
                    console.log(`🚚 Order #${order.id} Multi-Stop Check:`, {
                      pickupStops_length: pickupStops.length,
                      deliveryStops_length: deliveryStops.length,
                      hasMultiStop: hasMultiStop,
                      will_show_badge: hasMultiStop
                    });
                    
                    return hasMultiStop && (
                    <div className="mt-2 bg-purple-50 border border-purple-200 rounded px-2 py-1">
                      <span className="text-purple-700 font-semibold text-xs">
                        🚚 MULTI-STOP: {pickupStops.length + deliveryStops.length + 2} Adressen
                      </span>
                      <div className="text-xs text-purple-600 mt-1">
                        <div><strong>Alle PLZ:</strong> {order.pickup_postal_code}
                        {pickupStops.map((stop, i) => (
                          <span key={`p${i}`}> → {stop.postal_code}</span>
                        ))}
                        <span> → {order.delivery_postal_code}</span>
                        {deliveryStops.map((stop, i) => (
                          <span key={`d${i}`}> → {stop.postal_code}</span>
                        ))}
                        </div>
                      </div>
                    </div>
                    );
                  })()}
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
                  
                  {/* Multi-Stop Pickup Details */}
                  {(() => {
                    const pickupStops = order.pickup_stops
                      ? (typeof order.pickup_stops === 'string' ? JSON.parse(order.pickup_stops) : order.pickup_stops)
                      : [];
                    return pickupStops.length > 0 && (
                    <div className="mt-2 bg-blue-50 border border-blue-200 rounded p-2">
                      <div className="font-semibold text-blue-700 text-xs mb-1">
                        📦 Zusätzliche Abholungen ({pickupStops.length}):
                      </div>
                      {pickupStops.map((stop, i) => (
                        <div key={i} className="text-xs text-gray-700 mt-1 pl-2 border-l-2 border-blue-300">
                          <div>{stop.address}, {stop.postal_code} {stop.city}</div>
                          {stop.contact_name && (
                            <div className="text-gray-500">Kontakt: {stop.contact_name}</div>
                          )}
                        </div>
                      ))}
                    </div>
                    );
                  })()}
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
                  
                  {/* Multi-Stop Details for accepted orders */}
                  {(() => {
                    const deliveryStops = order.delivery_stops
                      ? (typeof order.delivery_stops === 'string' ? JSON.parse(order.delivery_stops) : order.delivery_stops)
                      : [];
                    return deliveryStops.length > 0 && (
                    <div className="mt-2 bg-orange-50 border border-orange-200 rounded p-2">
                      <div className="font-semibold text-orange-700 text-xs mb-1">
                        🚚 Zusätzliche Zustellungen ({deliveryStops.length}):
                      </div>
                      {deliveryStops.map((stop, i) => (
                        <div key={i} className="text-xs text-gray-700 mt-1 pl-2 border-l-2 border-orange-300">
                          <div>{stop.address}, {stop.postal_code} {stop.city}</div>
                          {stop.contact_name && (
                            <div className="text-gray-500">Kontakt: {stop.contact_name}</div>
                          )}
                        </div>
                      ))}
                    </div>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Additional Services */}
        {(order.needs_loading_help || order.needs_unloading_help || order.legal_delivery) && (
          <div className="flex flex-wrap gap-2 pt-3 border-t">
            {order.needs_loading_help && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                📦 Beladehilfe (+€6)
              </span>
            )}
            {order.needs_unloading_help && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                📤 Entladehilfe (+€6)
              </span>
            )}
            {order.legal_delivery && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300">
                ⚖️ Rechtssichere Zustellung
              </span>
            )}
          </div>
        )}

        {/* Date and Vehicle */}
        <div className="grid grid-cols-2 gap-4 pt-3 border-t">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <div className="text-sm">
              <div className="text-gray-500">Abholung</div>
              <div className="font-medium text-gray-900">
                {new Date(order.pickup_date).toLocaleDateString('de-DE')}
              </div>
              {(order.pickup_time_from || order.pickup_time_to) && (
                <div className="text-xs text-gray-600 mt-0.5">
                  {order.pickup_time_from || '00:00'} - {order.pickup_time_to || 'flexibel'}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <div className="text-sm">
              <div className="text-gray-500">Zustellung</div>
              <div className="font-medium text-gray-900">
                {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('de-DE') : 'Gleicher Tag'}
              </div>
              {(order.delivery_time_from || order.delivery_time_to) && (
                <div className="text-xs text-gray-600 mt-0.5">
                  {order.delivery_time_from || '00:00'} - {order.delivery_time_to || 'flexibel'}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Vehicle Type */}
        <div className="pt-3 border-t">
          <div className="flex items-center space-x-2">
            <Truck className="h-4 w-4 text-gray-400" />
            <div className="text-sm">
              <span className="text-gray-500">Fahrzeug:</span>
              <span className="font-medium text-gray-900 ml-2">{order.vehicle_type}</span>
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
                      Vergütung: €{(order.waiting_time_fee * 0.85).toFixed(2)} (85%)
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
              Kunde: {(order.customer_company && order.customer_company.trim()) || `${order.customer_first_name || ''} ${order.customer_last_name || ''}`.trim() || 'Unbekannt'}
            </div>
          )}
          {showAcceptButton && (
            <div className="text-sm text-gray-500 italic">
              Kundendetails nach Annahme sichtbar
            </div>
          )}
          {order.price && (
            <div className="space-y-2">
              <div className="text-lg font-bold text-primary-600">
                {formatPrice(showAcceptButton ? (order.price * 0.85) : (order.contractor_price || order.price * 0.85))}
                {showAcceptButton && (
                  <span className="text-xs text-gray-500 ml-1">(max.)</span>
                )}
                {!showAcceptButton && order.waiting_time_fee > 0 && order.waiting_time_approved && (
                  <span className="text-sm text-green-600 ml-2">
                    + {formatPrice(order.waiting_time_fee * 0.85)}
                  </span>
                )}
              </div>
              {order.price_updated_at && new Date(order.price_updated_at) > new Date(Date.now() - 24 * 60 * 60 * 1000) && (
                <div className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-bold bg-gradient-to-r from-green-400 to-green-600 text-white shadow-lg animate-pulse border-2 border-green-700">
                  ⬆️ NEUER PREIS! Kunde hat Preis erhöht
                </div>
              )}
              
              {/* Retouren-Info */}
              {order.return_status && order.return_status !== 'none' && order.return_fee && parseFloat(order.return_fee) > 0 && (
                <div className="mt-3 bg-orange-50 border-2 border-orange-300 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-orange-900 flex items-center">
                      🔄 RETOURE
                      {order.return_status === 'pending' && <span className="ml-2 text-orange-600">⏳ Läuft</span>}
                      {order.return_status === 'completed' && <span className="ml-2 text-green-600">✓ Abgeschlossen</span>}
                    </div>
                  </div>
                  <div className="text-sm text-gray-700 mb-2">
                    <strong>Grund:</strong> {order.return_reason}
                  </div>
                  <div className="text-sm text-gray-700 mb-2">
                    <strong>Anweisung:</strong> Transportgut zum Absender zurückbringen
                  </div>
                  <div className="bg-white rounded p-2 border border-orange-200">
                    <div className="text-xs text-gray-600">Zusätzliche Vergütung (85%):</div>
                    <div className="text-lg font-bold text-green-600">
                      +{formatPrice(parseFloat(order.return_fee) * 0.85)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Kundenpreis: {formatPrice(parseFloat(order.return_fee))} - 15% Provision
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-orange-200">
                    <div className="text-xs text-gray-600">Gesamtverdienst:</div>
                    <div className="text-xl font-bold text-green-700">
                      {formatPrice(
                        parseFloat(order.contractor_price || order.price * 0.85) + 
                        (order.waiting_time_approved ? parseFloat(order.waiting_time_fee || 0) * 0.85 : 0) +
                        parseFloat(order.return_fee || 0) * 0.85
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      = Auftrag ({formatPrice(order.contractor_price || order.price * 0.85)})
                      {order.waiting_time_approved && order.waiting_time_fee > 0 && ` + Wartezeit (${formatPrice(parseFloat(order.waiting_time_fee) * 0.85)})`}
                      {` + Retoure (${formatPrice(parseFloat(order.return_fee) * 0.85)})`}
                    </div>
                  </div>
                </div>
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
            {order.status === 'picked_up' && (() => {
              // Calculate button text for multi-stop orders
              const deliveryStops = order.delivery_stops 
                ? (typeof order.delivery_stops === 'string' ? JSON.parse(order.delivery_stops) : order.delivery_stops)
                : [];
              const pickupStops = order.pickup_stops
                ? (typeof order.pickup_stops === 'string' ? JSON.parse(order.pickup_stops) : order.pickup_stops)
                : [];
              
              const isMultiStop = deliveryStops.length > 0 || pickupStops.length > 0;
              const totalStops = deliveryStops.length + 1; // Main + extra delivery stops
              
              // For now, we don't know which stop is next - show generic text
              // TODO: Load next pending CMR from API
              const buttonText = isMultiStop 
                ? `Zustellung abschließen (${totalStops} Stops)`
                : 'Zustellung abschließen';
              
              return (
                <button
                  onClick={() => setSelectedOrderForDelivery(order)}
                  className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Truck className="h-5 w-5 mr-2" />
                  {buttonText}
                </button>
              );
            })()}

            {/* CMR Button - visible after pickup */}
            {(order.status === 'picked_up' || order.status === 'delivered' || order.status === 'pending_approval' || order.status === 'completed') && (
              <button
                onClick={() => setSelectedOrderForCMR(order.id)}
                className="w-full flex justify-center items-center px-4 py-2 border border-primary-600 rounded-lg text-sm font-medium text-primary-600 hover:bg-primary-50"
              >
                <FileText className="h-5 w-5 mr-2" />
                CMR anzeigen
              </button>
            )}

            {/* Employee Assignment - visible when manual_assignment mode is active */}
            {assignmentMode === 'manual_assignment' && (
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Zugewiesen an:</span>
                  <AssignEmployeeDropdown
                    orderId={order.id}
                    currentEmployeeId={order.assigned_employee_id}
                    currentEmployeeName={
                      order.employee_first_name
                        ? `${order.employee_first_name} ${order.employee_last_name}`
                        : null
                    }
                    onAssigned={(updatedOrder) => {
                      // Update the order in the list
                      setMyOrders(myOrders.map(o => 
                        o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o
                      ));
                    }}
                  />
                </div>
              </div>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 pb-20 md:pb-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Aufträge</h1>
          <p className="mt-2 text-gray-600">Verfügbare Aufträge annehmen und verwalten</p>
        </div>

        {/* Role Switcher */}
        <div className="mb-6">
          <RoleSwitcher />
        </div>

        {/* Penalties Warning */}
        {pendingPenaltiesTotal > 0 && (
          <div className="mb-6 rounded-lg p-4 bg-red-50 border-2 border-red-300">
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <AlertCircle className="h-6 w-6 text-red-600 mr-3 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-bold text-red-900 text-lg">⚠️ Offene Strafen</h3>
                  <p className="text-sm text-red-800 mt-1">
                    Sie haben offene Stornierungsgebühren in Höhe von <span className="font-bold">€{pendingPenaltiesTotal.toFixed(2)}</span>.
                  </p>
                  <p className="text-xs text-red-700 mt-2">
                    Diese werden von Ihren nächsten Auszahlungen abgezogen oder müssen separat beglichen werden.
                  </p>
                </div>
              </div>
              <div className="text-3xl font-bold text-red-600">
                €{pendingPenaltiesTotal.toFixed(2)}
              </div>
            </div>
            {penalties.filter(p => p.status === 'pending').length > 0 && (
              <div className="mt-4 pt-4 border-t border-red-200">
                <h4 className="text-sm font-semibold text-red-900 mb-2">Details:</h4>
                <div className="space-y-2">
                  {penalties.filter(p => p.status === 'pending').map(penalty => (
                    <div key={penalty.id} className="flex justify-between text-sm">
                      <span className="text-red-800">
                        Auftrag #{penalty.order_id} - {penalty.reason}
                      </span>
                      <span className="font-semibold text-red-900">€{parseFloat(penalty.penalty_amount).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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

        {/* Tabs - Desktop Only */}
        <div className="border-b border-gray-200 mb-6 hidden md:block">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
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
              <span>Abgeschlossene Aufträge ({myOrders.filter(o => o.status === 'delivered' || o.status === 'completed' || o.status === 'pending_approval' || o.cancellation_status).length})</span>
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
            {myOrders.filter(o => o.status === 'delivered' || o.status === 'completed' || o.status === 'pending_approval' || o.cancellation_status).length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Keine abgeschlossenen Aufträge</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Aufträge erscheinen hier nach der Zustellung oder Stornierung
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {myOrders.filter(o => o.status === 'delivered' || o.status === 'completed' || o.status === 'pending_approval' || o.cancellation_status).map((order) => (
                  <OrderCard key={order.id} order={order} showAcceptButton={false} />
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'reports' ? (
          <ReportsSummary userRole="contractor" />
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

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <MobileBottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          counts={{
            available: availableOrders.length,
            active: myOrders.filter(o => o.status !== 'delivered' && o.status !== 'completed').length,
            bids: myBids.length
          }}
          onMenuClick={() => setShowMobileMenu(true)}
        />
      )}

      {/* Mobile Menu Modal */}
      {isMobile && (
        <MobileMenuModal
          isOpen={showMobileMenu}
          onClose={() => setShowMobileMenu(false)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          counts={{
            completed: myOrders.filter(o => o.status === 'delivered' || o.status === 'completed' || o.status === 'pending_approval' || o.cancellation_status).length
          }}
          pendingPenaltiesTotal={pendingPenaltiesTotal}
        />
      )}
    </div>
  );
};

export default ContractorDashboard;
