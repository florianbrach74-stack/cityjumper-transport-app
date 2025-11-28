import { useState } from 'react';
import { X, Send, Download, FileText, Edit2 } from 'lucide-react';

export default function InvoicePreviewModal({ invoice, onClose, onSend }) {
  const [sending, setSending] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState(invoice.invoiceNumber);
  const [invoiceDate, setInvoiceDate] = useState(new Date(invoice.invoiceDate).toISOString().split('T')[0]);
  const [editingNumber, setEditingNumber] = useState(false);
  const [editingDate, setEditingDate] = useState(false);
  const [includeMwst, setIncludeMwst] = useState(true);
  const [applyDiscount, setApplyDiscount] = useState(false);
  const [applySkonto, setApplySkonto] = useState(false);

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

  // Calculate totals with discounts and MwSt
  const subtotal = invoice.totals.total;
  const discountRate = 0.05; // 5%
  const skontoRate = 0.02; // 2%
  
  // Apply discount if selected
  const discountAmount = applyDiscount ? subtotal * discountRate : 0;
  const afterDiscount = subtotal - discountAmount;
  
  // Skonto is NOT deducted from invoice amount - only shown as payment term!
  // Customer can deduct it themselves if they pay within 7 days
  const netTotal = afterDiscount;
  
  // Calculate potential skonto amount for display in payment terms
  const potentialSkontoAmount = applySkonto ? netTotal * skontoRate : 0;
  const amountWithSkonto = netTotal - potentialSkontoAmount;
  
  const mwstRate = 0.19;
  const mwstAmount = includeMwst ? netTotal * mwstRate : 0;
  const grossTotal = netTotal + mwstAmount;
  const grossTotalWithSkonto = amountWithSkonto + (includeMwst ? amountWithSkonto * mwstRate : 0);

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
            {/* Company Header */}
            <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-300">
              <div>
                <div className="text-3xl font-bold text-primary-600 mb-2">
                  Courierly
                </div>
                <p className="text-xs text-gray-500 italic mb-3">eine Marke der FB Transporte</p>
                <p className="text-sm text-gray-700 font-medium">Inhaber: Florian Brach</p>
                <p className="text-sm text-gray-600">Adolf-Menzel-Straße 71</p>
                <p className="text-sm text-gray-600">12621 Berlin</p>
                <p className="text-sm text-gray-600 mt-2">Tel: +49 (0)172 421 66 72</p>
                <p className="text-sm text-gray-600">Email: info@courierly.de</p>
                <p className="text-sm text-gray-600">Web: www.courierly.de</p>
                <p className="text-sm text-gray-600 mt-2">USt-IdNr: DE299198928</p>
                <p className="text-sm text-gray-600">St.-Nr.: 33/237/00521</p>
              </div>
              <div className="text-right">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">RECHNUNG</h1>
                <div className="space-y-2">
                  {editingNumber ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        onBlur={() => setEditingNumber(false)}
                        className="px-2 py-1 border border-primary-500 rounded text-sm w-40"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <p className="text-gray-700"><span className="font-semibold">Nr:</span> {invoiceNumber}</p>
                      <button onClick={() => setEditingNumber(true)} className="text-primary-600 hover:text-primary-700">
                        <Edit2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  {editingDate ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="date"
                        value={invoiceDate}
                        onChange={(e) => setInvoiceDate(e.target.value)}
                        onBlur={() => setEditingDate(false)}
                        className="px-2 py-1 border border-primary-500 rounded text-sm"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <p className="text-gray-700"><span className="font-semibold">Datum:</span> {formatDate(invoiceDate)}</p>
                      <button onClick={() => setEditingDate(true)} className="text-primary-600 hover:text-primary-700">
                        <Edit2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
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

            {/* Discount, Skonto & MwSt Toggles */}
            <div className="mb-4 space-y-2">
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <input
                  type="checkbox"
                  id="applyDiscount"
                  checked={applyDiscount}
                  onChange={(e) => setApplyDiscount(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="applyDiscount" className="text-sm text-gray-700 cursor-pointer">
                  💰 Rabatt (5%) gewähren
                </label>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <input
                  type="checkbox"
                  id="applySkonto"
                  checked={applySkonto}
                  onChange={(e) => setApplySkonto(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="applySkonto" className="text-sm text-gray-700 cursor-pointer">
                  ⚡ Skonto (2%) gewähren
                </label>
                {applySkonto && (
                  <span className="text-xs text-blue-600 font-medium">
                    (Zahlung innerhalb 7 Tagen)
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="includeMwst"
                  checked={includeMwst}
                  onChange={(e) => setIncludeMwst(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="includeMwst" className="text-sm text-gray-700 cursor-pointer">
                  MwSt. (19%) ausweisen
                </label>
                {!includeMwst && (
                  <span className="text-xs text-gray-500">(Kleinunternehmerregelung §19 UStG)</span>
                )}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t-2 border-gray-300 pt-4">
              <div className="flex justify-end space-y-2">
                <div className="w-80">
                  <div className="flex justify-between text-gray-700 mb-2">
                    <span>Zwischensumme (Fahrten):</span>
                    <span className="font-medium">{formatPrice(invoice.totals.subtotal)}</span>
                  </div>
                  {invoice.totals.waitingTimeFees > 0 && (
                    <div className="flex justify-between text-orange-600 mb-2">
                      <span>Wartezeit-Gebühren:</span>
                      <span className="font-medium">{formatPrice(invoice.totals.waitingTimeFees)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-900 font-semibold mb-2 pt-2 border-t border-gray-200">
                    <span>Zwischensumme:</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {applyDiscount && (
                    <div className="flex justify-between text-green-600 mb-2">
                      <span>abzgl. Rabatt (5%):</span>
                      <span className="font-medium">-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-900 font-semibold mb-2 pt-2 border-t border-gray-200">
                    <span>Nettobetrag:</span>
                    <span>{formatPrice(netTotal)}</span>
                  </div>
                  {includeMwst && (
                    <div className="flex justify-between text-gray-700 mb-2">
                      <span>zzgl. 19% MwSt.:</span>
                      <span className="font-medium">{formatPrice(mwstAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t-2 border-gray-300">
                    <span>Gesamtbetrag:</span>
                    <span>{formatPrice(grossTotal)}</span>
                  </div>
                  {!includeMwst && (
                    <p className="text-xs text-gray-500 mt-2 italic">
                      Gemäß §19 UStG wird keine Umsatzsteuer berechnet.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Zahlungsinformationen:</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600"><span className="font-medium">Bank:</span> Deutsche Bank</p>
                  <p className="text-gray-600"><span className="font-medium">IBAN:</span> DE89 3704 0044 0532 0130 00</p>
                  <p className="text-gray-600"><span className="font-medium">BIC:</span> COBADEFFXXX</p>
                </div>
                <div>
                  <p className="text-gray-600"><span className="font-medium">Zahlungsziel:</span> 14 Tage netto</p>
                  <p className="text-gray-600"><span className="font-medium">Verwendungszweck:</span> {invoiceNumber}</p>
                </div>
              </div>
              
              {/* Skonto Notice */}
              {applySkonto && (
                <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                  <p className="text-sm text-blue-900 font-medium mb-2">
                    ⚡ Skonto-Bedingung:
                  </p>
                  <p className="text-sm text-blue-800">
                    Bei Zahlung innerhalb von <span className="font-bold">7 Tagen</span> ab Rechnungsdatum 
                    können Sie <span className="font-bold">2% Skonto</span> abziehen.
                  </p>
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-700">Rechnungsbetrag:</span>
                      <span className="font-bold text-blue-900">{formatPrice(grossTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-blue-700">abzgl. 2% Skonto:</span>
                      <span className="font-medium text-blue-800">-{formatPrice(potentialSkontoAmount + (includeMwst ? potentialSkontoAmount * mwstRate : 0))}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-2 pt-2 border-t border-blue-300">
                      <span className="text-blue-900 font-semibold">Zahlbetrag bei Skonto:</span>
                      <span className="font-bold text-blue-900 text-base">{formatPrice(grossTotalWithSkonto)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-gray-200 text-xs text-gray-500 text-center">
              <p className="font-medium text-gray-700 mb-2">Vielen Dank für Ihr Vertrauen!</p>
              <p className="text-gray-500">
                Courierly – eine Marke der FB Transporte • Inhaber: Florian Brach • Adolf-Menzel-Straße 71 • 12621 Berlin
              </p>
              <p className="text-gray-500 mt-1">
                Tel: +49 (0)172 421 66 72 • Email: info@courierly.de • Web: www.courierly.de • USt-IdNr: DE299198928 • St.-Nr.: 33/237/00521
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
