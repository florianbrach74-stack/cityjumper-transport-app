import { useState, useEffect } from 'react';
import { DollarSign, Save, RotateCcw, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';

export default function PricingSettings() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [editedValues, setEditedValues] = useState({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/pricing/settings`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSettings(response.data.settings);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching pricing settings:', error);
      setMessage({ type: 'error', text: 'Fehler beim Laden der Einstellungen' });
      setLoading(false);
    }
  };

  const handleValueChange = (key, value) => {
    setEditedValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async (key) => {
    setSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      const value = editedValues[key];

      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/pricing/settings/${key}`,
        { value },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage({ type: 'success', text: 'Einstellung erfolgreich gespeichert' });
      
      // Remove from edited values
      const newEdited = { ...editedValues };
      delete newEdited[key];
      setEditedValues(newEdited);

      // Refresh settings
      await fetchSettings();
    } catch (error) {
      console.error('Error saving setting:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Fehler beim Speichern' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Möchten Sie wirklich alle Einstellungen auf die Standardwerte zurücksetzen?')) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/pricing/settings/reset`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage({ type: 'success', text: 'Alle Einstellungen wurden zurückgesetzt' });
      setEditedValues({});
      await fetchSettings();
    } catch (error) {
      console.error('Error resetting settings:', error);
      setMessage({ type: 'error', text: 'Fehler beim Zurücksetzen' });
    } finally {
      setSaving(false);
    }
  };

  const getSettingLabel = (key) => {
    const labels = {
      'distance_price_under_100km': 'Distanzpreis unter 100km',
      'distance_price_over_100km': 'Distanzpreis über 100km',
      'hourly_rate': 'Stundensatz',
      'start_fee': 'Startgebühr',
      'extra_stop_fee': 'Extra-Stop-Gebühr',
      'platform_commission': 'Plattform-Provision',
      'recommended_markup': 'Empfohlener Aufschlag',
      'waiting_time_free_minutes': 'Kostenlose Wartezeit',
      'waiting_time_block_minutes': 'Wartezeit-Block',
      'waiting_time_block_price': 'Preis pro Wartezeit-Block'
    };
    return labels[key] || key;
  };

  const getSettingCategory = (key) => {
    if (key.includes('distance')) return 'Distanz';
    if (key.includes('hourly') || key.includes('start') || key.includes('extra_stop')) return 'Basis-Gebühren';
    if (key.includes('commission') || key.includes('markup')) return 'Margen';
    if (key.includes('waiting')) return 'Wartezeit';
    return 'Sonstiges';
  };

  const groupedSettings = settings.reduce((acc, setting) => {
    const category = getSettingCategory(setting.setting_key);
    if (!acc[category]) acc[category] = [];
    acc[category].push(setting);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <DollarSign className="h-6 w-6 mr-2 text-primary-600" />
            Preiskalkulation-Einstellungen
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Passen Sie die Parameter für die automatische Preisberechnung an
          </p>
        </div>
        <button
          onClick={handleReset}
          disabled={saving}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Auf Standard zurücksetzen
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-start ${
          message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
          )}
          <p className={`text-sm ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
            {message.text}
          </p>
        </div>
      )}

      {/* Settings by Category */}
      {Object.entries(groupedSettings).map(([category, categorySettings]) => (
        <div key={category} className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {categorySettings.map((setting) => {
              const currentValue = editedValues[setting.setting_key] !== undefined 
                ? editedValues[setting.setting_key] 
                : setting.setting_value;
              const hasChanges = editedValues[setting.setting_key] !== undefined;

              return (
                <div key={setting.setting_key} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        {getSettingLabel(setting.setting_key)}
                      </label>
                      <p className="text-sm text-gray-500 mb-3">
                        {setting.description}
                      </p>
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            value={currentValue}
                            onChange={(e) => handleValueChange(setting.setting_key, e.target.value)}
                            className={`w-32 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                              hasChanges ? 'border-orange-400 bg-orange-50' : 'border-gray-300'
                            }`}
                          />
                          <span className="absolute right-3 top-2 text-sm text-gray-500">
                            {setting.setting_unit}
                          </span>
                        </div>
                        {hasChanges && (
                          <button
                            onClick={() => handleSave(setting.setting_key)}
                            disabled={saving}
                            className="flex items-center px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm font-medium"
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Speichern
                          </button>
                        )}
                      </div>
                      {setting.updated_at && (
                        <p className="text-xs text-gray-400 mt-2">
                          Zuletzt aktualisiert: {new Date(setting.updated_at).toLocaleString('de-DE')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Wichtige Hinweise:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Änderungen wirken sich sofort auf neue Aufträge aus</li>
              <li>Bestehende Aufträge behalten ihre ursprünglichen Preise</li>
              <li>Die Plattform-Provision bestimmt, wie viel der Auftragnehmer erhält (100% - Provision)</li>
              <li>Der empfohlene Aufschlag wird Kunden als Standardpreis vorgeschlagen</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
