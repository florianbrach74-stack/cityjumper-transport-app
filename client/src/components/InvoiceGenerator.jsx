import React, { useState } from 'react';
import { X, Download, FileText, Building, User } from 'lucide-react';
import { formatPrice, calculateGrossPrice } from '../utils/formatPrice';

const InvoiceGenerator = ({ order, onClose }) => {
  const [invoiceNumber, setInvoiceNumber] = useState(`RE-${order.id}-${new Date().getFullYear()}`);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  
  if (!order) return null;

  const netPrice = parseFloat(order.price) || 0;
  const vatAmount = netPrice * 0.19;
  const grossPrice = netPrice + vatAmount;

  const generatePDF = () => {
    // Create printable HTML
    const printWindow = window.open('', '', 'height=800,width=800');
    printWindow.document.write(getInvoiceHTML());
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const getInvoiceHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Rechnung ${invoiceNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 40px;
            color: #333;
          }
          .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
            border-bottom: 2px solid #0ea5e9;
            padding-bottom: 20px;
          }
          .company-info {
            font-size: 14px;
          }
          .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #0ea5e9;
            margin-bottom: 10px;
          }
          .invoice-title {
            font-size: 28px;
            font-weight: bold;
            text-align: right;
          }
          .addresses {
            display: flex;
            justify-content: space-between;
            margin: 40px 0;
          }
          .address-block {
            width: 45%;
          }
          .address-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: #0ea5e9;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
          }
          th {
            background-color: #0ea5e9;
            color: white;
            padding: 12px;
            text-align: left;
          }
          td {
            padding: 12px;
            border-bottom: 1px solid #ddd;
          }
          .totals {
            margin-top: 30px;
            text-align: right;
          }
          .totals-row {
            display: flex;
            justify-content: flex-end;
            padding: 8px 0;
          }
          .totals-label {
            width: 200px;
            text-align: right;
            padding-right: 20px;
          }
          .totals-value {
            width: 150px;
            text-align: right;
            font-weight: bold;
          }
          .total-final {
            font-size: 18px;
            color: #0ea5e9;
            border-top: 2px solid #0ea5e9;
            padding-top: 10px;
            margin-top: 10px;
          }
          .footer {
            margin-top: 60px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
          }
          .payment-info {
            background-color: #f0f9ff;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            <div class="company-name">Courierly</div>
            <div style="font-size: 11px; color: #666; margin-top: 5px;">eine Marke der FB Transporte</div>
            <div style="margin-top: 10px;">Inhaber: Florian Brach</div>
            <div>Adolf-Menzel-Straße 71</div>
            <div>12621 Berlin</div>
            <div style="margin-top: 10px;">
              <div>Tel: +49 (0)172 421 66 72</div>
              <div>Email: info@courierly.de</div>
              <div>Web: www.courierly.de</div>
            </div>
            <div style="margin-top: 10px;">
              <div>USt-IdNr: DE299198928</div>
              <div>St.-Nr.: 33/237/00521</div>
            </div>
          </div>
          <div>
            <div class="invoice-title">RECHNUNG</div>
            <div style="text-align: right; margin-top: 10px;">
              <div><strong>Rechnungs-Nr:</strong> ${invoiceNumber}</div>
              <div><strong>Datum:</strong> ${new Date(invoiceDate).toLocaleDateString('de-DE')}</div>
              <div><strong>Auftrags-Nr:</strong> #${order.id}</div>
            </div>
          </div>
        </div>

        <div class="addresses">
          <div class="address-block">
            <div class="address-title">Rechnungsempfänger:</div>
            ${order.customer_company ? `
              <div><strong>${order.customer_company}</strong></div>
              ${order.customer_company_address ? `<div>${order.customer_company_address}</div>` : ''}
              ${order.customer_company_postal_code ? `<div>${order.customer_company_postal_code} ${order.customer_company_city}</div>` : ''}
              ${order.customer_tax_id ? `<div>Steuer-Nr: ${order.customer_tax_id}</div>` : ''}
              ${order.customer_vat_id ? `<div>USt-IdNr: ${order.customer_vat_id}</div>` : ''}
            ` : `
              <div><strong>${order.customer_first_name} ${order.customer_last_name}</strong></div>
            `}
            <div style="margin-top: 10px;">
              <div>Email: ${order.customer_email}</div>
              ${order.customer_phone ? `<div>Tel: ${order.customer_phone}</div>` : ''}
            </div>
          </div>
          
          <div class="address-block">
            <div class="address-title">Leistungserbringer:</div>
            ${order.contractor_company ? `
              <div><strong>${order.contractor_company}</strong></div>
              ${order.contractor_company_address ? `<div>${order.contractor_company_address}</div>` : ''}
              ${order.contractor_company_postal_code ? `<div>${order.contractor_company_postal_code} ${order.contractor_company_city}</div>` : ''}
            ` : `
              <div><strong>${order.contractor_first_name || ''} ${order.contractor_last_name || ''}</strong></div>
            `}
          </div>
        </div>

        <h3>Transportdienstleistung</h3>
        <table>
          <thead>
            <tr>
              <th>Position</th>
              <th>Beschreibung</th>
              <th style="text-align: right;">Menge</th>
              <th style="text-align: right;">Einzelpreis</th>
              <th style="text-align: right;">Gesamt</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>
                <strong>Transport: ${order.pickup_city} → ${order.delivery_city}</strong><br/>
                <small>
                  Abholung: ${order.pickup_address}, ${order.pickup_postal_code} ${order.pickup_city}<br/>
                  Zustellung: ${order.delivery_address}, ${order.delivery_postal_code} ${order.delivery_city}<br/>
                  Datum: ${new Date(order.pickup_date).toLocaleDateString('de-DE')}<br/>
                  Fahrzeug: ${order.vehicle_type}<br/>
                  ${order.distance_km ? `Entfernung: ${order.distance_km} km<br/>` : ''}
                  ${order.duration_minutes ? `Fahrzeit: ${Math.floor(order.duration_minutes / 60)}h ${order.duration_minutes % 60}min<br/>` : ''}
                  ${order.weight ? `Gewicht: ${order.weight} kg<br/>` : ''}
                  ${order.pallets ? `Paletten: ${order.pallets}<br/>` : ''}
                </small>
              </td>
              <td style="text-align: right;">1</td>
              <td style="text-align: right;">€${netPrice.toFixed(2)}</td>
              <td style="text-align: right;">€${netPrice.toFixed(2)}</td>
            </tr>
            ${order.waiting_time_fee && order.waiting_time_approved ? `
            <tr>
              <td>2</td>
              <td>
                <strong>Wartezeit</strong><br/>
                <small>Zusätzliche Wartezeit vor Ort</small>
              </td>
              <td style="text-align: right;">1</td>
              <td style="text-align: right;">€${parseFloat(order.waiting_time_fee).toFixed(2)}</td>
              <td style="text-align: right;">€${parseFloat(order.waiting_time_fee).toFixed(2)}</td>
            </tr>
            ` : ''}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-row">
            <div class="totals-label">Nettobetrag:</div>
            <div class="totals-value">€${netPrice.toFixed(2)}</div>
          </div>
          <div class="totals-row">
            <div class="totals-label">zzgl. 19% MwSt.:</div>
            <div class="totals-value">€${vatAmount.toFixed(2)}</div>
          </div>
          <div class="totals-row total-final">
            <div class="totals-label">Gesamtbetrag:</div>
            <div class="totals-value">€${grossPrice.toFixed(2)}</div>
          </div>
        </div>

        <div class="payment-info">
          <strong>Zahlungsinformationen:</strong><br/>
          Bitte überweisen Sie den Betrag innerhalb von 14 Tagen auf folgendes Konto:<br/>
          <div style="margin-top: 10px;">
            <strong>Bankverbindung:</strong><br/>
            IBAN: DE89 3704 0044 0532 0130 00<br/>
            BIC: COBADEFFXXX<br/>
            Bank: Commerzbank AG<br/>
            Verwendungszweck: ${invoiceNumber}
          </div>
        </div>

        <div class="footer">
          <div style="text-align: center;">
            <strong>Courierly – eine Marke der FB Transporte</strong><br/>
            Inhaber: Florian Brach<br/>
            Adolf-Menzel-Straße 71 • 12621 Berlin<br/>
            Tel: +49 (0)172 421 66 72 • Email: info@courierly.de • Web: www.courierly.de<br/>
            USt-IdNr: DE299198928 • St.-Nr.: 33/237/00521
          </div>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <FileText className="h-6 w-6 mr-2 text-primary-600" />
            Rechnung erstellen
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Invoice Settings */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="font-medium text-gray-900 mb-4">Rechnungsdetails</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rechnungsnummer
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rechnungsdatum
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="border rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-4">Auftragsübersicht</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Auftrag:</p>
                <p className="font-medium">#{order.id}</p>
              </div>
              <div>
                <p className="text-gray-600">Route:</p>
                <p className="font-medium">{order.pickup_city} → {order.delivery_city}</p>
              </div>
              <div>
                <p className="text-gray-600">Datum:</p>
                <p className="font-medium">{new Date(order.pickup_date).toLocaleDateString('de-DE')}</p>
              </div>
              <div>
                <p className="text-gray-600">Fahrzeug:</p>
                <p className="font-medium">{order.vehicle_type}</p>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <User className="h-4 w-4 mr-2" />
                Rechnungsempfänger
              </h4>
              {order.customer_company ? (
                <div className="text-sm space-y-1">
                  <p className="font-medium">{order.customer_company}</p>
                  {order.customer_company_address && <p>{order.customer_company_address}</p>}
                  {order.customer_company_postal_code && (
                    <p>{order.customer_company_postal_code} {order.customer_company_city}</p>
                  )}
                  {order.customer_tax_id && <p className="text-gray-600">Steuer-Nr: {order.customer_tax_id}</p>}
                  {order.customer_vat_id && <p className="text-gray-600">USt-IdNr: {order.customer_vat_id}</p>}
                </div>
              ) : (
                <div className="text-sm">
                  <p className="font-medium">{order.customer_first_name} {order.customer_last_name}</p>
                  <p className="text-gray-600">Privatkunde</p>
                </div>
              )}
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <Building className="h-4 w-4 mr-2" />
                Leistungserbringer
              </h4>
              {order.contractor_company ? (
                <div className="text-sm space-y-1">
                  <p className="font-medium">{order.contractor_company}</p>
                  {order.contractor_company_address && <p>{order.contractor_company_address}</p>}
                  {order.contractor_company_postal_code && (
                    <p>{order.contractor_company_postal_code} {order.contractor_company_city}</p>
                  )}
                </div>
              ) : (
                <div className="text-sm">
                  <p className="font-medium">{order.contractor_first_name} {order.contractor_last_name}</p>
                </div>
              )}
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-primary-50 border-2 border-primary-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Rechnungsbetrag</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Nettobetrag:</span>
                <span className="font-medium">€{netPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">zzgl. 19% MwSt.:</span>
                <span className="font-medium">€{vatAmount.toFixed(2)}</span>
              </div>
              <div className="border-t-2 border-primary-300 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-bold text-lg">Gesamtbetrag:</span>
                  <span className="font-bold text-lg text-primary-600">€{grossPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Abbrechen
          </button>
          <button
            onClick={generatePDF}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Rechnung erstellen & drucken
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceGenerator;
