import { useState, useEffect } from 'react';
import { Download, FileText, TrendingUp, Package, Clock, DollarSign, Filter, Send } from 'lucide-react';
import axios from 'axios';
import InvoicePreviewModal from './InvoicePreviewModal';

export default function ReportsSummary({ userRole }) {
  const [dateRange, setDateRange] = useState('7');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [customerFilter, setCustomerFilter] = useState('all');
  const [customers, setCustomers] = useState([]);
  const [invoicePreview, setInvoicePreview] = useState(null);

  const getDateRange = () => {
    const end = new Date();
    let start = new Date();

    if (dateRange === 'custom') {
      return { startDate: customStartDate, endDate: customEndDate };
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
      
      if (userRole === 'admin') {
        const uniqueCustomers = [...new Map(
          response.data.orders.map(o => [
            o.customer_id,
            {
              id: o.customer_id,
              name: o.customer_company || `${o.customer_first_name || ''} ${o.customer_last_name || ''}`.trim()
            }
          ])
        ).values()];
        setCustomers(uniqueCustomers);
      }
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
    const filteredOrders = getFilteredOrders();
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(o => o.id));
    }
  };

  const previewSingleInvoice = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/reports/bulk-invoice`,
        { orderIds: [orderId] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInvoicePreview(response.data.invoice);
    } catch (error) {
      console.error('Error generating invoice preview:', error);
      alert(error.response?.data?.error || 'Fehler beim Erstellen der Vorschau');
    }
  };

  const sendInvoice = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/reports/bulk-invoice`,
        { 
          orderIds: [invoicePreview.orders[0].id],
          sendEmail: true
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.emailSent) {
        alert('Rechnung wurde erfolgreich per Email an den Kunden gesendet!');
      } else {
        alert('Rechnung erstellt, aber Email-Versand fehlgeschlagen. Bitte manuell versenden.');
      }
      setInvoicePreview(null);
    } catch (error) {
      console.error('Error sending invoice:', error);
      alert(error.response?.data?.error || 'Fehler beim Versenden der Rechnung');
    }
  };

  const previewBulkInvoice = async () => {
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
      setInvoicePreview(response.data.invoice);
    } catch (error) {
      console.error('Error generating bulk invoice preview:', error);
      alert(error.response?.data?.error || 'Fehler beim Erstellen der Sammelrechnung');
    }
  };

  const sendBulkInvoice = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/reports/bulk-invoice`,
        { 
          orderIds: selectedOrders,
          sendEmail: true
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.emailSent) {
        alert(`Sammelrechnung für ${invoicePreview.orders.length} Aufträge wurde erfolgreich per Email an den Kunden gesendet!`);
      } else {
        alert(`Sammelrechnung für ${invoicePreview.orders.length} Aufträge erstellt, aber Email-Versand fehlgeschlagen. Bitte manuell versenden.`);
      }
      setSelectedOrders([]);
      setInvoicePreview(null);
    } catch (error) {
      console.error('Error sending bulk invoice:', error);
      alert(error.response?.data?.error || 'Fehler beim Versenden der Sammelrechnung');
    }
  };

  const exportToCSV = () => {
    const filteredOrders = getFilteredOrders();
    const csvContent = [
      ['Auftrags-Nr', 'Datum', 'Von', 'Nach', 'Status', 'Preis', 'Wartezeit', 'Gesamt'].join(';'),
      ...filteredOrders.map(order => [
        order.id,
        new Date(order.created_at).toLocaleDateString('de-DE'),
        order.pickup_city,
        order.delivery_city,
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

  const getFilteredOrders = () => {
    if (customerFilter === 'all' || userRole !== 'admin') {
      return orders;
    }
    return orders.filter(o => o.customer_id === parseInt(customerFilter));
  };

  const formatPrice = (price) => `€${parseFloat(price || 0).toFixed(2)}`;

  const handlePaymentStatusChange = async (invoiceNumber, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      // URL-encode the invoice number to handle special characters like dashes
      const encodedInvoiceNumber = encodeURIComponent(invoiceNumber);
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/reports/invoice/${encodedInvoiceNumber}/payment-status`,
        { 
          payment_status: newStatus,
          paymentStatus: newStatus // Support both parameter names
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh orders
      fetchSummary();
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert(error.response?.data?.error || 'Fehler beim Aktualisieren des Zahlungsstatus');
    }
  };

  const downloadInvoice = (invoiceNumber) => {
    const token = localStorage.getItem('token');
    window.open(
      `${import.meta.env.VITE_API_URL}/api/reports/invoice/${invoiceNumber}/pdf?token=${token}`,
      '_blank'
    );
  };

  if (loading && !summary) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const filteredOrders = getFilteredOrders();

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
              disabled={filteredOrders.length === 0}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <Download className="h-4 w-4 mr-2" />
              CSV Export
            </button>
            {userRole === 'admin' && selectedOrders.length > 0 && (
              <button
                onClick={previewBulkInvoice}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
              >
                <FileText className="h-4 w-4 mr-2" />
                Sammelrechnung ({selectedOrders.length})
              </button>
            )}
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center space-x-4 mb-4">
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
          <div className="flex items-center space-x-4 mb-4">
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

        {/* Customer Filter (Admin only) */}
        {userRole === 'admin' && customers.length > 0 && (
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Kunde:</span>
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Alle Kunden ({orders.length})</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} ({orders.filter(o => o.customer_id === customer.id).length})
                </option>
              ))}
            </select>
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
                <p className="text-2xl font-bold text-gray-900 mt-1">{filteredOrders.length}</p>
              </div>
              <Package className="h-10 w-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Abgeschlossen</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {filteredOrders.filter(o => o.status === 'completed').length}
                </p>
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
                  {formatPrice(
                    filteredOrders.reduce((sum, o) => {
                      const price = parseFloat(o.price || 0);
                      const contractorPrice = parseFloat(o.contractor_price || 0);
                      const waitingFee = o.waiting_time_approved ? parseFloat(o.waiting_time_fee || 0) : 0;
                      
                      if (userRole === 'admin') return sum + price + waitingFee;
                      if (userRole === 'contractor') return sum + contractorPrice + waitingFee;
                      return sum + price + waitingFee;
                    }, 0)
                  )}
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
                    {formatPrice(
                      filteredOrders.reduce((sum, o) => {
                        const price = parseFloat(o.price || 0);
                        const contractorPrice = parseFloat(o.contractor_price || 0);
                        return sum + (price - contractorPrice);
                      }, 0)
                    )}
                  </p>
                </div>
                <TrendingUp className="h-10 w-10 text-green-500" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Aufträge ({filteredOrders.length})</h3>
          {userRole === 'admin' && filteredOrders.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {selectedOrders.length === filteredOrders.length ? 'Alle abwählen' : 'Alle auswählen'}
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
                      checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
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
                      Kunde
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Provision
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rechnung
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Zahlungsstatus
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => {
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
                          {order.customer_company || `${order.customer_first_name || ''} ${order.customer_last_name || ''}`.trim() || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          {formatPrice(commission)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {order.invoice_number ? (
                            <div className="flex flex-col space-y-1">
                              <button
                                onClick={() => downloadInvoice(order.invoice_number)}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline text-left"
                              >
                                {order.invoice_number}
                              </button>
                              <span className="text-xs text-gray-500">
                                {order.invoiced_at ? new Date(order.invoiced_at).toLocaleDateString('de-DE') : '-'}
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() => previewSingleInvoice(order.id)}
                              className="flex items-center text-primary-600 hover:text-primary-700 font-medium"
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Rechnung
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {order.invoice_number ? (
                            <div className="flex flex-col space-y-1">
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={order.payment_status === 'paid'}
                                  onChange={(e) => handlePaymentStatusChange(order.invoice_number, e.target.checked ? 'paid' : 'unpaid')}
                                  className="h-4 w-4 text-green-600 rounded focus:ring-green-500 cursor-pointer"
                                />
                                <span className={`text-xs font-semibold ${
                                  order.payment_status === 'paid' ? 'text-green-600' : 'text-gray-500'
                                }`}>
                                  Bezahlt
                                </span>
                              </label>
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={order.payment_status === 'overdue'}
                                  onChange={(e) => handlePaymentStatusChange(order.invoice_number, e.target.checked ? 'overdue' : 'unpaid')}
                                  className="h-4 w-4 text-red-600 rounded focus:ring-red-500 cursor-pointer"
                                />
                                <span className={`text-xs font-semibold ${
                                  order.payment_status === 'overdue' ? 'text-red-600' : 'text-gray-500'
                                }`}>
                                  Überfällig
                                </span>
                              </label>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
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

      {/* Invoice Preview Modal */}
      {invoicePreview && (
        <InvoicePreviewModal
          invoice={invoicePreview}
          onClose={() => setInvoicePreview(null)}
          onSend={invoicePreview.orders.length === 1 ? sendInvoice : sendBulkInvoice}
        />
      )}
    </div>
  );
}
