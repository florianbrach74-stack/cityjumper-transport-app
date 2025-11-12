import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Home, LayoutDashboard, Settings, Package } from 'lucide-react';
import Logo from './Logo';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from '../hooks/useTranslation';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getRoleLabel = (role) => {
    const labels = {
      customer: 'Kunde',
      contractor: 'Auftragnehmer',
      employee: 'Mitarbeiter',
      admin: 'Administrator'
    };
    return labels[role] || role;
  };

  return (
    <nav className="bg-white/95 backdrop-blur-sm shadow-soft border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-6">
            <Link to="/">
              <Logo size="md" showText={true} />
            </Link>
            
            <Link
              to="/"
              className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>{t('nav.home')}</span>
            </Link>

            <Link
              to="/dashboard"
              className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Package className="h-4 w-4" />
              <span>{t('nav.dashboard')}</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <div className="flex items-center space-x-3 px-4 py-2 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="bg-primary-100 p-2 rounded-full">
                  <User className="h-4 w-4 text-primary-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-900">
                    {user?.first_name} {user?.last_name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {getRoleLabel(user?.role)}
                  </span>
                </div>
              </div>
            </div>

            <Link
              to="/settings"
              className="flex items-center space-x-2 bg-gray-50 text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            >
              <Settings className="h-4 w-4" />
              <span>{t('nav.settings')}</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            >
              <LogOut className="h-4 w-4" />
              <span>{t('nav.logout')}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
