import React, { useState } from 'react';
import { User, Mail, Phone, Building, Ban, CheckCircle, FileText, Edit } from 'lucide-react';
import InvoiceGenerator from './InvoiceGenerator';
import CustomerOrdersModal from './CustomerOrdersModal';
import api from '../services/api';

const CustomerManagement = ({ users, orders, onUpdateAccountStatus, onViewOrderDetails, onReload }) => {
  const [selectedCustomerForInvoice, setSelectedCustomerForInvoice] = useState(null);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [selectedCustomerForOrders, setSelectedCustomerForOrders] = useState(null);

  const customers = users.filter(u => u.role === 'customer');

  const startEdit = (customer) => {
    setEditingCustomer(customer.id);
    setEditFormData({
      first_name: customer.first_name || '',
      last_name: customer.last_name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      company_name: customer.company_name || '',
      company_address: customer.company_address || '',
      company_postal_code: customer.company_postal_code || '',
      company_city: customer.company_city || '',
      tax_id: customer.tax_id || '',
      vat_id: customer.vat_id || '',
    });
  };

  const saveEdit = async (customerId) => {
    try {
      await api.patch(`/admin/users/${customerId}/profile`, editFormData);
      alert('Kundendaten erfolgreich aktualisiert!');
      setEditingCustomer(null);
      if (onReload) onReload();
    } catch (error) {
      console.error('Error updating customer:', error);
      alert('Fehler beim Aktualisieren der Kundendaten: ' + (error.response?.data?.error || error.message));
    }
  };

  const cancelEdit = () => {
    setEditingCustomer(null);
    setEditFormData({});
  };

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
                        <div className="flex items-center justify-end space-x-2 mb-2">
                          {getAccountStatusBadge(customer.account_status)}
                          {editingCustomer !== customer.id && (
                            <button
                              onClick={() => startEdit(customer)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Bearbeiten"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          ID: #{customer.id}
                        </p>
                        <p className="text-xs text-gray-500">
                          Seit: {new Date(customer.created_at).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    </div>

                    {/* Company Details or Edit Form */}
                    {editingCustomer === customer.id ? (
                      <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-3">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">
                          ✏️ Kundendaten bearbeiten
                        </h4>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Vorname</label>
                              <input
                                type="text"
                                value={editFormData.first_name}
                                onChange={(e) => setEditFormData({...editFormData, first_name: e.target.value})}
                                className="w-full px-2 py-1 text-sm border rounded"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Nachname</label>
                              <input
                                type="text"
                                value={editFormData.last_name}
                                onChange={(e) => setEditFormData({...editFormData, last_name: e.target.value})}
                                className="w-full px-2 py-1 text-sm border rounded"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Firmenname</label>
                            <input
                              type="text"
                              value={editFormData.company_name}
                              onChange={(e) => setEditFormData({...editFormData, company_name: e.target.value})}
                              className="w-full px-2 py-1 text-sm border rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Firmenadresse</label>
                            <input
                              type="text"
                              value={editFormData.company_address}
                              onChange={(e) => setEditFormData({...editFormData, company_address: e.target.value})}
                              className="w-full px-2 py-1 text-sm border rounded"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">PLZ</label>
                              <input
                                type="text"
                                value={editFormData.company_postal_code}
                                onChange={(e) => setEditFormData({...editFormData, company_postal_code: e.target.value})}
                                className="w-full px-2 py-1 text-sm border rounded"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Stadt</label>
                              <input
                                type="text"
                                value={editFormData.company_city}
                                onChange={(e) => setEditFormData({...editFormData, company_city: e.target.value})}
                                className="w-full px-2 py-1 text-sm border rounded"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Steuer-Nr</label>
                              <input
                                type="text"
                                value={editFormData.tax_id}
                                onChange={(e) => setEditFormData({...editFormData, tax_id: e.target.value})}
                                className="w-full px-2 py-1 text-sm border rounded"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">USt-IdNr</label>
                              <input
                                type="text"
                                value={editFormData.vat_id}
                                onChange={(e) => setEditFormData({...editFormData, vat_id: e.target.value})}
                                className="w-full px-2 py-1 text-sm border rounded"
                              />
                            </div>
                          </div>
                          <div className="flex space-x-2 pt-2">
                            <button
                              onClick={() => saveEdit(customer.id)}
                              className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Speichern
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                            >
                              Abbrechen
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : customer.company_name ? (
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
                    ) : null}

                    {/* Actions */}
                    <div className="flex space-x-2">
                      {editingCustomer !== customer.id && (
                        <>
                          <button
                            onClick={() => setSelectedCustomerForOrders(customer)}
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
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Customer Orders Modal */}
      {selectedCustomerForOrders && (
        <CustomerOrdersModal
          customer={selectedCustomerForOrders}
          orders={orders}
          onClose={() => setSelectedCustomerForOrders(null)}
          onViewDetails={onViewOrderDetails}
        />
      )}

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
