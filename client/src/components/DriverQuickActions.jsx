import React from 'react';
import { CheckCircle, Package, AlertCircle, Phone, Navigation } from 'lucide-react';

const DriverQuickActions = ({ order, onPickupStart, onDeliveryComplete, onReportProblem, onContactCustomer }) => {
  if (!order) return null;

  const getActionButtons = () => {
    switch (order.status) {
      case 'accepted':
        return (
          <button
            onClick={() => onPickupStart(order)}
            className="flex flex-col items-center justify-center p-4 bg-green-600 text-white rounded-lg shadow-lg active:bg-green-700 min-h-[100px]"
          >
            <CheckCircle className="h-10 w-10 mb-2" />
            <span className="text-base font-semibold">Abholung starten</span>
          </button>
        );
      
      case 'in_transit':
        return (
          <button
            onClick={() => onDeliveryComplete(order)}
            className="flex flex-col items-center justify-center p-4 bg-blue-600 text-white rounded-lg shadow-lg active:bg-blue-700 min-h-[100px]"
          >
            <Package className="h-10 w-10 mb-2" />
            <span className="text-base font-semibold">Zustellung abschließen</span>
          </button>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-md">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Schnellaktionen</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Main Action */}
        <div className="col-span-2">
          {getActionButtons()}
        </div>

        {/* Secondary Actions */}
        <button
          onClick={() => onReportProblem(order)}
          className="flex flex-col items-center justify-center p-3 bg-red-50 text-red-700 rounded-lg border-2 border-red-200 active:bg-red-100 min-h-[80px]"
        >
          <AlertCircle className="h-7 w-7 mb-1" />
          <span className="text-sm font-medium">Problem melden</span>
        </button>

        <button
          onClick={() => onContactCustomer(order)}
          className="flex flex-col items-center justify-center p-3 bg-gray-50 text-gray-700 rounded-lg border-2 border-gray-200 active:bg-gray-100 min-h-[80px]"
        >
          <Phone className="h-7 w-7 mb-1" />
          <span className="text-sm font-medium">Kunde anrufen</span>
        </button>

        {/* Navigation */}
        {order.pickup_address && (
          <button
            onClick={() => {
              const address = order.status === 'accepted' 
                ? `${order.pickup_address}, ${order.pickup_city}` 
                : `${order.delivery_address}, ${order.delivery_city}`;
              window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
            }}
            className="col-span-2 flex items-center justify-center p-3 bg-blue-50 text-blue-700 rounded-lg border-2 border-blue-200 active:bg-blue-100"
          >
            <Navigation className="h-6 w-6 mr-2" />
            <span className="text-sm font-medium">
              Navigation zu {order.status === 'accepted' ? 'Abholung' : 'Zustellung'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default DriverQuickActions;
