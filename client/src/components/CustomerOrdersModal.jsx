import React from 'react';
import { X, MapPin, Calendar, Package } from 'lucide-react';
import { formatPrice } from '../utils/formatPrice';

const CustomerOrdersModal = ({ customer, orders, onClose, onViewDetails }) => {
  const customerOrders = orders.filter(o => o.customer_id === customer.id);

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      in_transit: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    const labels = {
      pending: 'Ausstehend',
      accepted: 'Akzeptiert',
      in_transit: 'Unterwegs',
      completed: 'Abgeschlossen',
      cancelled: 'Storniert'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Aufträge von {customer.company_name || `${customer.first_name} ${customer.last_name}`}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {customerOrders.length} Auftrag{customerOrders.length !== 1 ? 'e' : ''} gefunden
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {customerOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Dieser Kunde hat noch keine Aufträge erstellt</p>
            </div>
          ) : (
            <div className="space-y-4">
              {customerOrders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center space-x-3">
                        <h4 className="font-semibold text-gray-900">
                          Auftrag #{order.id}
                        </h4>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Erstellt am {new Date(order.created_at).toLocaleString('de-DE')}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary-600">
                        {formatPrice(order.price)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="flex items-center text-gray-600 mb-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="font-medium">Abholung:</span>
                      </div>
                      <div className="ml-5">
                        <div>{order.pickup_address}</div>
                        <div>{order.pickup_postal_code} {order.pickup_city}</div>
                        <div className="text-gray-500">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {new Date(order.pickup_date).toLocaleDateString('de-DE')} um {order.pickup_time}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center text-gray-600 mb-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="font-medium">Zustellung:</span>
                      </div>
                      <div className="ml-5">
                        <div>{order.delivery_address}</div>
                        <div>{order.delivery_postal_code} {order.delivery_city}</div>
                        <div className="text-gray-500">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {new Date(order.delivery_date).toLocaleDateString('de-DE')} um {order.delivery_time}
                        </div>
                      </div>
                    </div>
                  </div>

                  {order.contractor_first_name && (
                    <div className="mt-3 pt-3 border-t text-sm">
                      <span className="text-gray-600">Auftragnehmer:</span>{' '}
                      <span className="font-medium">
                        {order.contractor_company || `${order.contractor_first_name} ${order.contractor_last_name}`}
                      </span>
                    </div>
                  )}

                  <div className="mt-3 flex space-x-2">
                    <button
                      onClick={() => {
                        onViewDetails(order.id);
                        onClose();
                      }}
                      className="flex-1 px-3 py-2 text-sm border border-primary-600 text-primary-600 rounded hover:bg-primary-50"
                    >
                      Details ansehen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerOrdersModal;
