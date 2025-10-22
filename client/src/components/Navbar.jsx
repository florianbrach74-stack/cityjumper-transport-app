import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Truck, LogOut, User, Package } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <Truck className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">CityJumper</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/dashboard"
              className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              <Package className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>

            <div className="flex items-center space-x-2 text-sm text-gray-700">
              <User className="h-4 w-4" />
              <span className="font-medium">
                {user?.first_name} {user?.last_name}
              </span>
              <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded">
                {user?.role === 'customer' ? 'Kunde' : 'Auftragnehmer'}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              <LogOut className="h-4 w-4" />
              <span>Abmelden</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
