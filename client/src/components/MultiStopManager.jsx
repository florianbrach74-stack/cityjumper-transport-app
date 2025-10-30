import { useState } from 'react';
import { Plus, Trash2, MapPin } from 'lucide-react';
import AddressSearch from './AddressSearch';

export default function MultiStopManager({ type, stops, onStopsChange }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStop, setNewStop] = useState({
    address: '',
    city: '',
    postal_code: '',
    country: 'Deutschland',
    contact_name: '',
    contact_phone: '',
    notes: ''
  });

  const handleAddStop = () => {
    if (!newStop.address || !newStop.city) {
      alert('Bitte Adresse und Stadt eingeben');
      return;
    }

    onStopsChange([...stops, { ...newStop }]);
    
    // Reset form but keep it open for adding more stops
    setNewStop({
      address: '',
      city: '',
      postal_code: '',
      country: 'Deutschland',
      contact_name: '',
      contact_phone: '',
      notes: ''
    });
    // Keep form open so user can add multiple stops easily
    // setShowAddForm(false); // Commented out to keep form open
  };

  const handleRemoveStop = (index) => {
    onStopsChange(stops.filter((_, i) => i !== index));
  };

  const handleAddressSelect = (address) => {
    setNewStop({
      ...newStop,
      address: `${address.street} ${address.houseNumber}`.trim(),
      city: address.city,
      postal_code: address.postalCode,
      country: address.country
    });
  };

  const typeLabel = type === 'pickup' ? 'Abholung' : 'Zustellung';
  const typeColor = type === 'pickup' ? 'blue' : 'green';

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <h5 className="font-medium text-gray-900">
            Zusätzliche {typeLabel}en ({stops.length})
          </h5>
          <p className="text-xs text-gray-500 mt-0.5">
            Sie können beliebig viele {typeLabel}en hinzufügen (je +6€)
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className={`px-3 py-1.5 bg-${typeColor}-600 text-white rounded-md hover:bg-${typeColor}-700 text-sm flex items-center space-x-1 flex-shrink-0`}
        >
          {showAddForm ? (
            <>
              <span>✕ Schließen</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>{typeLabel} hinzufügen</span>
            </>
          )}
        </button>
      </div>

      {showAddForm && (
        <div className={`bg-${typeColor}-50 border border-${typeColor}-200 rounded-lg p-4 space-y-3`}>
          <AddressSearch
            label={`${typeLabel}sadresse`}
            value={newStop.address}
            onChange={(value) => setNewStop({ ...newStop, address: value })}
            onAddressSelect={handleAddressSelect}
            required
          />
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stadt *
              </label>
              <input
                type="text"
                value={newStop.city}
                onChange={(e) => setNewStop({ ...newStop, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PLZ
              </label>
              <input
                type="text"
                value={newStop.postal_code}
                onChange={(e) => setNewStop({ ...newStop, postal_code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kontaktperson
              </label>
              <input
                type="text"
                value={newStop.contact_name}
                onChange={(e) => setNewStop({ ...newStop, contact_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefon
              </label>
              <input
                type="tel"
                value={newStop.contact_phone}
                onChange={(e) => setNewStop({ ...newStop, contact_phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notizen
            </label>
            <textarea
              value={newStop.notes}
              onChange={(e) => setNewStop({ ...newStop, notes: e.target.value })}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="z.B. Besondere Hinweise..."
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAddStop}
              className={`flex-1 px-4 py-2 bg-${typeColor}-600 text-white rounded-md hover:bg-${typeColor}-700 font-medium flex items-center justify-center space-x-2`}
            >
              <Plus className="h-4 w-4" />
              <span>{typeLabel} hinzufügen</span>
            </button>
            {stops.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
              >
                Fertig
              </button>
            )}
          </div>
        </div>
      )}

      {stops.length > 0 && (
        <div className="space-y-2">
          {stops.map((stop, index) => (
            <div key={index} className={`border border-${typeColor}-200 rounded-lg p-3 bg-white`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <MapPin className={`h-4 w-4 text-${typeColor}-600`} />
                    <span className="font-medium text-gray-900">
                      {typeLabel} #{index + 1}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900">{stop.address}</p>
                  <p className="text-sm text-gray-600">
                    {stop.postal_code} {stop.city}
                  </p>
                  {stop.contact_name && (
                    <p className="text-sm text-gray-600">
                      Kontakt: {stop.contact_name} {stop.contact_phone}
                    </p>
                  )}
                  {stop.notes && (
                    <p className="text-xs text-gray-500 mt-1 italic">{stop.notes}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveStop(index)}
                  className="ml-3 text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {stops.length === 0 && !showAddForm && (
        <p className="text-sm text-gray-500 text-center py-4">
          Keine zusätzlichen {typeLabel}en
        </p>
      )}
    </div>
  );
}
