import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, ChevronDown } from 'lucide-react';
import api, { bidsAPI, verificationAPI } from '../services/api';
import AssignOrderModal from '../components/AssignOrderModal';
import CMRViewer from '../components/CMRViewer';
import CustomerManagement from '../components/CustomerManagement';
import DetailedOrderView from '../components/DetailedOrderView';
import InvoiceGenerator from '../components/InvoiceGenerator';
import AdminOrderEditModal from '../components/AdminOrderEditModal';
import PricingSettings from '../components/PricingSettings';
import ReportsSummary from '../components/ReportsSummary';
import ContractorDocumentsModal from '../components/ContractorDocumentsModal';
import CancellationModal from '../components/CancellationModal';
import BulkInvoiceModal from '../components/BulkInvoiceModal';
import InvoiceHistory from './InvoiceHistory';
import EmailTemplatesManager from '../components/EmailTemplatesManager';
import SystemMonitoring from '../components/SystemMonitoring';
import InitiateReturnModal from '../components/InitiateReturnModal';
import ProfitLossMonitoring from '../components/ProfitLossMonitoring';
import Navbar from '../components/Navbar';

export default function AdminDashboard() {
  const navigate = useNavigate();
  // Restore activeTab from localStorage
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('adminActiveTab') || 'orders';
  });
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingOrder, setEditingOrder] = useState(null);
  const [assigningOrder, setAssigningOrder] = useState(null);
  const [selectedOrderForCMR, setSelectedOrderForCMR] = useState(null);
  const [selectedOrderForBids, setSelectedOrderForBids] = useState(null);
  const [bidsForOrder, setBidsForOrder] = useState([]);
  const [bidCounts, setBidCounts] = useState({});
  const [pendingApprovalOrders, setPendingApprovalOrders] = useState([]);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState(null);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState(null);
  const [editingOrderFull, setEditingOrderFull] = useState(null);
  const [selectedContractorForDocs, setSelectedContractorForDocs] = useState(null);
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [selectedOrdersForInvoice, setSelectedOrdersForInvoice] = useState([]);
  const [showBulkInvoiceModal, setShowBulkInvoiceModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingBidId, setEditingBidId] = useState(null);
  const [editingBidAmount, setEditingBidAmount] = useState('');
  const moreMenuRef = useRef(null);
  const [editingContractor, setEditingContractor] = useState(null);
  const [contractorEditData, setContractorEditData] = useState({});

  // Save activeTab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('adminActiveTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    loadData();

    // Auto-refresh every 60 seconds
    const refreshInterval = setInterval(() => {
      loadData();
    }, 60000);

    // Click outside handler for dropdown
    const handleClickOutside = (event) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      clearInterval(refreshInterval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load main data with individual error handling
      const results = await Promise.allSettled([
        api.get('/admin/orders'),
        api.get('/admin/users'),
        api.get('/admin/stats'),
        api.get('/admin/orders/pending-approval')
      ]);
      
      // Handle orders
      if (results[0].status === 'fulfilled') {
        setOrders(results[0].value.data.orders);
      } else {
        console.error('Error loading orders:', results[0].reason);
        setOrders([]);
      }
      
      // Handle users
      if (results[1].status === 'fulfilled') {
        setUsers(results[1].value.data.users);
      } else {
        console.error('Error loading users:', results[1].reason);
        setUsers([]);
      }
      
      // Handle stats
      if (results[2].status === 'fulfilled') {
        setStats(results[2].value.data);
      } else {
        console.error('Error loading stats:', results[2].reason);
        setStats(null);
      }
      
      // Handle pending approval orders
      if (results[3].status === 'fulfilled') {
        setPendingApprovalOrders(results[3].value.data.orders);
      } else {
        console.error('Error loading pending approvals:', results[3].reason);
        setPendingApprovalOrders([]);
      }
      
      // Load bid counts in background (non-blocking)
      if (results[0].status === 'fulfilled') {
        const pendingOrders = results[0].value.data.orders.filter(o => o.status === 'pending');
        loadBidCounts(pendingOrders);
      }
      
    } catch (error) {
      console.error('Error loading admin data:', error);
      // Don't show alert on every error, just log it
    } finally {
      setLoading(false);
    }
  };
  
  const loadBidCounts = async (pendingOrders) => {
    const counts = {};
    // Load bid counts in background without blocking
    for (const order of pendingOrders) {
      try {
        const response = await bidsAPI.getBidsForOrder(order.id);
        counts[order.id] = response.data.bids.length;
        setBidCounts(prev => ({ ...prev, [order.id]: response.data.bids.length }));
      } catch (error) {
        counts[order.id] = 0;
        setBidCounts(prev => ({ ...prev, [order.id]: 0 }));
      }
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { status: newStatus });
      await loadData();
      alert('Status erfolgreich aktualisiert!');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Fehler beim Aktualisieren des Status');
    }
  };

  const deleteOrder = async (orderId) => {
    if (!confirm('Möchten Sie diesen Auftrag wirklich löschen?')) return;
    
    try {
      await api.delete(`/admin/orders/${orderId}`);
      await loadData();
      alert('Auftrag erfolgreich gelöscht!');
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Fehler beim Löschen des Auftrags');
    }
  };

  const viewBids = async (order) => {
    try {
      const response = await bidsAPI.getBidsForOrder(order.id);
      setBidsForOrder(response.data.bids);
      setSelectedOrderForBids(order);
    } catch (error) {
      console.error('Error loading bids:', error);
      alert('Fehler beim Laden der Bewerbungen');
    }
  };

  const acceptBid = async (bidId) => {
    if (!confirm('Möchten Sie diese Bewerbung wirklich akzeptieren?\n\nDer Auftrag wird dem Auftragnehmer zugewiesen.')) return;
    
    try {
      const response = await bidsAPI.acceptBid(bidId);
      
      // Check if the bid was actually accepted (status 200)
      if (response.status === 200) {
        setSelectedOrderForBids(null);
        setBidsForOrder([]);
        await loadData();
        alert('Bewerbung akzeptiert! Der Auftragnehmer wurde benachrichtigt.');
      }
    } catch (error) {
      console.error('Error accepting bid:', error);
      
      // Check if it's a network error or actual failure
      // If the error is after successful acceptance, reload data anyway
      try {
        await loadData();
        // If data loaded successfully, the bid was probably accepted
        setSelectedOrderForBids(null);
        setBidsForOrder([]);
        alert('Bewerbung wurde akzeptiert (mit Warnung: Email-Benachrichtigung könnte fehlgeschlagen sein)');
      } catch (reloadError) {
        // Real error
        alert('Fehler beim Akzeptieren der Bewerbung: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const rejectBid = async (bidId) => {
    if (!confirm('Möchten Sie diese Bewerbung wirklich ablehnen?')) return;
    
    try {
      await bidsAPI.rejectBid(bidId);
      // Refresh bids list
      const response = await bidsAPI.getBidsForOrder(selectedOrderForBids.id);
      setBidsForOrder(response.data.bids);
      alert('Bewerbung abgelehnt.');
    } catch (error) {
      console.error('Error rejecting bid:', error);
      alert('Fehler beim Ablehnen der Bewerbung');
    }
  };

  const updateBidPrice = async (bidId, newAmount) => {
    try {
      await api.patch(`/bids/${bidId}/price`, {
        bid_amount: parseFloat(newAmount)
      });
      
      // Reload bids
      if (selectedOrderForBids) {
        const bidsResponse = await bidsAPI.getBidsForOrder(selectedOrderForBids.id);
        setBidsForOrder(bidsResponse.data.bids);
      }
      
      setEditingBidId(null);
      setEditingBidAmount('');
      alert('Preis erfolgreich aktualisiert!');
    } catch (error) {
      console.error('Error updating bid price:', error);
      alert('Fehler beim Aktualisieren des Preises');
    }
  };

  const approveWaitingTime = async (orderId, approved) => {
    const message = approved 
      ? 'Möchten Sie die Wartezeit-Vergütung freigeben?' 
      : 'Möchten Sie die Wartezeit-Vergütung ablehnen?';
    
    if (!confirm(message)) return;
    
    try {
      await api.post(`/admin/orders/${orderId}/approve-waiting-time`, { approved });
      await loadData();
      alert(approved ? 'Wartezeit-Vergütung freigegeben!' : 'Wartezeit-Vergütung abgelehnt.');
    } catch (error) {
      console.error('Error approving waiting time:', error);
      alert('Fehler beim Bearbeiten der Wartezeit-Vergütung');
    }
  };

  const approveContractor = async (userId) => {
    const notes = prompt('Optional: Notizen zur Freigabe');
    if (notes === null) return; // User cancelled
    
    try {
      await verificationAPI.approveContractor(userId, notes);
      alert('Auftragnehmer erfolgreich freigegeben!');
      // Reload data after alert
      await loadData();
    } catch (error) {
      console.error('Error approving contractor:', error);
      alert('Fehler beim Freigeben: ' + (error.response?.data?.error || error.message));
    }
  };

  const rejectContractor = async (userId) => {
    const reason = prompt('Grund für die Ablehnung:');
    if (!reason) return;
    
    try {
      await verificationAPI.rejectContractor(userId, reason);
      alert('Auftragnehmer abgelehnt.');
      // Reload data after alert
      await loadData();
    } catch (error) {
      console.error('Error rejecting contractor:', error);
      alert('Fehler beim Ablehnen: ' + (error.response?.data?.error || error.message));
    }
  };

  const resetVerification = async (userId) => {
    try {
      await api.patch(`/admin/users/${userId}/reset-verification`);
      alert('Verifizierung zurückgesetzt. Der Auftragnehmer muss erneut verifiziert werden.');
      await loadData();
    } catch (error) {
      console.error('Error resetting verification:', error);
      alert('Fehler beim Zurücksetzen: ' + (error.response?.data?.error || error.message));
    }
  };

  const resetPassword = async (userId, newPassword) => {
    try {
      await api.patch(`/admin/users/${userId}/reset-password`, { newPassword });
      alert('Passwort erfolgreich zurückgesetzt!');
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('Fehler beim Zurücksetzen des Passworts: ' + (error.response?.data?.error || error.message));
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      await loadData();
      alert('Rolle erfolgreich aktualisiert!');
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Fehler beim Aktualisieren der Rolle');
    }
  };

  const updateAccountStatus = async (userId, accountStatus) => {
    try {
      await api.patch(`/admin/users/${userId}/account-status`, { account_status: accountStatus });
      await loadData();
      alert(`Account erfolgreich ${accountStatus === 'suspended' ? 'deaktiviert' : 'aktiviert'}!`);
    } catch (error) {
      console.error('Error updating account status:', error);
      alert('Fehler beim Aktualisieren des Account-Status');
    }
  };

  const viewCustomerOrders = (customerId) => {
    // Filter orders by customer
    const customerOrders = orders.filter(o => o.customer_id === customerId);
    if (customerOrders.length === 0) {
      alert('Dieser Kunde hat noch keine Aufträge');
      return;
    }
    // Switch to orders tab and highlight customer orders
    setActiveTab('orders');
    // You could add additional filtering logic here
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      in_transit: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Ausstehend',
      accepted: 'Akzeptiert',
      in_transit: 'In Transit',
      completed: 'Abgeschlossen',
      cancelled: 'Storniert'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Lade Admin-Dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <button
              onClick={() => navigate('/admin/penalties')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <DollarSign className="h-5 w-5" />
              Strafen verwalten
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600">Gesamt Aufträge</p>
              <p className="text-3xl font-bold text-gray-900">{stats.orders.total_orders}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600">Ausstehend</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.orders.pending_orders}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600">In Transit</p>
              <p className="text-3xl font-bold text-purple-600">{stats.orders.in_transit_orders}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600">Gesamt Benutzer</p>
              <p className="text-3xl font-bold text-blue-600">{stats.users.total_users}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs - Improved with Dropdown */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-4">
            {/* Main Tabs */}
            <button
              onClick={() => setActiveTab('orders')}
              className={`${
                activeTab === 'orders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-3 border-b-2 font-medium text-sm`}
            >
              Aufträge ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-3 border-b-2 font-medium text-sm`}
            >
              Benutzer ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`${
                activeTab === 'customers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-3 border-b-2 font-medium text-sm`}
            >
              Kunden ({users.filter(u => u.role === 'customer').length})
            </button>
            <button
              onClick={() => setActiveTab('contractors')}
              className={`${
                activeTab === 'contractors'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-3 border-b-2 font-medium text-sm`}
            >
              Auftragnehmer ({users.filter(u => u.role === 'contractor').length})
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`${
                activeTab === 'invoices'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-3 border-b-2 font-medium text-sm`}
            >
              📄 Rechnungen
            </button>

            <button
              onClick={() => setActiveTab('profit-loss')}
              className={`${
                activeTab === 'profit-loss'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-3 border-b-2 font-medium text-sm`}
            >
              💰 Gewinn/Verlust
            </button>
            
            {/* More Dropdown */}
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className={`${
                  ['approvals', 'pricing', 'reports', 'verifications', 'email-templates', 'monitoring'].includes(activeTab)
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-3 border-b-2 font-medium text-sm flex items-center space-x-1`}
              >
                <span>Mehr</span>
                <ChevronDown className="h-4 w-4" />
                {pendingApprovalOrders.length > 0 && (
                  <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-orange-600 rounded-full">
                    {pendingApprovalOrders.length}
                  </span>
                )}
              </button>
              
              {/* Dropdown Menu */}
              {showMoreMenu && (
                <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  <div className="py-2">
                    <button
                      onClick={() => { setActiveTab('approvals'); setShowMoreMenu(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                    >
                      <span>⏱️ Freigaben</span>
                      {pendingApprovalOrders.length > 0 && (
                        <span className="bg-orange-600 text-white text-xs rounded-full px-2 py-1">
                          {pendingApprovalOrders.length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => { setActiveTab('pricing'); setShowMoreMenu(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      💰 Preiskalkulation
                    </button>
                    <button
                      onClick={() => { setActiveTab('reports'); setShowMoreMenu(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      📊 Abrechnungen
                    </button>
                    <button
                      onClick={() => { setActiveTab('verifications'); setShowMoreMenu(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                    >
                      <span>Verifizierungen</span>
                      {users.filter(u => u.role === 'contractor' && u.verification_status === 'pending').length > 0 && (
                        <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                          {users.filter(u => u.role === 'contractor' && u.verification_status === 'pending').length}
                        </span>
                      )}
                    </button>
                    <div className="border-t border-gray-200 my-2"></div>
                    <button
                      onClick={() => { setActiveTab('email-templates'); setShowMoreMenu(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      ✉️ Email-Templates
                    </button>
                    <button
                      onClick={() => { setActiveTab('monitoring'); setShowMoreMenu(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      📊 System-Monitoring
                    </button>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'orders' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Bulk Invoice Actions */}
            {selectedOrdersForInvoice.length > 0 && (
              <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-blue-900">
                      {selectedOrdersForInvoice.length} Auftrag{selectedOrdersForInvoice.length !== 1 ? 'e' : ''} ausgewählt
                    </span>
                    <button
                      onClick={() => setSelectedOrdersForInvoice([])}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Auswahl aufheben
                    </button>
                  </div>
                  <button
                    onClick={() => setShowBulkInvoiceModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <span>📄</span>
                    <span>Sammelrechnung erstellen</span>
                  </button>
                </div>
              </div>
            )}
            
            {/* Status Filter */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Filter:</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                        statusFilter === 'all'
                          ? 'bg-primary-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      }`}
                    >
                      Alle ({orders.length})
                    </button>
                    <button
                      onClick={() => setStatusFilter('pending')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                        statusFilter === 'pending'
                          ? 'bg-yellow-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      }`}
                    >
                      🟡 Offen ({orders.filter(o => o.status === 'pending').length})
                    </button>
                    <button
                      onClick={() => setStatusFilter('accepted')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                        statusFilter === 'accepted'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      }`}
                    >
                      🔵 Akzeptiert ({orders.filter(o => o.status === 'accepted').length})
                    </button>
                    <button
                      onClick={() => setStatusFilter('in_transit')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                        statusFilter === 'in_transit'
                          ? 'bg-purple-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      }`}
                    >
                      🟣 Unterwegs ({orders.filter(o => o.status === 'in_transit' || o.status === 'picked_up').length})
                    </button>
                    <button
                      onClick={() => setStatusFilter('delivered')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                        statusFilter === 'delivered'
                          ? 'bg-green-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      }`}
                    >
                      🟢 Zugestellt ({orders.filter(o => o.status === 'delivered').length})
                    </button>
                    <button
                      onClick={() => setStatusFilter('completed')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                        statusFilter === 'completed'
                          ? 'bg-green-700 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      }`}
                    >
                      ✅ Abgeschlossen ({orders.filter(o => o.status === 'completed').length})
                    </button>
                    <button
                      onClick={() => setStatusFilter('cancelled')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                        statusFilter === 'cancelled'
                          ? 'bg-red-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      }`}
                    >
                      🔴 Storniert ({orders.filter(o => o.cancellation_status).length})
                    </button>
                  </div>
                </div>
                {statusFilter !== 'all' && (
                  <button
                    onClick={() => setStatusFilter('all')}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    ✕ Filter zurücksetzen
                  </button>
                )}
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <input
                        type="checkbox"
                        checked={selectedOrdersForInvoice.length === orders.filter(o => o.status === 'completed').length && orders.filter(o => o.status === 'completed').length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOrdersForInvoice(orders.filter(o => o.status === 'completed').map(o => o.id));
                          } else {
                            setSelectedOrdersForInvoice([]);
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kunde</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Auftragnehmer</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preis</th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders
                    .filter(order => {
                      if (statusFilter === 'all') return true;
                      if (statusFilter === 'pending') return order.status === 'pending';
                      if (statusFilter === 'accepted') return order.status === 'accepted';
                      if (statusFilter === 'in_transit') return order.status === 'in_transit' || order.status === 'picked_up';
                      if (statusFilter === 'delivered') return order.status === 'delivered';
                      if (statusFilter === 'completed') return order.status === 'completed';
                      if (statusFilter === 'cancelled') return order.cancellation_status !== null;
                      return true;
                    })
                    .map((order) => (
                    <tr key={order.id} className={selectedOrdersForInvoice.includes(order.id) ? 'bg-blue-50' : ''}>
                      <td className="px-3 py-3 whitespace-nowrap text-sm">
                        {order.status === 'completed' && (
                          <input
                            type="checkbox"
                            checked={selectedOrdersForInvoice.includes(order.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedOrdersForInvoice([...selectedOrdersForInvoice, order.id]);
                              } else {
                                setSelectedOrdersForInvoice(selectedOrdersForInvoice.filter(id => id !== order.id));
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <span>#{order.id}</span>
                          {order.legal_delivery && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800" title="Rechtssichere Zustellung">
                              ⚖️
                            </span>
                          )}
                          {order.needs_loading_help && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800" title="Beladehilfe">
                              📦
                            </span>
                          )}
                          {order.needs_unloading_help && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800" title="Entladehilfe">
                              📤
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-900">
                        <div className="max-w-[120px] truncate" title={`${order.customer_first_name} ${order.customer_last_name}`}>
                          {order.customer_first_name} {order.customer_last_name}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-900">
                        <div className="max-w-[120px] truncate" title={order.contractor_first_name ? `${order.contractor_first_name} ${order.contractor_last_name}` : '-'}>
                          {order.contractor_first_name ? `${order.contractor_first_name} ${order.contractor_last_name}` : '-'}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-900">
                        {order.pickup_city} → {order.delivery_city}
                        {(() => {
                          const deliveryStops = order.delivery_stops 
                            ? (typeof order.delivery_stops === 'string' ? JSON.parse(order.delivery_stops) : order.delivery_stops)
                            : [];
                          const pickupStops = order.pickup_stops
                            ? (typeof order.pickup_stops === 'string' ? JSON.parse(order.pickup_stops) : order.pickup_stops)
                            : [];
                          const hasMultiStop = pickupStops.length > 0 || deliveryStops.length > 0;
                          
                          return hasMultiStop && (
                            <div className="mt-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                🚚 {pickupStops.length + deliveryStops.length + 2} Stops
                              </span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-center">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}
                        >
                          <option value="pending">Ausstehend</option>
                          <option value="accepted">Akzeptiert</option>
                          <option value="in_transit">In Transit</option>
                          <option value="completed">Abgeschlossen</option>
                          <option value="cancelled">Storniert</option>
                        </select>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center space-x-2">
                            <div className="font-semibold text-blue-600" title="Kundenpreis">
                              👤 €{order.price || '-'}
                            </div>
                            {order.price_updated_at && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300" title={`Preis erhöht am ${new Date(order.price_updated_at).toLocaleString('de-DE')}`}>
                                ⬆️ ERHÖHT
                              </span>
                            )}
                          </div>
                          {order.price_updated_at && order.minimum_price_at_creation && (
                            <div className="text-xs text-gray-500">
                              Ursprünglich: €{parseFloat(order.minimum_price_at_creation).toFixed(2)} → Erhöht um €{(parseFloat(order.price) - parseFloat(order.minimum_price_at_creation)).toFixed(2)}
                            </div>
                          )}
                          <div className="text-xs text-gray-600" title="Auftragnehmer-Preis (85%)">
                            🚚 €{order.contractor_price || (order.price * 0.85).toFixed(2)}
                            {order.cancellation_status === 'cancelled_by_customer' && order.cancellation_fee_percentage && (
                              <span className="ml-2 text-amber-700">({order.cancellation_fee_percentage}% Stornogebühr)</span>
                            )}
                          </div>
                          <div className="text-xs text-green-600 font-medium" title="Plattform-Provision (15%)">
                            💰 €{((order.price || 0) * 0.15).toFixed(2)}
                          </div>
                          
                          {/* Retouren-Info */}
                          {order.return_status && order.return_status !== 'none' && order.return_fee && parseFloat(order.return_fee) > 0 && (
                            <div className="mt-2 text-xs bg-orange-50 border border-orange-200 rounded p-2">
                              <div className="font-semibold text-orange-900 flex items-center">
                                🔄 Retoure
                                {order.return_status === 'pending' && <span className="ml-2 text-orange-600">⏳ Läuft</span>}
                                {order.return_status === 'completed' && <span className="ml-2 text-green-600">✓ Abgeschlossen</span>}
                              </div>
                              <div className="text-orange-700 font-bold mt-1">
                                +€{parseFloat(order.return_fee).toFixed(2)}
                              </div>
                              <div className="text-gray-600 mt-1">
                                {order.return_reason}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm">
                        <div className="flex flex-col space-y-1 min-w-[140px]">
                          <button
                            onClick={() => setSelectedOrderForDetails(order.id)}
                            className="text-primary-600 hover:text-primary-900 font-medium text-left"
                          >
                            📋 Details ansehen
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const response = await api.get(`/admin/orders/${order.id}/details`);
                                setEditingOrderFull(response.data.order);
                              } catch (error) {
                                alert('Fehler beim Laden der Auftragsdaten');
                              }
                            }}
                            className="text-blue-600 hover:text-blue-900 font-medium text-left"
                          >
                            ✏️ Bearbeiten
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const response = await api.get(`/admin/orders/${order.id}/details`);
                                setSelectedOrderForInvoice(response.data.order);
                              } catch (error) {
                                alert('Fehler beim Laden der Auftragsdaten');
                              }
                            }}
                            className="text-green-600 hover:text-green-900 font-medium text-left"
                          >
                            🧾 Rechnung erstellen
                          </button>
                          {(order.status === 'accepted' || order.status === 'picked_up' || order.status === 'in_transit' || order.status === 'delivered') && 
                           (!order.return_status || order.return_status === 'none') && (
                            <button
                              onClick={async () => {
                                try {
                                  const response = await api.get(`/admin/orders/${order.id}/details`);
                                  setSelectedOrderForReturn(response.data.order);
                                } catch (error) {
                                  alert('Fehler beim Laden der Auftragsdaten');
                                }
                              }}
                              className="text-orange-600 hover:text-orange-900 font-medium text-left"
                            >
                              🔄 Retoure starten
                            </button>
                          )}
                          {order.return_status === 'pending' && (
                            <button
                              onClick={async () => {
                                if (confirm('Retoure als abgeschlossen markieren?')) {
                                  try {
                                    await api.post(`/admin/orders/${order.id}/complete-return`);
                                    alert('Retoure abgeschlossen!');
                                    loadData();
                                  } catch (error) {
                                    alert('Fehler: ' + (error.response?.data?.error || error.message));
                                  }
                                }
                              }}
                              className="text-green-600 hover:text-green-900 font-medium text-left"
                            >
                              ✅ Retoure abschließen
                            </button>
                          )}
                          {order.status !== 'cancelled' && !order.cancellation_status && (
                            <button
                              onClick={async () => {
                                try {
                                  const response = await api.get(`/admin/orders/${order.id}/details`);
                                  setCancellingOrder(response.data.order);
                                } catch (error) {
                                  alert('Fehler beim Laden der Auftragsdaten');
                                }
                              }}
                              className="text-red-600 hover:text-red-900 font-medium text-left"
                            >
                              ❌ Stornieren
                            </button>
                          )}
                          <div className="flex space-x-2 pt-1">
                            {order.status === 'pending' && (
                              <button
                                onClick={() => viewBids(order)}
                                className="text-blue-600 hover:text-blue-900 font-medium flex items-center space-x-1"
                              >
                                <span>Bewerbungen</span>
                                {bidCounts[order.id] > 0 && (
                                  <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                                    {bidCounts[order.id]}
                                  </span>
                                )}
                              </button>
                            )}
                            {!order.contractor_id && order.status === 'pending' && (
                              <button
                                onClick={() => setAssigningOrder(order)}
                                className="text-green-600 hover:text-green-900 font-medium"
                              >
                                Zuweisen
                              </button>
                            )}
                            {order.contractor_id && (
                              <button
                                onClick={() => setSelectedOrderForCMR(order.id)}
                                className="text-purple-600 hover:text-purple-900 font-medium"
                              >
                                CMR
                              </button>
                            )}
                          </div>
                          <button
                            onClick={() => deleteOrder(order.id)}
                            className="text-red-600 hover:text-red-900 text-left text-xs"
                          >
                            Löschen
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Firma</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rolle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registriert</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{user.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{user.first_name} {user.last_name}</div>
                          {user.phone && <div className="text-xs text-gray-500">{user.phone}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {user.company_name ? (
                          <div>
                            <div className="font-medium">{user.company_name}</div>
                            {user.company_address && (
                              <div className="text-xs text-gray-500 mt-1">
                                📍 {user.company_address}<br/>
                                {user.company_postal_code} {user.company_city}
                              </div>
                            )}
                            {(user.tax_id || user.vat_id) && (
                              <div className="text-xs text-gray-500 mt-1">
                                {user.tax_id && <div>Steuer-Nr: {user.tax_id}</div>}
                                {user.vat_id && <div>USt-ID: {user.vat_id}</div>}
                              </div>
                            )}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.role}
                          onChange={(e) => updateUserRole(user.id, e.target.value)}
                          className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800"
                        >
                          <option value="customer">Kunde</option>
                          <option value="contractor">Auftragnehmer</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString('de-DE')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <CustomerManagement
            users={users}
            orders={orders}
            onUpdateAccountStatus={updateAccountStatus}
            onViewOrderDetails={setSelectedOrderForDetails}
            onReload={loadData}
          />
        )}

        {/* Pricing Settings Tab */}
        {activeTab === 'pricing' && (
          <PricingSettings />
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <ReportsSummary userRole="admin" />
        )}

        {/* All Contractors Tab */}
        {activeTab === 'contractors' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Alle Auftragnehmer</h2>
              {users.filter(u => u.role === 'contractor').length === 0 ? (
                <p className="text-gray-500 text-center py-8">Keine Auftragnehmer</p>
              ) : (
                <div className="space-y-4">
                  {users.filter(u => u.role === 'contractor').map((user) => (
                    <div key={user.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {user.company_name || `${user.first_name} ${user.last_name}`}
                          </h3>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          {user.phone && <p className="text-sm text-gray-600">{user.phone}</p>}
                          <p className="text-xs text-gray-500 mt-1">
                            Registriert: {new Date(user.created_at).toLocaleDateString('de-DE')}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.verification_status === 'approved' ? 'bg-green-100 text-green-800' :
                          user.verification_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          user.verification_status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.verification_status === 'approved' ? '✓ Verifiziert' :
                           user.verification_status === 'pending' ? '⏳ Ausstehend' :
                           user.verification_status === 'rejected' ? '✗ Abgelehnt' : '○ Nicht eingereicht'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                        {user.verified_at && (
                          <div>
                            <p className="text-xs text-gray-500">Verifiziert am</p>
                            <p className="font-medium">{new Date(user.verified_at).toLocaleDateString('de-DE')}</p>
                          </div>
                        )}
                        {user.verification_notes && (
                          <div>
                            <p className="text-xs text-gray-500">Notizen</p>
                            <p className="font-medium">{user.verification_notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 mt-4">
                        <button
                          onClick={() => {
                            setEditingContractor(user.id);
                            setContractorEditData({
                              company_name: user.company_name || '',
                              company_address: user.company_address || '',
                              company_postal_code: user.company_postal_code || '',
                              company_city: user.company_city || '',
                              tax_id: user.tax_id || '',
                              vat_id: user.vat_id || ''
                            });
                          }}
                          className="px-3 py-1.5 bg-teal-600 text-white rounded text-sm hover:bg-teal-700"
                        >
                          ✏️ Firmendaten bearbeiten
                        </button>
                        {user.verification_status !== 'approved' && (
                          <button
                            onClick={() => approveContractor(user.id)}
                            className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                          >
                            ✓ Freigeben
                          </button>
                        )}
                        {user.verification_status === 'approved' && (
                          <button
                            onClick={() => resetVerification(user.id)}
                            className="px-3 py-1.5 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                          >
                            🔄 Zurücksetzen
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const newPassword = prompt('Neues Passwort für ' + user.email + ':');
                            if (newPassword) {
                              resetPassword(user.id, newPassword);
                            }
                          }}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          🔑 Passwort zurücksetzen
                        </button>
                        <button
                          onClick={() => window.open(`/admin/contractor/${user.id}/orders`, '_blank')}
                          className="px-3 py-1.5 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                        >
                          📦 Aufträge ansehen
                        </button>
                        <button
                          onClick={() => setSelectedContractorForDocs(user)}
                          className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
                        >
                          📄 Dokumente ansehen
                        </button>
                        {user.verification_status !== 'rejected' && (
                          <button
                            onClick={() => rejectContractor(user.id)}
                            className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                          >
                            ✗ Ablehnen
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'approvals' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">⏱️ Wartezeit-Freigaben</h2>
              {pendingApprovalOrders.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Keine ausstehenden Freigaben</p>
              ) : (
                <div className="space-y-4">
                  {pendingApprovalOrders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4 bg-orange-50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Auftrag #{order.id}: {order.pickup_city} → {order.delivery_city}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Auftragnehmer: {order.contractor_company_name || `${order.contractor_first_name} ${order.contractor_last_name}`}
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          Wartet auf Freigabe
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-white p-3 rounded">
                          <p className="text-xs text-gray-500">Wartezeit Abholung</p>
                          <p className="text-lg font-semibold">{order.pickup_waiting_minutes || 0} Min.</p>
                        </div>
                        <div className="bg-white p-3 rounded">
                          <p className="text-xs text-gray-500">Wartezeit Zustellung</p>
                          <p className="text-lg font-semibold">{order.delivery_waiting_minutes || 0} Min.</p>
                        </div>
                        <div className="bg-white p-3 rounded">
                          <p className="text-xs text-gray-500">Gesamt Wartezeit</p>
                          <p className="text-lg font-semibold text-orange-600">
                            {(order.pickup_waiting_minutes || 0) + (order.delivery_waiting_minutes || 0)} Min.
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded">
                          <p className="text-xs text-gray-500">Berechnete Vergütung</p>
                          <p className="text-lg font-semibold text-green-600">€{order.waiting_time_fee}</p>
                        </div>
                      </div>

                      {(order.pickup_waiting_notes || order.delivery_waiting_notes || order.waiting_time_notes) && (
                        <div className="bg-white p-3 rounded mb-4 space-y-2">
                          {order.pickup_waiting_notes && order.pickup_waiting_minutes > 0 && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Begründung Abholung:</p>
                              <p className="text-sm text-gray-700 whitespace-pre-line">{order.pickup_waiting_notes}</p>
                            </div>
                          )}
                          {order.delivery_waiting_notes && order.delivery_waiting_minutes > 0 && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Begründung Zustellung:</p>
                              <p className="text-sm text-gray-700 whitespace-pre-line">{order.delivery_waiting_notes}</p>
                            </div>
                          )}
                          {/* Fallback for old data format */}
                          {!order.pickup_waiting_notes && !order.delivery_waiting_notes && order.waiting_time_notes && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Begründung:</p>
                              <p className="text-sm text-gray-700 whitespace-pre-line">{order.waiting_time_notes}</p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex space-x-3">
                        <button
                          onClick={() => approveWaitingTime(order.id, true)}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                        >
                          ✓ Freigeben (€{order.waiting_time_fee})
                        </button>
                        <button
                          onClick={() => approveWaitingTime(order.id, false)}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                        >
                          ✗ Ablehnen
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'verifications' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Ausstehende Verifizierungen</h2>
              {users.filter(u => u.role === 'contractor' && u.verification_status === 'pending').length === 0 ? (
                <p className="text-gray-500 text-center py-8">Keine ausstehenden Verifizierungen</p>
              ) : (
                <div className="space-y-4">
                  {users.filter(u => u.role === 'contractor' && u.verification_status !== 'approved').map((user) => (
                    <div key={user.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {user.company_name || `${user.first_name} ${user.last_name}`}
                          </h3>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.verification_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          user.verification_status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.verification_status === 'pending' ? 'Ausstehend' :
                           user.verification_status === 'rejected' ? 'Abgelehnt' : 'Nicht eingereicht'}
                        </span>
                      </div>

                      {user.insurance_document_url && user.business_license_url ? (
                        <>
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Transportversicherung</p>
                              <button
                                onClick={() => {
                                  const win = window.open();
                                  win.document.write(`<iframe src="${user.insurance_document_url}" width="100%" height="100%" style="border:none;"></iframe>`);
                                }}
                                className="text-sm text-blue-600 hover:text-blue-700 underline cursor-pointer"
                              >
                                Dokument ansehen
                              </button>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Gewerbeanmeldung</p>
                              <button
                                onClick={() => {
                                  const win = window.open();
                                  win.document.write(`<iframe src="${user.business_license_url}" width="100%" height="100%" style="border:none;"></iframe>`);
                                }}
                                className="text-sm text-blue-600 hover:text-blue-700 underline cursor-pointer"
                              >
                                Dokument ansehen
                              </button>
                            </div>
                          </div>

                          <div className="mb-3">
                            <p className="text-xs text-gray-500 mb-1">Mindestlohngesetz-Erklärung</p>
                            <p className="text-sm">
                              {user.minimum_wage_declaration_signed ? (
                                <span className="text-green-600">✓ Unterschrieben am {new Date(user.minimum_wage_signed_at).toLocaleDateString('de-DE')}</span>
                              ) : (
                                <span className="text-red-600">✗ Nicht unterschrieben</span>
                              )}
                            </p>
                          </div>

                          {user.verification_status === 'pending' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => approveContractor(user.id)}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                              >
                                ✓ Freigeben
                              </button>
                              <button
                                onClick={() => rejectContractor(user.id)}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                              >
                                ✗ Ablehnen
                              </button>
                            </div>
                          )}

                          {user.verification_notes && (
                            <div className="mt-3 bg-gray-50 p-3 rounded">
                              <p className="text-xs text-gray-500 mb-1">Notizen</p>
                              <p className="text-sm text-gray-700">{user.verification_notes}</p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div>
                          <p className="text-sm text-gray-500 mb-3">Noch keine Dokumente hochgeladen</p>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => approveContractor(user.id)}
                              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                            >
                              ✓ Manuell freigeben
                            </button>
                            <button
                              onClick={() => rejectContractor(user.id)}
                              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                            >
                              ✗ Ablehnen
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Invoice History Tab */}
        {activeTab === 'invoices' && (
          <InvoiceHistory />
        )}

        {/* Email Templates Tab */}
        {activeTab === 'email-templates' && (
          <EmailTemplatesManager />
        )}

        {/* Profit/Loss Monitoring Tab */}
        {activeTab === 'profit-loss' && (
          <ProfitLossMonitoring />
        )}

        {/* System Monitoring Tab */}
        {activeTab === 'monitoring' && (
          <SystemMonitoring />
        )}

      </div>

      {/* Bids Modal */}
      {selectedOrderForBids && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Bewerbungen für Auftrag #{selectedOrderForBids.id}
                </h3>
                <p className="text-sm text-gray-600">
                  {selectedOrderForBids.pickup_city} → {selectedOrderForBids.delivery_city} | Kundenpreis: €{selectedOrderForBids.price}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedOrderForBids(null);
                  setBidsForOrder([]);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div className="p-6">
              {bidsForOrder.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Noch keine Bewerbungen für diesen Auftrag.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bidsForOrder.map((bid) => (
                    <div key={bid.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {bid.contractor_company || `${bid.contractor_first_name} ${bid.contractor_last_name}`}
                          </h4>
                          <p className="text-sm text-gray-600">{bid.contractor_email}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Beworben am: {new Date(bid.created_at).toLocaleString('de-DE')}
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

                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Gebotener Preis</p>
                          {editingBidId === bid.id ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                step="0.01"
                                value={editingBidAmount}
                                onChange={(e) => setEditingBidAmount(e.target.value)}
                                className="w-24 px-2 py-1 border rounded text-sm"
                                placeholder="Preis"
                                autoFocus
                              />
                              <button
                                onClick={() => updateBidPrice(bid.id, editingBidAmount)}
                                className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                title="Speichern"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => {
                                  setEditingBidId(null);
                                  setEditingBidAmount('');
                                }}
                                className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500"
                                title="Abbrechen"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <p className="text-lg font-bold text-primary-600">€{bid.bid_amount}</p>
                              {bid.status === 'pending' && selectedOrderForBids.status === 'pending' && (
                                <button
                                  onClick={() => {
                                    setEditingBidId(bid.id);
                                    setEditingBidAmount(bid.bid_amount);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-xs"
                                  title="Preis bearbeiten (nur für unvermittelte Aufträge)"
                                >
                                  ✏️
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Ihre Marge</p>
                          <p className="text-lg font-bold text-green-600">
                            €{(selectedOrderForBids.price - (editingBidId === bid.id && editingBidAmount ? parseFloat(editingBidAmount) : bid.bid_amount)).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Marge %</p>
                          <p className="text-lg font-bold text-gray-700">
                            {((selectedOrderForBids.price - (editingBidId === bid.id && editingBidAmount ? parseFloat(editingBidAmount) : bid.bid_amount)) / selectedOrderForBids.price * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      {bid.message && (
                        <div className="bg-gray-50 p-3 rounded mb-3">
                          <p className="text-xs text-gray-500 mb-1">Nachricht:</p>
                          <p className="text-sm text-gray-700">{bid.message}</p>
                        </div>
                      )}

                      {bid.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => acceptBid(bid.id)}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                          >
                            Akzeptieren
                          </button>
                          <button
                            onClick={() => rejectBid(bid.id)}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                          >
                            Ablehnen
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CMR Viewer Modal */}
      {selectedOrderForCMR && (
        <CMRViewer
          orderId={selectedOrderForCMR}
          onClose={() => setSelectedOrderForCMR(null)}
        />
      )}

      {/* Assign Order Modal */}
      {assigningOrder && (
        <AssignOrderModal
          order={assigningOrder}
          onClose={() => setAssigningOrder(null)}
          onSuccess={() => {
            setAssigningOrder(null);
            loadData();
          }}
        />
      )}

      {/* Detailed Order View Modal */}
      {selectedOrderForDetails && (
        <DetailedOrderView
          orderId={selectedOrderForDetails}
          onClose={() => setSelectedOrderForDetails(null)}
        />
      )}

      {/* Invoice Generator Modal */}
      {selectedOrderForInvoice && (
        <InvoiceGenerator
          order={selectedOrderForInvoice}
          onClose={() => setSelectedOrderForInvoice(null)}
        />
      )}

      {/* Admin Order Edit Modal */}
      {editingOrderFull && (
        <AdminOrderEditModal
          order={editingOrderFull}
          onClose={() => setEditingOrderFull(null)}
          onSuccess={() => {
            setEditingOrderFull(null);
            loadData();
          }}
        />
      )}

      {/* Contractor Documents Modal */}
      {selectedContractorForDocs && (
        <ContractorDocumentsModal
          contractor={selectedContractorForDocs}
          onClose={() => setSelectedContractorForDocs(null)}
        />
      )}

      {/* Cancellation Modal */}
      {cancellingOrder && (
        <CancellationModal
          order={cancellingOrder}
          userRole="admin"
          onClose={() => setCancellingOrder(null)}
          onSuccess={() => {
            setCancellingOrder(null);
            loadData();
            alert('Auftrag erfolgreich storniert!');
          }}
        />
      )}

      {/* Initiate Return Modal */}
      {selectedOrderForReturn && (
        <InitiateReturnModal
          order={selectedOrderForReturn}
          onClose={() => setSelectedOrderForReturn(null)}
          onSuccess={() => {
            setSelectedOrderForReturn(null);
            loadData();
          }}
        />
      )}

      {/* Bulk Invoice Modal */}
      {showBulkInvoiceModal && selectedOrdersForInvoice.length > 0 && (
        <BulkInvoiceModal
          orders={orders.filter(o => selectedOrdersForInvoice.includes(o.id))}
          onClose={() => setShowBulkInvoiceModal(false)}
          onSuccess={(invoice) => {
            setShowBulkInvoiceModal(false);
            setSelectedOrdersForInvoice([]);
            loadData();
            // Open PDF in new tab
            window.open(`${process.env.REACT_APP_API_URL}/invoices/${invoice.id}/pdf`, '_blank');
          }}
        />
      )}

      {/* Contractor Edit Modal */}
      {editingContractor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Firmendaten bearbeiten</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Firmenname
                  </label>
                  <input
                    type="text"
                    value={contractorEditData.company_name}
                    onChange={(e) => setContractorEditData({ ...contractorEditData, company_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    placeholder="z.B. FB Transporte GmbH"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Firmenadresse
                  </label>
                  <input
                    type="text"
                    value={contractorEditData.company_address}
                    onChange={(e) => setContractorEditData({ ...contractorEditData, company_address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    placeholder="Straße und Hausnummer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PLZ
                    </label>
                    <input
                      type="text"
                      value={contractorEditData.company_postal_code}
                      onChange={(e) => setContractorEditData({ ...contractorEditData, company_postal_code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      placeholder="01234"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stadt
                    </label>
                    <input
                      type="text"
                      value={contractorEditData.company_city}
                      onChange={(e) => setContractorEditData({ ...contractorEditData, company_city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      placeholder="Dresden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Steuernummer (optional)
                    </label>
                    <input
                      type="text"
                      value={contractorEditData.tax_id}
                      onChange={(e) => setContractorEditData({ ...contractorEditData, tax_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      placeholder="123/456/789"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      USt-IdNr. (optional)
                    </label>
                    <input
                      type="text"
                      value={contractorEditData.vat_id}
                      onChange={(e) => setContractorEditData({ ...contractorEditData, vat_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                      placeholder="DE123456789"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    💡 Tipp: Felder können einzeln oder alle zusammen ausgefüllt werden. Leere Felder werden nicht gespeichert.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setEditingContractor(null);
                    setContractorEditData({});
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Abbrechen
                </button>
                <button
                  onClick={async () => {
                    try {
                      await api.patch(`/admin/users/${editingContractor}/profile`, contractorEditData);
                      alert('✅ Firmendaten erfolgreich aktualisiert!');
                      setEditingContractor(null);
                      setContractorEditData({});
                      loadData();
                    } catch (err) {
                      alert('❌ Fehler: ' + (err.response?.data?.error || err.message));
                    }
                  }}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  Speichern
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
