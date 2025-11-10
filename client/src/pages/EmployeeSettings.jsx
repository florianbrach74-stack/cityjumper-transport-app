import { useState, useEffect } from 'react';
import { Users, Settings, CheckCircle, AlertCircle } from 'lucide-react';

const EmployeeSettings = () => {
  const [assignmentMode, setAssignmentMode] = useState('all_access');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/employee-assignment/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setAssignmentMode(data.assignmentMode);
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage({ type: 'error', text: 'Fehler beim Laden der Einstellungen' });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (mode) => {
    setSaving(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/employee-assignment/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ assignmentMode: mode })
      });

      if (response.ok) {
        setAssignmentMode(mode);
        setMessage({ type: 'success', text: 'Einstellungen erfolgreich gespeichert' });
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      setMessage({ type: 'error', text: 'Fehler beim Speichern der Einstellungen' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <Settings className="h-8 w-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-gray-900">Mitarbeiter-Einstellungen</h1>
        </div>
        <p className="text-gray-600">
          Legen Sie fest, wie Ihre Mitarbeiter Zugriff auf Aufträge erhalten
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          )}
          <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </p>
        </div>
      )}

      {/* Settings Card */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Users className="h-6 w-6 mr-2 text-primary-600" />
          Zugriffsmodus für Mitarbeiter
        </h2>

        <div className="space-y-4">
          {/* Option 1: All Access */}
          <label className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
            assignmentMode === 'all_access'
              ? 'border-primary-600 bg-primary-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}>
            <div className="flex items-start">
              <input
                type="radio"
                name="assignmentMode"
                value="all_access"
                checked={assignmentMode === 'all_access'}
                onChange={(e) => updateSettings(e.target.value)}
                disabled={saving}
                className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500"
              />
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium text-gray-900">
                    Alle Mitarbeiter sehen alle Aufträge
                  </span>
                  {assignmentMode === 'all_access' && (
                    <span className="px-3 py-1 bg-primary-600 text-white text-sm rounded-full">
                      Aktiv
                    </span>
                  )}
                </div>
                <p className="mt-1 text-gray-600">
                  Jeder Mitarbeiter hat Zugriff auf alle Aufträge, die Sie angenommen haben. 
                  Ideal für kleine Teams oder wenn alle Fahrer flexibel einsetzbar sind.
                </p>
                <div className="mt-3 space-y-1">
                  <p className="text-sm text-gray-500 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Schneller Zugriff für alle Mitarbeiter
                  </p>
                  <p className="text-sm text-gray-500 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Keine manuelle Zuweisung erforderlich
                  </p>
                  <p className="text-sm text-gray-500 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Flexible Team-Organisation
                  </p>
                </div>
              </div>
            </div>
          </label>

          {/* Option 2: Manual Assignment */}
          <label className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
            assignmentMode === 'manual_assignment'
              ? 'border-primary-600 bg-primary-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}>
            <div className="flex items-start">
              <input
                type="radio"
                name="assignmentMode"
                value="manual_assignment"
                checked={assignmentMode === 'manual_assignment'}
                onChange={(e) => updateSettings(e.target.value)}
                disabled={saving}
                className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500"
              />
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium text-gray-900">
                    Aufträge einzeln zuweisen
                  </span>
                  {assignmentMode === 'manual_assignment' && (
                    <span className="px-3 py-1 bg-primary-600 text-white text-sm rounded-full">
                      Aktiv
                    </span>
                  )}
                </div>
                <p className="mt-1 text-gray-600">
                  Sie weisen jeden Auftrag manuell einem bestimmten Mitarbeiter zu. 
                  Mitarbeiter sehen nur ihre zugewiesenen Aufträge. Ideal für große Teams oder spezialisierte Fahrer.
                </p>
                <div className="mt-3 space-y-1">
                  <p className="text-sm text-gray-500 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Gezielte Zuweisung an qualifizierte Fahrer
                  </p>
                  <p className="text-sm text-gray-500 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Klare Verantwortlichkeiten
                  </p>
                  <p className="text-sm text-gray-500 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Bessere Kontrolle bei vielen Aufträgen
                  </p>
                </div>
              </div>
            </div>
          </label>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Hinweis:</p>
              <p>
                Sie können diese Einstellung jederzeit ändern. Bei Wechsel zu "Aufträge einzeln zuweisen" 
                bleiben bestehende Aufträge für alle Mitarbeiter sichtbar, bis Sie sie neu zuweisen.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Status */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="font-medium text-gray-900 mb-2">Aktueller Status</h3>
        <div className="flex items-center space-x-2">
          <div className={`h-3 w-3 rounded-full ${
            assignmentMode === 'all_access' ? 'bg-green-500' : 'bg-blue-500'
          }`}></div>
          <span className="text-gray-700">
            {assignmentMode === 'all_access' 
              ? 'Alle Mitarbeiter haben Zugriff auf alle Aufträge'
              : 'Aufträge müssen einzeln zugewiesen werden'
            }
          </span>
        </div>
      </div>
    </div>
  );
};

export default EmployeeSettings;
