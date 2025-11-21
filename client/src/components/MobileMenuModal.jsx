import React from 'react';
import { X, BarChart3, Users, Bell, CheckCircle, AlertCircle } from 'lucide-react';

const MobileMenuModal = ({ isOpen, onClose, activeTab, setActiveTab, counts, pendingPenaltiesTotal }) => {
  if (!isOpen) return null;

  const menuItems = [
    {
      id: 'completed',
      label: 'Abgeschlossene Aufträge',
      icon: CheckCircle,
      count: counts.completed,
      color: 'text-gray-600'
    },
    {
      id: 'reports',
      label: 'Abrechnungen',
      icon: BarChart3,
      color: 'text-purple-600'
    },
    {
      id: 'employees',
      label: 'Mitarbeiter',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      id: 'notifications',
      label: 'Benachrichtigungen',
      icon: Bell,
      color: 'text-orange-600'
    }
  ];

  const handleItemClick = (id) => {
    setActiveTab(id);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl z-50 md:hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Weitere Optionen</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Penalties Warning (if any) */}
        {pendingPenaltiesTotal > 0 && (
          <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">Offene Strafen</p>
              <p className="text-sm text-red-700">
                Sie haben offene Strafen in Höhe von €{pendingPenaltiesTotal.toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Menu Items */}
        <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 border-2 border-blue-500'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`h-6 w-6 ${isActive ? 'text-blue-600' : item.color}`} />
                  <span className={`font-medium ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
                    {item.label}
                  </span>
                </div>
                {item.count > 0 && (
                  <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 font-bold">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Safe Area for iOS */}
        <div className="h-safe-area-inset-bottom" />
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default MobileMenuModal;
