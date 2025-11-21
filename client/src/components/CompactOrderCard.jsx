import React from 'react';
import { MapPin, Calendar, Euro, Truck } from 'lucide-react';

const CompactOrderCard = ({ order, onDetails, onAccept, showAccept = true }) => {
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      in_transit: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-sm text-gray-900">#{order.id}</span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
          {order.status}
        </span>
      </div>

      {/* Route */}
      <div className="flex items-center text-xs text-gray-600 mb-2">
        <MapPin className="h-3 w-3 mr-1 flex-shrink-0 text-green-600" />
        <span className="truncate">{order.pickup_city}</span>
        <span className="mx-1">→</span>
        <MapPin className="h-3 w-3 mr-1 flex-shrink-0 text-red-600" />
        <span className="truncate">{order.delivery_city}</span>
      </div>

      {/* Info Row */}
      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
        <div className="flex items-center">
          <Calendar className="h-3 w-3 mr-1" />
          <span>{new Date(order.pickup_date).toLocaleDateString('de-DE')}</span>
        </div>
        <div className="flex items-center">
          <Truck className="h-3 w-3 mr-1" />
          <span>{order.vehicle_type}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
        <div className="flex items-center">
          <Euro className="h-4 w-4 text-green-600 mr-1" />
          <span className="text-lg font-bold text-green-600">
            {parseFloat(order.price || 0).toFixed(2)}
          </span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onDetails(order)}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
          >
            Details
          </button>
          {showAccept && (
            <button
              onClick={() => onAccept(order)}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              Annehmen
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompactOrderCard;
