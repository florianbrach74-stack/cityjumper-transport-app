import { useState } from 'react';
import { X, Send, Download, FileText } from 'lucide-react';

export default function InvoicePreviewModal({ invoice, onClose, onSend }) {
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      await onSend();
      onClose();
    } catch (error) {
      console.error('Error sending invoice:', error);
    } finally {
      setSending(false);
    }
  };

  const formatPrice = (price) => `€${parseFloat(price || 0).toFixed(2)}`;
  const formatDate = (date) => new Date(date).toLocaleDateString('de-DE');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <FileText className="h-6 w-6 mr-2 text-primary-600" />
            Rechnungsvorschau
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Invoice Preview */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-3xl mx-auto">
            {/* Invoice Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">RECHNUNG</h1>
                <p className="text-gray-600">Nr: {invoice.invoiceNumber}</p>
                <p className="text-gray-600">Datum: {formatDate(invoice.invoiceDate)}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary-600 mb-2">
                  CityJumper
                </div>
                <p className="text-sm text-gray-600">Express Transport</p>
              </div>
            </div>

            {/* Customer Info */}
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Rechnungsempfänger:</h3>
              <p className="text-gray-700 font-medium">{invoice.customer.name}</p>
              <p className="text-gray-600">{invoice.customer.email}</p>
            </div>

            {/* Order Details */}
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">Leistungen:</h3>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Auftrag</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Route</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Datum</th>
                    <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Betrag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoice.orders.map((order) => {
                    const price = parseFloat(order.price || 0);
                    const waitingFee = order.waiting_time_approved ? parseFloat(order.waiting_time_fee || 0) : 0;
                    const total = price + waitingFee;

                    return (
                      <tr key={order.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">#{order.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {order.pickup_city} → {order.delivery_city}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                          {formatPrice(total)}
                          {waitingFee > 0 && (
                            <div className="text-xs text-orange-600">
                              inkl. {formatPrice(waitingFee)} Wartezeit
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="border-t-2 border-gray-300 pt-4">
              <div className="flex justify-end space-y-2">
                <div className="w-64">
                  <div className="flex justify-between text-gray-700 mb-2">
                    <span>Zwischensumme:</span>
                    <span className="font-medium">{formatPrice(invoice.totals.subtotal)}</span>
                  </div>
                  {invoice.totals.waitingTimeFees > 0 && (
                    <div className="flex justify-between text-orange-600 mb-2">
                      <span>Wartezeit-Gebühren:</span>
                      <span className="font-medium">{formatPrice(invoice.totals.waitingTimeFees)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-300">
                    <span>Gesamtbetrag:</span>
                    <span>{formatPrice(invoice.totals.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-xs text-gray-500 text-center">
              <p>Vielen Dank für Ihr Vertrauen!</p>
              <p className="mt-2">
                Zahlbar innerhalb von 14 Tagen nach Rechnungsdatum.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="text-sm text-gray-600">
            {invoice.orders.length} {invoice.orders.length === 1 ? 'Auftrag' : 'Aufträge'} • 
            Gesamt: <span className="font-semibold">{formatPrice(invoice.totals.total)}</span>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium disabled:opacity-50"
            >
              <Send className="h-4 w-4 mr-2" />
              {sending ? 'Wird gesendet...' : 'Rechnung jetzt senden'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
