import React, { useState, useEffect } from 'react';
import { MapPin, Trash2, Edit2, Star, Clock } from 'lucide-react';
import api from '../services/api';

const SavedRoutesManager = ({ onSelectRoute }) => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRoute, setEditingRoute] = useState(null);

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/saved-routes');
      setRoutes(response.data.routes);
    } catch (error) {
      console.error('Error loading saved routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Möchten Sie diese Route wirklich löschen?')) return;

    try {
      await api.delete(`/saved-routes/${id}`);
      setRoutes(routes.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting route:', error);
      alert('Fehler beim Löschen der Route');
    }
  };

  const handleSelect = async (route) => {
    try {
      // Call parent callback with route data FIRST
      if (onSelectRoute) {
        onSelectRoute(route);
      }
      
      // Then increment usage count (don't wait for it)
      api.post(`/saved-routes/${route.id}/use`)
        .then(() => loadRoutes())
        .catch(err => console.error('Error incrementing usage:', err));
        
    } catch (error) {
      console.error('Error using route:', error);
      alert('Fehler beim Laden der Route');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Lade gespeicherte Routen...</p>
      </div>
    );
  }

  if (routes.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Keine gespeicherten Routen
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Erstellen Sie einen Auftrag und speichern Sie die Route für die zukünftige Verwendung.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Gespeicherte Routen ({routes.length})
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {routes.map((route) => (
          <div
            key={route.id}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white cursor-pointer"
            onClick={() => handleSelect(route)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 flex items-center">
                  <Star className="h-4 w-4 text-yellow-500 mr-2" />
                  {route.route_name}
                </h4>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  {route.usage_count > 0 && (
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {route.usage_count}x genutzt
                    </span>
                  )}
                  {route.last_used_at && (
                    <span>
                      Zuletzt: {new Date(route.last_used_at).toLocaleDateString('de-DE')}
                    </span>
                  )}
                </div>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(route.id);
                }}
                className="text-red-600 hover:text-red-800 p-1"
                title="Löschen"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-start">
                <MapPin className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-700">Abholung:</p>
                  <p className="text-gray-600">
                    {route.pickup_address}, {route.pickup_postal_code} {route.pickup_city}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <MapPin className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-700">Zustellung:</p>
                  <p className="text-gray-600">
                    {route.delivery_address}, {route.delivery_postal_code} {route.delivery_city}
                  </p>
                </div>
              </div>

              {route.cargo_description && (
                <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
                  <p>📦 {route.cargo_description}</p>
                  {route.cargo_weight && (
                    <p>⚖️ {route.cargo_weight} kg</p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(route);
                }}
                className="w-full py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
              >
                Route verwenden
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavedRoutesManager;
