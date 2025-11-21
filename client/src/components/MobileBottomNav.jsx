import React from 'react';
import { Package, Truck, FileText, Menu } from 'lucide-react';

const MobileBottomNav = ({ activeTab, setActiveTab, counts, onMenuClick }) => {
  const navItems = [
    {
      id: 'available',
      label: 'Verfügbar',
      icon: Package,
      count: counts.available,
      color: 'text-blue-600'
    },
    {
      id: 'my-orders',
      label: 'Aktiv',
      icon: Truck,
      count: counts.active,
      color: 'text-green-600'
    },
    {
      id: 'my-bids',
      label: 'Bewerbungen',
      icon: FileText,
      count: counts.bids,
      color: 'text-purple-600'
    },
    {
      id: 'menu',
      label: 'Mehr',
      icon: Menu,
      color: 'text-gray-600',
      isMenu: true
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 md:hidden">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => item.isMenu ? onMenuClick() : setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                isActive 
                  ? `${item.color} bg-gray-50` 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="relative">
                <Icon className="h-6 w-6" />
                {item.count > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {item.count > 99 ? '99+' : item.count}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;
