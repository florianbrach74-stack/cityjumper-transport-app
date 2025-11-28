import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Calendar, Filter } from 'lucide-react';
import api from '../utils/api';

export default function ProfitLossMonitoring() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, profit, loss
  const [selectedCustomer, setSelectedCustomer] = useState('all');
  const [selectedContractor, setSelectedContractor] = useState('all');

  useEffect(() => {
    // Set default date range (last 30 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchData();
    }
  }, [startDate, endDate]);

  const setQuickDateRange = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reports/profit-loss', {
        params: { startDate, endDate }
      });
      setData(response.data);
    } catch (error) {
      console.error('Error fetching profit/loss data:', error);
      alert('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = data?.orders.filter(order => {
    // Filter by profit/loss
    if (filterType === 'profit' && !order.isProfitable) return false;
    if (filterType === 'loss' && order.isProfitable) return false;
    
    // Filter by customer
    if (selectedCustomer !== 'all' && order.customer !== selectedCustomer) return false;
    
    // Filter by contractor
    if (selectedContractor !== 'all' && order.contractor !== selectedContractor) return false;
    
    return true;
  }) || [];

  // Get unique customers and contractors
  const customers = [...new Set(data?.orders.map(o => o.customer) || [])];
  const contractors = [...new Set(data?.orders.map(o => o.contractor) || [])];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Lade Daten...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Keine Daten verfügbar</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">📊 Gewinn/Verlust Monitoring</h2>
      </div>

      {/* Quick Date Filters */}
      <div className="flex items-center space-x-3">
        <span className="text-sm text-gray-600 font-medium">Zeitraum:</span>
        <button
          onClick={() => setQuickDateRange(7)}
          className="px-4 py-2 text-sm rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
        >
          7 Tage
        </button>
        <button
          onClick={() => setQuickDateRange(14)}
          className="px-4 py-2 text-sm rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
        >
          14 Tage
        </button>
        <button
          onClick={() => setQuickDateRange(30)}
          className="px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white"
        >
          30 Tage
        </button>
        <div className="flex items-center space-x-2 ml-4">
          <Calendar className="h-5 w-5 text-gray-400" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <span className="text-gray-500">bis</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Gesamtumsatz</p>
              <p className="text-2xl font-bold text-gray-900">€{data.totals.totalRevenue}</p>
            </div>
            <DollarSign className="h-10 w-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rabatte/Skonto</p>
              <p className="text-2xl font-bold text-orange-600">-€{data.totals.totalDiscounts}</p>
            </div>
            <AlertCircle className="h-10 w-10 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Gesamtkosten</p>
              <p className="text-2xl font-bold text-red-600">€{data.totals.totalCosts}</p>
            </div>
            <TrendingDown className="h-10 w-10 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Gewinn/Verlust</p>
              <p className={`text-2xl font-bold ${parseFloat(data.totals.totalProfit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                €{data.totals.totalProfit}
              </p>
              <p className="text-xs text-gray-500 mt-1">Marge: {data.totals.overallMargin}%</p>
            </div>
            {parseFloat(data.totals.totalProfit) >= 0 ? (
              <TrendingUp className="h-10 w-10 text-green-500" />
            ) : (
              <TrendingDown className="h-10 w-10 text-red-500" />
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold text-gray-900">{data.totals.totalOrders}</p>
            <p className="text-sm text-gray-600">Gesamt Aufträge</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-green-600">{data.totals.profitableOrders}</p>
            <p className="text-sm text-gray-600">Profitable Aufträge</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-red-600">{data.totals.lossOrders}</p>
            <p className="text-sm text-gray-600">Verlust Aufträge</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        {/* Profit/Loss Filter */}
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-600 font-medium">Typ:</span>
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded text-sm ${filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Alle ({data.orders.length})
          </button>
          <button
            onClick={() => setFilterType('profit')}
            className={`px-4 py-2 rounded text-sm ${filterType === 'profit' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Gewinn ({data.totals.profitableOrders})
          </button>
          <button
            onClick={() => setFilterType('loss')}
            className={`px-4 py-2 rounded text-sm ${filterType === 'loss' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Verlust ({data.totals.lossOrders})
          </button>
        </div>

        {/* Customer & Contractor Filters */}
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600 font-medium">Filter:</span>
          
          {/* Customer Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Kunde:</label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="all">Alle Kunden</option>
              {customers.map(customer => (
                <option key={customer} value={customer}>{customer}</option>
              ))}
            </select>
          </div>

          {/* Contractor Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Auftragnehmer:</label>
            <select
              value={selectedContractor}
              onChange={(e) => setSelectedContractor(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="all">Alle Auftragnehmer</option>
              {contractors.map(contractor => (
                <option key={contractor} value={contractor}>{contractor}</option>
              ))}
            </select>
          </div>

          {/* Results Count */}
          <span className="text-sm text-gray-500 ml-auto">
            {filteredOrders.length} von {data.orders.length} Aufträgen
          </span>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Auftrag</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rechnung</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kunde</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Auftragnehmer</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Umsatz</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rabatt</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Kosten</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gewinn/Verlust</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Marge</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.orderId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{order.orderId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.invoiceNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.invoiceDate).toLocaleDateString('de-DE')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {order.customer}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {order.contractor}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <div>
                      <div className="text-gray-900">€{order.revenue}</div>
                      {order.discountPercentage > 0 && (
                        <div className="text-xs text-orange-600">
                          -{order.discountPercentage}% Rabatt
                        </div>
                      )}
                      {order.skontoOffered && (
                        <div className="text-xs text-blue-600">
                          {order.skontoPercentage}% Skonto
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600">
                    {order.discountAmount > 0 ? `-€${order.discountAmount}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                    €{order.costs}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <span className={`font-semibold ${order.isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                      {order.isProfitable ? '+' : ''}€{order.profitLoss}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <span className={`font-semibold ${parseFloat(order.profitMargin) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {order.profitMargin}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
