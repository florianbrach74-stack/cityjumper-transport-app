import { useState, useEffect } from 'react';
import api from '../services/api';
import { Bell, Plus, X, AlertCircle } from 'lucide-react';

export default function NotificationSettings() {
  const [postalCodes, setPostalCodes] = useState([]);
  const [newPostalCode, setNewPostalCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/profile');
      setPostalCodes(response.data.user.notification_postal_codes || []);
    } catch (error) {
      console.error('Error loading settings:', error);
      setError('Fehler beim Laden der Einstellungen');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPostalCode = () => {
    const trimmed = newPostalCode.trim();
    
    if (!trimmed) {
      setError('Bitte geben Sie eine Postleitzahl ein');
      return;
    }

    if (!/^\d{5}$/.test(trimmed)) {
      setError('Postleitzahl muss 5 Ziffern haben');
      return;
    }

    if (postalCodes.includes(trimmed)) {
      setError('Diese Postleitzahl ist bereits hinzugefügt');
      return;
    }

    setPostalCodes([...postalCodes, trimmed]);
    setNewPostalCode('');
    setError('');
  };

  const handleRemovePostalCode = (code) => {
    setPostalCodes(postalCodes.filter(pc => pc !== code));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      await api.put('/contractors/notification-settings', {
        notification_postal_codes: postalCodes
      });

      setSuccess('Einstellungen erfolgreich gespeichert!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Fehler beim Speichern der Einstellungen');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Lade Einstellungen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          <Bell className="h-6 w-6 text-primary-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Benachrichtigungseinstellungen</h2>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Legen Sie fest, für welche Postleitzahlengebiete Sie per E-Mail über neue Aufträge informiert werden möchten.
        </p>
      </div>

      <div className="p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2 mb-4">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center space-x-2 mb-4">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">{success}</span>
          </div>
        )}

        {/* Add Postal Code */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Postleitzahl hinzufügen
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={newPostalCode}
              onChange={(e) => setNewPostalCode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddPostalCode()}
              placeholder="z.B. 10115"
              maxLength={5}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={handleAddPostalCode}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center"
            >
              <Plus className="h-5 w-5 mr-1" />
              Hinzufügen
            </button>
          </div>
        </div>

        {/* Postal Codes List */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ihre Postleitzahlengebiete ({postalCodes.length})
          </label>
          
          {postalCodes.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Noch keine Postleitzahlen hinzugefügt</p>
              <p className="text-sm text-gray-500 mt-1">
                Fügen Sie Postleitzahlen hinzu, um über neue Aufträge informiert zu werden
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {postalCodes.map((code) => (
                <div
                  key={code}
                  className="bg-primary-50 border border-primary-200 rounded-lg px-3 py-2 flex items-center justify-between"
                >
                  <span className="font-medium text-primary-700">{code}</span>
                  <button
                    onClick={() => handleRemovePostalCode(code)}
                    className="text-primary-600 hover:text-primary-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Speichern...' : 'Einstellungen speichern'}
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">ℹ️ Wie funktioniert es?</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Sie erhalten eine E-Mail, wenn ein neuer Auftrag in Ihrem PLZ-Gebiet erstellt wird</li>
            <li>• In der E-Mail sehen Sie nur PLZ und Stadt (keine Kundendaten)</li>
            <li>• Nach Zuweisung durch den Admin erhalten Sie alle Details</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
