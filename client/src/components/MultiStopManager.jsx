import { useState } from 'react';
import { Plus, Trash2, MapPin } from 'lucide-react';
import AddressSearch from './AddressSearch';

export default function MultiStopManager({ type, stops, onStopsChange, mainDeliveryTimeEnd }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStop, setNewStop] = useState({
    address: '',
    city: '',
    postal_code: '',
    country: 'Deutschland',
    contact_name: '',
    contact_phone: '',
    notes: '',
    time_start: '',
    time_end: ''
  });

  const handleAddStop = () => {
    if (!newStop.address || !newStop.city) {
      alert('Bitte Adresse und Stadt eingeben');
      return;
    }
    
    // For delivery stops, contact_name is required
    if (type === 'delivery' && !newStop.contact_name) {
      alert('Bitte Empfängername eingeben (wird für CMR Feld 2 benötigt)');
      return;
    }
    
    // For delivery stops, validate time windows
    if (type === 'delivery' && mainDeliveryTimeEnd) {
      if (!newStop.time_start || !newStop.time_end) {
        alert('Bitte Zeitfenster eingeben');
        return;
      }
      
      // time_start must be >= mainDeliveryTimeEnd
      if (newStop.time_start < mainDeliveryTimeEnd) {
        alert(`Zustellung VON muss nach der Hauptzustellung (${mainDeliveryTimeEnd}) sein`);
        return;
      }
      
      // time_end must be at least 10 minutes after time_start
      const [startH, startM] = newStop.time_start.split(':').map(Number);
      const [endH, endM] = newStop.time_end.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      
      if (endMinutes < startMinutes + 10) {
        alert('Zustellung BIS muss mindestens 10 Minuten nach Zustellung VON sein');
        return;
      }
    }

    onStopsChange([...stops, { ...newStop }]);
    
    // Reset form
    setNewStop({
      address: '',
      city: '',
      postal_code: '',
      country: 'Deutschland',
      contact_name: '',
      contact_phone: '',
      notes: '',
      time_start: '',
      time_end: ''
    });
    
    // Close form automatically after adding
    setShowAddForm(false);
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
                {type === 'delivery' ? 'Empfängername *' : 'Kontaktperson'}
              </label>
              <input
                type="text"
                value={newStop.contact_name}
                onChange={(e) => setNewStop({ ...newStop, contact_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={type === 'delivery'}
                placeholder={type === 'delivery' ? 'z.B. Max Mustermann' : ''}
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
          
          {/* Time fields for delivery stops */}
          {type === 'delivery' && mainDeliveryTimeEnd && (
            <div className="grid grid-cols-2 gap-3 bg-blue-50 p-3 rounded-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zustellung VON * (frühestens {mainDeliveryTimeEnd})
                </label>
                <input
                  type="time"
                  value={newStop.time_start}
                  onChange={(e) => setNewStop({ ...newStop, time_start: e.target.value })}
                  min={mainDeliveryTimeEnd}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zustellung BIS * (mind. +10 Min)
                </label>
                <input
                  type="time"
                  value={newStop.time_end}
                  onChange={(e) => setNewStop({ ...newStop, time_end: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          )}
          
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
                  {stop.time_start && stop.time_end && (
                    <p className="text-sm text-blue-600 font-medium">
                      ⏰ {stop.time_start} - {stop.time_end}
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
