import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, User, Truck } from 'lucide-react';
import api from '../services/api';

const RoleSwitcher = () => {
  const navigate = useNavigate();
  const [availableRoles, setAvailableRoles] = useState([]);
  const [currentRole, setCurrentRole] = useState('');
  const [canSwitch, setCanSwitch] = useState(false);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    fetchAvailableRoles();
  }, []);

  const fetchAvailableRoles = async () => {
    try {
      const response = await api.get('/user/available-roles');
      setAvailableRoles(response.data.availableRoles);
      setCurrentRole(response.data.currentRole);
      setCanSwitch(response.data.canSwitch);
    } catch (error) {
      console.error('Error fetching available roles:', error);
    }
  };

  const handleRoleSwitch = async () => {
    if (!canSwitch) return;

    const targetRole = currentRole === 'contractor' ? 'customer' : 'contractor';

    try {
      setSwitching(true);
      const response = await api.post('/user/switch-role', { targetRole });

      // Update token
      localStorage.setItem('token', response.data.token);
      
      // Update user data
      const updatedUser = {
        ...JSON.parse(localStorage.getItem('user') || '{}'),
        role: response.data.role
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Navigate to appropriate dashboard
      if (targetRole === 'customer') {
        navigate('/customer-dashboard');
      } else {
        navigate('/contractor-dashboard');
      }

      // Reload to update UI
      window.location.reload();

    } catch (error) {
      console.error('Error switching role:', error);
      alert('Fehler beim Wechseln der Rolle');
    } finally {
      setSwitching(false);
    }
  };

  // Don't show if user can't switch
  if (!canSwitch) return null;

  const getRoleInfo = (role) => {
    if (role === 'contractor') {
      return {
        label: 'Auftragnehmer',
        icon: Truck,
        color: 'blue',
        description: 'Aufträge annehmen & ausführen'
      };
    }
    return {
      label: 'Kunde',
      icon: User,
      color: 'green',
      description: 'Aufträge erstellen'
    };
  };

  const currentRoleInfo = getRoleInfo(currentRole);
  const targetRole = currentRole === 'contractor' ? 'customer' : 'contractor';
  const targetRoleInfo = getRoleInfo(targetRole);
  const CurrentIcon = currentRoleInfo.icon;
  const TargetIcon = targetRoleInfo.icon;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 bg-${currentRoleInfo.color}-100 rounded-lg`}>
            <CurrentIcon className={`h-5 w-5 text-${currentRoleInfo.color}-600`} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              Aktuelle Rolle: {currentRoleInfo.label}
            </p>
            <p className="text-xs text-gray-500">{currentRoleInfo.description}</p>
          </div>
        </div>

        <button
          onClick={handleRoleSwitch}
          disabled={switching}
          className={`flex items-center space-x-2 px-4 py-2 bg-${targetRoleInfo.color}-600 text-white rounded-lg hover:bg-${targetRoleInfo.color}-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {switching ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">Wechsle...</span>
            </>
          ) : (
            <>
              <TargetIcon className="h-4 w-4" />
              <span className="text-sm font-medium">
                Zu {targetRoleInfo.label} wechseln
              </span>
            </>
          )}
        </button>
      </div>

      {/* Mobile View - Refresh Button */}
      <div className="mt-3 md:hidden">
        <button
          onClick={() => window.location.reload()}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <RefreshCw className="h-5 w-5" />
          <span className="font-medium">Seite aktualisieren</span>
        </button>
      </div>
    </div>
  );
};

export default RoleSwitcher;
