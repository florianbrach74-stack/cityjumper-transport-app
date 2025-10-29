import React, { useState } from 'react';
import { User, Mail, Phone, Building, Ban, CheckCircle, FileText } from 'lucide-react';
import InvoiceGenerator from './InvoiceGenerator';

const CustomerManagement = ({ users, onUpdateAccountStatus, onViewOrders }) => {
  const [selectedCustomerForInvoice, setSelectedCustomerForInvoice] = useState(null);
  const [invoiceOrder, setInvoiceOrder] = useState(null);

  const customers = users.filter(u => u.role === 'customer');

  const handleAccountStatusChange = async (userId, newStatus) => {
    const statusText = newStatus === 'suspended' ? 'deaktivieren' : 'aktivieren';
    if (confirm(`Möchten Sie diesen Account wirklich ${statusText}?`)) {
      await onUpdateAccountStatus(userId, newStatus);
    }
  };

  const getAccountStatusBadge = (status) => {
    if (status === 'suspended') {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
          <Ban className="h-3 w-3 inline mr-1" />
          Deaktiviert
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 inline mr-1" />
        Aktiv
      </span>
    );
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Kunden-Verwaltung</h2>
          <div className="text-sm text-gray-600">
            {customers.length} Kunden gesamt
          </div>
        </div>

        {customers.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Keine Kunden vorhanden</p>
        ) : (
          <div className="space-y-4">
            {customers.map((customer) => (
              <div key={customer.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {/* Customer Info */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg flex items-center">
                          {customer.company_name ? (
                            <>
                              <Building className="h-5 w-5 mr-2 text-primary-600" />
                              {customer.company_name}
                            </>
                          ) : (
                            <>
                              <User className="h-5 w-5 mr-2 text-gray-600" />
                              {customer.first_name} {customer.last_name}
                            </>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          <Mail className="h-4 w-4 inline mr-1" />
                          {customer.email}
                        </p>
                        {customer.phone && (
                          <p className="text-sm text-gray-600">
                            <Phone className="h-4 w-4 inline mr-1" />
                            {customer.phone}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        {getAccountStatusBadge(customer.account_status)}
                        <p className="text-xs text-gray-500 mt-2">
                          ID: #{customer.id}
                        </p>
                        <p className="text-xs text-gray-500">
                          Seit: {new Date(customer.created_at).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    </div>

                    {/* Company Details */}
                    {customer.company_name && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                        <h4 className="text-sm font-medium text-blue-900 mb-2">
                          📋 Firmendaten (Rechnungsstellung)
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                          {customer.company_address && (
                            <div>
                              <span className="text-blue-600">Adresse:</span> {customer.company_address}
                            </div>
                          )}
                          {customer.company_postal_code && (
                            <div>
                              <span className="text-blue-600">PLZ/Ort:</span> {customer.company_postal_code} {customer.company_city}
                            </div>
                          )}
                          {customer.tax_id && (
                            <div>
                              <span className="text-blue-600">Steuer-Nr:</span> {customer.tax_id}
                            </div>
                          )}
                          {customer.vat_id && (
                            <div>
                              <span className="text-blue-600">USt-IdNr:</span> {customer.vat_id}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onViewOrders(customer.id)}
                        className="flex-1 px-3 py-2 text-sm border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50"
                      >
                        <FileText className="h-4 w-4 inline mr-1" />
                        Aufträge ansehen
                      </button>
                      
                      {customer.account_status === 'active' ? (
                        <button
                          onClick={() => handleAccountStatusChange(customer.id, 'suspended')}
                          className="px-3 py-2 text-sm border border-red-600 text-red-600 rounded-lg hover:bg-red-50"
                        >
                          <Ban className="h-4 w-4 inline mr-1" />
                          Deaktivieren
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAccountStatusChange(customer.id, 'active')}
                          className="px-3 py-2 text-sm border border-green-600 text-green-600 rounded-lg hover:bg-green-50"
                        >
                          <CheckCircle className="h-4 w-4 inline mr-1" />
                          Aktivieren
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invoice Generator Modal */}
      {invoiceOrder && (
        <InvoiceGenerator
          order={invoiceOrder}
          onClose={() => {
            setInvoiceOrder(null);
            setSelectedCustomerForInvoice(null);
          }}
        />
      )}
    </div>
  );
};

export default CustomerManagement;
