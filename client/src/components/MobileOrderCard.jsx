import React from 'react';
import { MapPin, Calendar, Package, Euro, Clock, Truck, ArrowRight } from 'lucide-react';
import { formatPrice } from '../utils/formatPrice';

const MobileOrderCard = ({ order, onAction, actionLabel, actionColor = 'blue', showDetails = true }) => {
  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: 'Ausstehend', color: 'bg-yellow-100 text-yellow-800' },
      accepted: { label: 'Akzeptiert', color: 'bg-blue-100 text-blue-800' },
      in_transit: { label: 'Unterwegs', color: 'bg-purple-100 text-purple-800' },
      delivered: { label: 'Zugestellt', color: 'bg-green-100 text-green-800' },
      completed: { label: 'Abgeschlossen', color: 'bg-gray-100 text-gray-800' }
    };
    return badges[status] || badges.pending;
  };

  const status = getStatusBadge(order.status);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-600">Auftrag #{order.id}</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>
        
        {/* Route */}
        <div className="flex items-center space-x-2 text-sm">
          <div className="flex-1">
            <div className="flex items-center space-x-1 text-gray-700">
              <MapPin className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span className="font-medium truncate">{order.pickup_city}</span>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center space-x-1 text-gray-700">
              <MapPin className="h-4 w-4 text-red-600 flex-shrink-0" />
              <span className="font-medium truncate">{order.delivery_city}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Date & Time */}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <span>{new Date(order.pickup_date).toLocaleDateString('de-DE')}</span>
          {order.pickup_time && (
            <>
              <Clock className="h-4 w-4 text-blue-600 flex-shrink-0 ml-2" />
              <span>{order.pickup_time}</span>
            </>
          )}
        </div>

        {/* Vehicle Type */}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Truck className="h-4 w-4 text-purple-600 flex-shrink-0" />
          <span>{order.vehicle_type}</span>
        </div>

        {/* Description (if available) */}
        {showDetails && order.description && (
          <div className="flex items-start space-x-2 text-sm text-gray-600">
            <Package className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-2">{order.description}</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <Euro className="h-5 w-5 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">
              {formatPrice(order.price)}
            </span>
          </div>
          
          {/* Action Button */}
          {onAction && actionLabel && (
            <button
              onClick={() => onAction(order)}
              className={`px-4 py-2 bg-${actionColor}-600 text-white rounded-lg font-medium text-sm hover:bg-${actionColor}-700 transition-colors shadow-sm`}
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileOrderCard;
