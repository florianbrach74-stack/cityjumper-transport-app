import { useState, useEffect } from 'react';
import { Calendar, Download, FileText, TrendingUp, Package, Clock, DollarSign, Filter } from 'lucide-react';
import axios from 'axios';

export default function ReportsSummary({ userRole }) {
  const [dateRange, setDateRange] = useState('7'); // 7, 14, 30, custom
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);

  const getDateRange = () => {
    const end = new Date();
    let start = new Date();

    if (dateRange === 'custom') {
      return {
        startDate: customStartDate,
        endDate: customEndDate
      };
    }

    const days = parseInt(dateRange);
    start.setDate(end.getDate() - days);

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  };

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/reports/summary`,
        {
          params: { startDate, endDate },
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSummary(response.data.summary);
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Error fetching summary:', error);
      alert('Fehler beim Laden der Zusammenfassung');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dateRange !== 'custom' || (customStartDate && customEndDate)) {
      fetchSummary();
    }
  }, [dateRange, customStartDate, customEndDate]);

  const handleOrderSelection = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(o => o.id));
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Auftrags-Nr', 'Datum', 'Von', 'Nach', 'Status', 'Preis', 'Wartezeit', 'Gesamt'].join(';'),
      ...orders.map(order => [
        order.id,
        new Date(order.created_at).toLocaleDateString('de-DE'),
        `${order.pickup_city}`,
        `${order.delivery_city}`,
        order.status,
        `€${parseFloat(order.price || 0).toFixed(2)}`,
        order.waiting_time_approved ? `€${parseFloat(order.waiting_time_fee || 0).toFixed(2)}` : '€0.00',
        `€${(parseFloat(order.price || 0) + (order.waiting_time_approved ? parseFloat(order.waiting_time_fee || 0) : 0)).toFixed(2)}`
      ].join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `zusammenfassung_${getDateRange().startDate}_${getDateRange().endDate}.csv`;
    link.click();
  };

  const generateBulkInvoice = async () => {
    if (selectedOrders.length === 0) {
      alert('Bitte wählen Sie mindestens einen Auftrag aus');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/reports/bulk-invoice`,
        { orderIds: selectedOrders },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Open invoice in new window or download
      console.log('Bulk invoice generated:', response.data);
      alert(`Sammelrechnung für ${selectedOrders.length} Aufträge erstellt`);
    } catch (error) {
      console.error('Error generating bulk invoice:', error);
      alert(error.response?.data?.error || 'Fehler beim Erstellen der Sammelrechnung');
    }
  };

  const formatPrice = (price) => {
    return `€${parseFloat(price || 0).toFixed(2)}`;
  };

  if (loading && !summary) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <FileText className="h-6 w-6 mr-2 text-primary-600" />
            Zusammenfassung & Abrechnung
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={exportToCSV}
              disabled={orders.length === 0}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <Download className="h-4 w-4 mr-2" />
              CSV Export
            </button>
            {userRole === 'admin' && selectedOrders.length > 0 && (
              <button
                onClick={generateBulkInvoice}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
              >
                <FileText className="h-4 w-4 mr-2" />
                Sammelrechnung ({selectedOrders.length})
              </button>
            )}
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Zeitraum:</span>
          </div>
          <div className="flex space-x-2">
            {['7', '14', '30'].map(days => (
              <button
                key={days}
                onClick={() => setDateRange(days)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  dateRange === days
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {days} Tage
              </button>
            ))}
            <button
              onClick={() => setDateRange('custom')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                dateRange === 'custom'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Benutzerdefiniert
            </button>
          </div>
        </div>

        {/* Custom Date Range */}
        {dateRange === 'custom' && (
          <div className="mt-4 flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Von</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bis</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gesamt Aufträge</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{summary.totalOrders}</p>
              </div>
              <Package className="h-10 w-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Abgeschlossen</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{summary.completedOrders}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {userRole === 'admin' ? 'Gesamtumsatz' : userRole === 'contractor' ? 'Ihre Einnahmen' : 'Ihre Kosten'}
                </p>
                <p className="text-2xl font-bold text-primary-600 mt-1">
                  {formatPrice(summary.totalRevenue)}
                </p>
              </div>
              <DollarSign className="h-10 w-10 text-primary-500" />
            </div>
          </div>

          {userRole === 'admin' && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Plattform-Provision</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {formatPrice(summary.totalPlatformCommission)}
                  </p>
                </div>
                <TrendingUp className="h-10 w-10 text-green-500" />
              </div>
            </div>
          )}

          {summary.totalWaitingTimeFees > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Wartezeit-Gebühren</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">
                    {formatPrice(summary.totalWaitingTimeFees)}
                  </p>
                </div>
                <Clock className="h-10 w-10 text-orange-500" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Aufträge ({orders.length})</h3>
          {userRole === 'admin' && orders.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {selectedOrders.length === orders.length ? 'Alle abwählen' : 'Alle auswählen'}
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {userRole === 'admin' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedOrders.length === orders.length && orders.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                )}
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
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preis
                </th>
                {userRole === 'admin' && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Auftragnehmer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Provision
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => {
                const price = parseFloat(order.price || 0);
                const contractorPrice = parseFloat(order.contractor_price || 0);
                const commission = price - contractorPrice;
                const waitingTimeFee = order.waiting_time_approved ? parseFloat(order.waiting_time_fee || 0) : 0;
                const total = price + waitingTimeFee;

                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    {userRole === 'admin' && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.id)}
                          onChange={() => handleOrderSelection(order.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{order.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>{order.pickup_city}</div>
                      <div className="text-gray-500">→ {order.delivery_city}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('de-DE')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-semibold">{formatPrice(total)}</div>
                      {waitingTimeFee > 0 && (
                        <div className="text-xs text-orange-600">
                          +{formatPrice(waitingTimeFee)} Wartezeit
                        </div>
                      )}
                    </td>
                    {userRole === 'admin' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.contractor_company || `${order.contractor_first_name || ''} ${order.contractor_last_name || ''}`.trim() || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          {formatPrice(commission)}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
