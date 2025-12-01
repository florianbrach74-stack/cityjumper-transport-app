import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, Mail, Check, X, Clock, AlertCircle,
  Filter, Search, Calendar, Euro, TrendingUp, TrendingDown,
  Package, DollarSign
} from 'lucide-react';
import api from '../services/api';

const InvoiceHistory = () => {
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    from_date: '',
    to_date: '',
    search: ''
  });
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderType, setReminderType] = useState('friendly');

  useEffect(() => {
    fetchInvoices();
    fetchStats();
  }, [filters.status, filters.from_date, filters.to_date]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.from_date) params.append('from_date', filters.from_date);
      if (filters.to_date) params.append('to_date', filters.to_date);

      const response = await api.get(`/invoices?${params.toString()}`);
      setInvoices(response.data.invoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/invoices/stats/summary');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const updatePaymentStatus = async (invoiceNumber, status) => {
    try {
      await api.patch(`/invoices/${invoiceNumber}/payment-status`, {
        payment_status: status
      });
      fetchInvoices();
      fetchStats();
      alert(`Zahlungsstatus auf "${status}" aktualisiert`);
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Fehler beim Aktualisieren des Status');
    }
  };

  const updateContractorInvoiceStatus = async (invoiceNumber, field, value) => {
    try {
      await api.patch(`/invoices/${invoiceNumber}/contractor-invoice-status`, {
        [field]: value
      });
      fetchInvoices();
      
      const labels = {
        contractor_invoice_received: value ? 'Auftragnehmer-Rechnung als erhalten markiert' : 'Auftragnehmer-Rechnung als nicht erhalten markiert',
        contractor_invoice_paid: value ? 'Auftragnehmer-Rechnung als bezahlt markiert' : 'Auftragnehmer-Rechnung als nicht bezahlt markiert'
      };
      
      alert(labels[field]);
    } catch (error) {
      console.error('Error updating contractor invoice status:', error);
      alert('Fehler beim Aktualisieren des Status');
    }
  };

  const sendReminder = async (invoiceNumber) => {
    try {
      await api.post(`/invoices/${invoiceNumber}/send-reminder`, {
        reminder_type: reminderType
      });
      setShowReminderModal(false);
      alert('Zahlungserinnerung wurde versendet');
      fetchInvoices();
    } catch (error) {
      console.error('Error sending reminder:', error);
      alert('Fehler beim Versenden der Erinnerung');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      paid: { color: 'bg-green-100 text-green-800', icon: Check, label: 'Bezahlt' },
      unpaid: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Offen' },
      overdue: { color: 'bg-red-100 text-red-800', icon: AlertCircle, label: 'Überfällig' }
    };
    const badge = badges[status] || badges.unpaid;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.label}
      </span>
    );
  };

  const filteredInvoices = invoices.filter(invoice => {
    if (!filters.search) return true;
    const searchLower = filters.search.toLowerCase();
    return (
      invoice.invoice_number.toLowerCase().includes(searchLower) ||
      invoice.customer_email?.toLowerCase().includes(searchLower) ||
      invoice.customer_company?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Rechnungs-Historie</h1>
          <p className="text-gray-600">Übersicht aller versendeten Rechnungen und Zahlungsstatus</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Gesamt</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_invoices}</p>
                  <p className="text-sm text-gray-500 mt-1">€{parseFloat(stats.total_amount || 0).toFixed(2)}</p>
                </div>
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Bezahlt</p>
                  <p className="text-2xl font-bold text-green-900">{stats.paid_count}</p>
                  <p className="text-sm text-green-600 mt-1">€{parseFloat(stats.paid_amount || 0).toFixed(2)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-400" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">Offen</p>
                  <p className="text-2xl font-bold text-yellow-900">{stats.unpaid_count}</p>
                  <p className="text-sm text-yellow-600 mt-1">€{parseFloat(stats.unpaid_amount || 0).toFixed(2)}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Überfällig</p>
                  <p className="text-2xl font-bold text-red-900">{stats.overdue_count}</p>
                  <p className="text-sm text-red-600 mt-1">€{parseFloat(stats.overdue_amount || 0).toFixed(2)}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-400" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="inline w-4 h-4 mr-1" />
                Suche
              </label>
              <input
                type="text"
                placeholder="Rechnung, Kunde..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="inline w-4 h-4 mr-1" />
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Alle</option>
                <option value="paid">Bezahlt</option>
                <option value="unpaid">Offen</option>
                <option value="overdue">Überfällig</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Von Datum
              </label>
              <input
                type="date"
                value={filters.from_date}
                onChange={(e) => setFilters({...filters, from_date: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Bis Datum
              </label>
              <input
                type="date"
                value={filters.to_date}
                onChange={(e) => setFilters({...filters, to_date: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rechnung
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kunde
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Datum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fällig
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Betrag
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex flex-col items-center">
                    <Package className="h-4 w-4 mb-1" />
                    <span>AN-Rechnung erhalten</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex flex-col items-center">
                    <DollarSign className="h-4 w-4 mb-1" />
                    <span>AN-Rechnung bezahlt</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                    Lade Rechnungen...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                    Keine Rechnungen gefunden
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {invoice.invoice_number}
                          </div>
                          <div className="text-sm text-gray-500">
                            {invoice.order_count} Auftrag{invoice.order_count > 1 ? 'e' : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {invoice.customer_company || `${invoice.customer_first_name} ${invoice.customer_last_name}`}
                      </div>
                      <div className="text-sm text-gray-500">{invoice.customer_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invoice.invoice_date).toLocaleDateString('de-DE')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invoice.due_date).toLocaleDateString('de-DE')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        €{parseFloat(invoice.total_amount).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(invoice.payment_status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <input
                        type="checkbox"
                        checked={invoice.contractor_invoice_received || false}
                        onChange={(e) => updateContractorInvoiceStatus(
                          invoice.invoice_number,
                          'contractor_invoice_received',
                          e.target.checked
                        )}
                        className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                        title={invoice.contractor_invoice_received_date 
                          ? `Erhalten am: ${new Date(invoice.contractor_invoice_received_date).toLocaleDateString('de-DE')}` 
                          : 'Auftragnehmer-Rechnung erhalten?'}
                      />
                      {invoice.contractor_invoice_received_date && (
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(invoice.contractor_invoice_received_date).toLocaleDateString('de-DE')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <input
                        type="checkbox"
                        checked={invoice.contractor_invoice_paid || false}
                        onChange={(e) => updateContractorInvoiceStatus(
                          invoice.invoice_number,
                          'contractor_invoice_paid',
                          e.target.checked
                        )}
                        className="h-5 w-5 text-green-600 rounded border-gray-300 focus:ring-green-500 cursor-pointer"
                        title={invoice.contractor_invoice_paid_date 
                          ? `Bezahlt am: ${new Date(invoice.contractor_invoice_paid_date).toLocaleDateString('de-DE')}` 
                          : 'Auftragnehmer-Rechnung bezahlt?'}
                        disabled={!invoice.contractor_invoice_received}
                      />
                      {invoice.contractor_invoice_paid_date && (
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(invoice.contractor_invoice_paid_date).toLocaleDateString('de-DE')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {invoice.payment_status !== 'paid' && (
                          <>
                            <button
                              onClick={() => updatePaymentStatus(invoice.invoice_number, 'paid')}
                              className="text-green-600 hover:text-green-900"
                              title="Als bezahlt markieren"
                            >
                              <Check className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setShowReminderModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="Erinnerung senden"
                            >
                              <Mail className="h-5 w-5" />
                            </button>
                          </>
                        )}
                        {invoice.pdf_url && (
                          <a
                            href={invoice.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-gray-900"
                            title="PDF herunterladen"
                          >
                            <Download className="h-5 w-5" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Reminder Modal */}
        {showReminderModal && selectedInvoice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Zahlungserinnerung senden</h3>
                <button onClick={() => setShowReminderModal(false)}>
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Rechnung: <strong>{selectedInvoice.invoice_number}</strong>
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Betrag: <strong>€{parseFloat(selectedInvoice.total_amount).toFixed(2)}</strong>
                </p>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Art der Erinnerung
                </label>
                <select
                  value={reminderType}
                  onChange={(e) => setReminderType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="friendly">Freundliche Erinnerung</option>
                  <option value="urgent">Dringende Erinnerung</option>
                  <option value="final">Letzte Mahnung</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowReminderModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => sendReminder(selectedInvoice.invoice_number)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Erinnerung senden
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceHistory;
