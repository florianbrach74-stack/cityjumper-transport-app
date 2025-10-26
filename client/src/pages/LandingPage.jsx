import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, MapPin, Clock, Shield, Euro, ArrowRight, CheckCircle, LogIn, LogOut, User } from 'lucide-react';
import AddressSearch from '../components/AddressSearch';

export default function LandingPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
  };
  const [pickupAddress, setPickupAddress] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pickupPostalCode, setPickupPostalCode] = useState('');
  const [deliveryPostalCode, setDeliveryPostalCode] = useState('');
  const [vehicleType, setVehicleType] = useState('Kleintransporter');
  const [calculatedPrice, setCalculatedPrice] = useState(null);

  const vehicleTypes = [
    { name: 'Kleintransporter', basePrice: 80, pricePerKm: 1.2 },
    { name: 'Mittlerer Transporter', basePrice: 120, pricePerKm: 1.5 },
    { name: 'Großer Transporter', basePrice: 180, pricePerKm: 2.0 },
    { name: 'Transporter mit Hebebühne', basePrice: 200, pricePerKm: 2.5 },
  ];

  const calculateDistance = (zip1, zip2) => {
    // Vereinfachte Distanzberechnung basierend auf PLZ-Differenz
    // In Produktion: Google Maps Distance Matrix API verwenden
    const diff = Math.abs(parseInt(zip1) - parseInt(zip2));
    return Math.max(10, diff / 100); // Mindestens 10km
  };

  const handleCalculatePrice = () => {
    if (!pickupPostalCode || !deliveryPostalCode) {
      alert('Bitte geben Sie beide Postleitzahlen ein');
      return;
    }

    const vehicle = vehicleTypes.find(v => v.name === vehicleType);
    const distance = calculateDistance(pickupPostalCode, deliveryPostalCode);
    const price = vehicle.basePrice + (distance * vehicle.pricePerKm);
    
    setCalculatedPrice({
      price: Math.round(price),
      distance: Math.round(distance),
      vehicle: vehicle.name
    });
  };

  const handleCreateOrder = () => {
    navigate('/register', { 
      state: { 
        fromCalculator: true,
        pickupAddress,
        deliveryAddress,
        pickupPostalCode,
        deliveryPostalCode,
        vehicleType,
        estimatedPrice: calculatedPrice?.price
      }
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Truck className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900">CityJumper</span>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition"
                  >
                    <User className="h-5 w-5" />
                    <span>{user.first_name}</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Abmelden</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition"
                  >
                    <LogIn className="h-5 w-5" />
                    <span>Anmelden</span>
                  </button>
                  <button
                    onClick={() => navigate('/register')}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
                  >
                    Registrieren
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Schneller Kurierdienst & Eiltransport
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              Deutschlandweit • Zuverlässig • Günstig
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => document.getElementById('calculator').scrollIntoView({ behavior: 'smooth' })}
                className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition"
              >
                Preis berechnen
              </button>
              {!user && (
                <button
                  onClick={() => navigate('/register')}
                  className="bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-800 transition border-2 border-white"
                >
                  Jetzt registrieren
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Express-Lieferung</h3>
            <p className="text-gray-600">Schnelle Abholung und Zustellung am selben Tag möglich</p>
          </div>
          <div className="text-center">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Versichert</h3>
            <p className="text-gray-600">Ihre Sendung ist während des gesamten Transports versichert</p>
          </div>
          <div className="text-center">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Deutschlandweit</h3>
            <p className="text-gray-600">Wir liefern in ganz Deutschland zuverlässig</p>
          </div>
          <div className="text-center">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Euro className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Faire Preise</h3>
            <p className="text-gray-600">Transparente Preisgestaltung ohne versteckte Kosten</p>
          </div>
        </div>
      </div>

      {/* Price Calculator */}
      <div id="calculator" className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Preis berechnen</h2>
            <p className="text-lg text-gray-600">Erhalten Sie sofort einen unverbindlichen Kostenvoranschlag</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="space-y-6">
              <AddressSearch
                label="Abholadresse"
                value={pickupAddress}
                onChange={setPickupAddress}
                onAddressSelect={(address) => {
                  setPickupAddress(`${address.street} ${address.houseNumber}, ${address.postalCode} ${address.city}`.trim());
                  setPickupPostalCode(address.postalCode);
                }}
                required
              />

              <AddressSearch
                label="Lieferadresse"
                value={deliveryAddress}
                onChange={setDeliveryAddress}
                onAddressSelect={(address) => {
                  setDeliveryAddress(`${address.street} ${address.houseNumber}, ${address.postalCode} ${address.city}`.trim());
                  setDeliveryPostalCode(address.postalCode);
                }}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fahrzeugtyp</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {vehicleTypes.map((type) => (
                    <option key={type.name} value={type.name}>{type.name}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleCalculatePrice}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition flex items-center justify-center"
              >
                <Euro className="h-5 w-5 mr-2" />
                Preis berechnen
              </button>

              {calculatedPrice && (
                <div className="mt-6 bg-primary-50 border-2 border-primary-200 rounded-lg p-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Geschätzter Preis</p>
                    <p className="text-4xl font-bold text-primary-600 mb-4">
                      €{calculatedPrice.price}
                    </p>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Entfernung: ca. {calculatedPrice.distance} km</p>
                      <p>Fahrzeug: {calculatedPrice.vehicle}</p>
                    </div>
                    <button
                      onClick={handleCreateOrder}
                      className="mt-6 w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition flex items-center justify-center"
                    >
                      Auftrag erstellen
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      * Unverbindlicher Kostenvoranschlag. Der finale Preis wird nach Auftragsannahme bestätigt.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Unsere Leistungen</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <CheckCircle className="h-12 w-12 text-primary-600 mb-4" />
            <h3 className="text-xl font-semibold mb-3">Kurierdienst</h3>
            <p className="text-gray-600">Schnelle und zuverlässige Kurierdienste für Dokumente und Pakete</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <CheckCircle className="h-12 w-12 text-primary-600 mb-4" />
            <h3 className="text-xl font-semibold mb-3">Eiltransport</h3>
            <p className="text-gray-600">Express-Lieferungen mit garantierten Lieferzeiten</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <CheckCircle className="h-12 w-12 text-primary-600 mb-4" />
            <h3 className="text-xl font-semibold mb-3">Sperrgut</h3>
            <p className="text-gray-600">Transport von sperrigen Gütern und Paletten</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-primary-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Bereit für Ihren ersten Transport?</h2>
          <p className="text-xl mb-8 text-primary-100">
            Registrieren Sie sich jetzt kostenlos und erstellen Sie Ihren ersten Auftrag
          </p>
          <button
            onClick={() => navigate('/register')}
            className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition inline-flex items-center"
          >
            Jetzt kostenlos registrieren
            <ArrowRight className="h-5 w-5 ml-2" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">© 2025 CityJumper Transport. Alle Rechte vorbehalten.</p>
        </div>
      </div>
    </div>
  );
}
