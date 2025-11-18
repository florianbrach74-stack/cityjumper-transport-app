import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { AlertCircle, CheckCircle, XCircle, DollarSign, Calendar, User, FileText } from 'lucide-react';

const AdminPenalties = () => {
  const [penalties, setPenalties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, paid, waived, deducted
  const [totals, setTotals] = useState({});
  const [selectedPenalty, setSelectedPenalty] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    fetchPenalties();
  }, [filter]);

  const fetchPenalties = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = filter === 'all' 
        ? `${import.meta.env.VITE_API_URL}/api/penalties`
        : `${import.meta.env.VITE_API_URL}/api/penalties?status=${filter}`;
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPenalties(response.data.penalties);
      setTotals(response.data.totals);
    } catch (error) {
      console.error('Error fetching penalties:', error);
      alert('Fehler beim Laden der Strafen');
    } finally {
      setLoading(false);
    }
  };

  const updatePenaltyStatus = async (penaltyId, status, notes) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/penalties/${penaltyId}`,
        { status, notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert(`Strafe als ${status} markiert`);
      setShowUpdateModal(false);
      setSelectedPenalty(null);
      fetchPenalties();
    } catch (error) {
      console.error('Error updating penalty:', error);
      alert('Fehler beim Aktualisieren der Strafe');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: 'Ausstehend', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
      paid: { label: 'Bezahlt', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      waived: { label: 'Erlassen', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      deducted: { label: 'Abgezogen', color: 'bg-purple-100 text-purple-800', icon: CheckCircle }
    };
    
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.label}
      </span>
    );
  };

  const getCancellationTypeBadge = (type) => {
    if (type === 'free') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Höhere Gewalt
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Kostenpflichtig
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Auftragnehmer-Strafen</h1>
          <p className="text-gray-600 mt-2">Verwaltung aller Stornierungsgebühren und Strafen</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Gesamt</div>
            <div className="text-2xl font-bold text-gray-900">€{(totals.total || 0).toFixed(2)}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-4">
            <div className="text-sm text-yellow-800">Ausstehend</div>
            <div className="text-2xl font-bold text-yellow-900">€{(totals.pending || 0).toFixed(2)}</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4">
            <div className="text-sm text-green-800">Bezahlt</div>
            <div className="text-2xl font-bold text-green-900">€{(totals.paid || 0).toFixed(2)}</div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-4">
            <div className="text-sm text-blue-800">Erlassen</div>
            <div className="text-2xl font-bold text-blue-900">€{(totals.waived || 0).toFixed(2)}</div>
          </div>
          <div className="bg-purple-50 rounded-lg shadow p-4">
            <div className="text-sm text-purple-800">Abgezogen</div>
            <div className="text-2xl font-bold text-purple-900">€{(totals.deducted || 0).toFixed(2)}</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {['all', 'pending', 'paid', 'waived', 'deducted'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    filter === tab
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab === 'all' ? 'Alle' : 
                   tab === 'pending' ? 'Ausstehend' :
                   tab === 'paid' ? 'Bezahlt' :
                   tab === 'waived' ? 'Erlassen' : 'Abgezogen'}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Penalties Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Lädt...</div>
          ) : penalties.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Keine Strafen gefunden</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Auftragnehmer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Auftrag</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Betrag</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Typ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {penalties.map((penalty) => (
                    <tr key={penalty.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        #{penalty.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {penalty.first_name} {penalty.last_name}
                            </div>
                            <div className="text-xs text-gray-500">{penalty.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">#{penalty.order_id}</div>
                        <div className="text-xs text-gray-500">
                          {penalty.pickup_city} → {penalty.delivery_city}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-lg font-bold text-red-600">
                          <DollarSign className="h-4 w-4" />
                          {parseFloat(penalty.penalty_amount).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getCancellationTypeBadge(penalty.cancellation_type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(penalty.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(penalty.created_at).toLocaleDateString('de-DE')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {penalty.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedPenalty(penalty);
                                setShowUpdateModal(true);
                              }}
                              className="text-primary-600 hover:text-primary-900 font-medium"
                            >
                              Bearbeiten
                            </button>
                          </div>
                        )}
                        {penalty.status !== 'pending' && (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Update Modal */}
      {showUpdateModal && selectedPenalty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Strafe bearbeiten
              </h3>
              
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Auftragnehmer</div>
                <div className="font-medium">{selectedPenalty.first_name} {selectedPenalty.last_name}</div>
                <div className="text-sm text-gray-600 mt-2">Betrag</div>
                <div className="text-xl font-bold text-red-600">€{parseFloat(selectedPenalty.penalty_amount).toFixed(2)}</div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => updatePenaltyStatus(selectedPenalty.id, 'paid', 'Als bezahlt markiert')}
                  className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Als bezahlt markieren
                </button>
                
                <button
                  onClick={() => updatePenaltyStatus(selectedPenalty.id, 'waived', 'Strafe erlassen')}
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Strafe erlassen
                </button>
                
                <button
                  onClick={() => {
                    setShowUpdateModal(false);
                    setSelectedPenalty(null);
                  }}
                  className="w-full flex items-center justify-center px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  <XCircle className="h-5 w-5 mr-2" />
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPenalties;
