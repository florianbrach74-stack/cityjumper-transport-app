import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, MapPin, Clock, Shield, Euro, ArrowRight, CheckCircle, LogIn, LogOut, User, Zap, Package, TrendingUp } from 'lucide-react';
import AddressSearch from '../components/AddressSearch';
import RouteMap from '../components/RouteMap';
import Logo from '../components/Logo';
import Footer from '../components/Footer';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { formatPrice } from '../utils/formatPrice';
import { useTranslation } from '../hooks/useTranslation';

export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
  const [pickupLocation, setPickupLocation] = useState(null);
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [vehicleType, setVehicleType] = useState('Kleintransporter');
  const [calculatedPrice, setCalculatedPrice] = useState(null);
  const [calculating, setCalculating] = useState(false);

  const vehicleTypes = [
    { name: 'Kleintransporter', basePrice: 80, pricePerKm: 1.2 },
    { name: 'Mittlerer Transporter', basePrice: 120, pricePerKm: 1.5 },
    { name: 'Großer Transporter', basePrice: 180, pricePerKm: 2.0 },
    { name: 'Transporter mit Hebebühne', basePrice: 200, pricePerKm: 2.5 },
  ];

  const calculatePriceLocally = (distanceKm, durationMinutes) => {
    const PRICE_PER_KM = 0.50;
    const HOURLY_RATE = 18.00;
    
    const distanceCost = distanceKm * PRICE_PER_KM;
    const durationHours = durationMinutes / 60;
    const timeCost = durationHours * HOURLY_RATE;
    const minimumPrice = distanceCost + timeCost;
    const recommendedPrice = minimumPrice * 1.2;
    
    return {
      distanceKm,
      durationMinutes,
      distanceCost: Math.round(distanceCost * 100) / 100,
      timeCost: Math.round(timeCost * 100) / 100,
      minimumPrice: Math.round(minimumPrice * 100) / 100,
      recommendedPrice: Math.round(recommendedPrice * 100) / 100,
      breakdown: {
        perKm: PRICE_PER_KM,
        perHour: HOURLY_RATE
      }
    };
  };

  const handleRouteCalculated = async (routeData) => {
    setRouteInfo(routeData);
    
    // Berechne Preis basierend auf echter Route
    if (routeData) {
      setCalculating(true);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'https://cityjumper-api-production-01e4.up.railway.app';
        const response = await fetch(`${apiUrl}/api/pricing/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            distanceKm: routeData.distance,
            durationMinutes: routeData.durationMinutes
          })
        });
        
        if (!response.ok) {
          // Fallback: Berechne lokal wenn Backend nicht verfügbar
          console.warn('Backend nicht verfügbar, berechne lokal');
          const localPrice = calculatePriceLocally(routeData.distance, routeData.durationMinutes);
          setCalculatedPrice({
            minimumPrice: localPrice.minimumPrice,
            recommendedPrice: localPrice.recommendedPrice,
            distance: routeData.distance,
            duration: routeData.duration,
            breakdown: localPrice.breakdown,
            distanceCost: localPrice.distanceCost,
            timeCost: localPrice.timeCost
          });
          setCalculating(false);
          return;
        }
        
        const data = await response.json();
        
        if (data.success) {
          setCalculatedPrice({
            minimumPrice: data.minimumPrice,
            recommendedPrice: data.recommendedPrice,
            distance: data.distanceKm,
            duration: routeData.duration,
            breakdown: data.breakdown,
            distanceCost: data.distanceCost,
            timeCost: data.timeCost
          });
        } else {
          throw new Error(data.error || 'Preisberechnung fehlgeschlagen');
        }
      } catch (error) {
        console.error('Price calculation error:', error);
        // Fallback: Berechne lokal
        const localPrice = calculatePriceLocally(routeData.distance, routeData.durationMinutes);
        setCalculatedPrice({
          minimumPrice: localPrice.minimumPrice,
          recommendedPrice: localPrice.recommendedPrice,
          distance: routeData.distance,
          duration: routeData.duration,
          breakdown: localPrice.breakdown,
          distanceCost: localPrice.distanceCost,
          timeCost: localPrice.timeCost
        });
      } finally {
        setCalculating(false);
      }
    }
  };

  const handleCalculatePrice = () => {
    if (!pickupLocation || !deliveryLocation) {
      alert('Bitte wählen Sie beide Adressen aus der Vorschlagsliste aus');
      return;
    }
    // Route wird automatisch berechnet durch RouteMap
  };

  const [showOrderDialog, setShowOrderDialog] = useState(false);

  const handleCreateOrder = () => {
    // Speichere Auftragsdaten in localStorage
    const orderData = {
      pickupAddress,
      deliveryAddress,
      pickupLocation,
      deliveryLocation,
      routeInfo,
      calculatedPrice,
      vehicleType: 'Kleintransporter',
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('pendingOrder', JSON.stringify(orderData));
    
    // Zeige Dialog
    setShowOrderDialog(true);
  };

  const handleLoginRedirect = () => {
    navigate('/login', { state: { returnTo: '/dashboard', hasPendingOrder: true } });
  };

  const handleRegisterRedirect = () => {
    navigate('/register', { state: { returnTo: '/dashboard', hasPendingOrder: true } });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="bg-white/95 backdrop-blur-sm shadow-soft border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo size="md" showText={true} className="cursor-pointer" onClick={() => navigate('/')} />
            <div className="flex items-center space-x-2">
              <LanguageSwitcher />
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
                    <span>{t('nav.logout')}</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition"
                  >
                    <LogIn className="h-5 w-5" />
                    <span>{t('nav.login')}</span>
                  </button>
                  <button
                    onClick={() => navigate('/register')}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
                  >
                    {t('nav.register')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
        {/* Futuristic Background with Neon Lines */}
        <div className="absolute inset-0 opacity-30">
          {/* Diagonal neon lines */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent transform -rotate-12 origin-top-left"></div>
          <div className="absolute bottom-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent transform -rotate-12 origin-bottom-right"></div>
          
          {/* Grid pattern */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(14, 165, 233, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(14, 165, 233, 0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        {/* Glowing Logo Effect in Background */}
        <div className="absolute top-1/4 left-10 opacity-20 pointer-events-none">
          <div className="relative">
            <div className="w-64 h-64 rounded-full bg-cyan-400 blur-3xl"></div>
            <div className="absolute inset-0 w-64 h-64 rounded-full bg-orange-400 blur-3xl mix-blend-multiply"></div>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div className="text-center md:text-left animate-fade-in">
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                <Zap className="h-4 w-4 text-secondary-400" />
                <span className="text-sm font-medium">Blitzschnell & Zuverlässig</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 leading-tight">
                {t('hero.title')}
              </h1>
              
              <p className="text-xl md:text-2xl mb-8 text-primary-100 leading-relaxed">
                {t('hero.subtitle')}
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center md:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => document.getElementById('calculator').scrollIntoView({ behavior: 'smooth' })}
                  className="group bg-white text-primary-600 px-8 py-4 rounded-xl font-semibold hover:bg-primary-50 transition-all shadow-strong hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center"
                >
                  <Euro className="h-5 w-5 mr-2" />
                  {t('hero.cta.calculate')}
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
                {!user && (
                  <button
                    onClick={() => navigate('/register')}
                    className="bg-secondary-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-secondary-600 transition-all shadow-strong hover:shadow-xl transform hover:-translate-y-1"
                  >
                    {t('hero.cta.register')}
                  </button>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mt-12">
                <div className="text-center">
                  <div className="text-3xl font-bold text-secondary-400">1000+</div>
                  <div className="text-sm text-primary-200">Transporte/Monat</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-secondary-400">24/7</div>
                  <div className="text-sm text-primary-200">Verfügbar</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-secondary-400">99%</div>
                  <div className="text-sm text-primary-200">Zufriedenheit</div>
                </div>
              </div>
            </div>

            {/* Right side - removed logo */}
            
            {/* Old truck illustration - keeping for reference */}
            <div className="hidden">
              <div className="relative">
                {/* Truck Illustration using SVG/Icons */}
                <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-8 shadow-strong">
                  <div className="flex items-center justify-center space-x-4 mb-6">
                    <div className="bg-success-500 p-4 rounded-2xl animate-bounce-slow">
                      <Package className="h-12 w-12 text-white" />
                    </div>
                    <ArrowRight className="h-8 w-8 text-secondary-400" />
                    <div className="bg-primary-500 p-4 rounded-2xl">
                      <Truck className="h-12 w-12 text-white" />
                    </div>
                    <ArrowRight className="h-8 w-8 text-secondary-400" />
                    <div className="bg-secondary-500 p-4 rounded-2xl animate-bounce-slow animation-delay-2000">
                      <MapPin className="h-12 w-12 text-white" />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold mb-2">Schnell. Sicher. Günstig.</div>
                    <div className="text-primary-200">Von A nach B in Rekordzeit</div>
                  </div>
                </div>
                
                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 bg-secondary-400 p-3 rounded-full shadow-lg animate-bounce">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-success-500 p-3 rounded-full shadow-lg animate-bounce animation-delay-2000">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-gradient-to-b from-gray-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-gray-900 mb-4">
              Warum <span className="text-primary-600">Courierly</span>?
            </h2>
            <p className="text-xl text-gray-600">Ihr zuverlässiger Partner für schnelle Transporte</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="group text-center p-6 rounded-2xl hover:bg-white hover:shadow-medium transition-all transform hover:-translate-y-2">
              <div className="bg-gradient-to-br from-primary-500 to-primary-700 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-soft">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">Express-Lieferung</h3>
              <p className="text-gray-600">Schnelle Abholung und Zustellung am selben Tag möglich</p>
            </div>
            
            <div className="group text-center p-6 rounded-2xl hover:bg-white hover:shadow-medium transition-all transform hover:-translate-y-2">
              <div className="bg-gradient-to-br from-success-500 to-success-700 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-soft">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">Versichert</h3>
              <p className="text-gray-600">Ihre Sendung ist während des gesamten Transports versichert</p>
            </div>
            
            <div className="group text-center p-6 rounded-2xl hover:bg-white hover:shadow-medium transition-all transform hover:-translate-y-2">
              <div className="bg-gradient-to-br from-secondary-500 to-secondary-700 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-soft">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">Deutschlandweit</h3>
              <p className="text-gray-600">Wir liefern in ganz Deutschland zuverlässig</p>
            </div>
            
            <div className="group text-center p-6 rounded-2xl hover:bg-white hover:shadow-medium transition-all transform hover:-translate-y-2">
              <div className="bg-gradient-to-br from-primary-600 to-primary-800 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-soft">
                <Euro className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">Faire Preise</h3>
              <p className="text-gray-600">Transparente Preisgestaltung ohne versteckte Kosten</p>
            </div>
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
                  setPickupLocation(address);
                }}
                required
              />

              <AddressSearch
                label="Lieferadresse"
                value={deliveryAddress}
                onChange={setDeliveryAddress}
                onAddressSelect={(address) => {
                  setDeliveryAddress(`${address.street} ${address.houseNumber}, ${address.postalCode} ${address.city}`.trim());
                  setDeliveryLocation(address);
                }}
                required
              />

              {/* Route Map */}
              {(pickupLocation && deliveryLocation) && (
                <div className="mt-6">
                  <RouteMap 
                    pickup={pickupLocation} 
                    delivery={deliveryLocation}
                    onRouteCalculated={handleRouteCalculated}
                  />
                </div>
              )}

              {calculating && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Berechne Preis...</p>
                </div>
              )}

              {calculatedPrice && (
                <div className="mt-6 bg-gradient-to-br from-primary-50 to-blue-50 border-2 border-primary-300 rounded-lg p-6 shadow-lg">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700 mb-2">💰 Empfohlener Preis</p>
                    <p className="text-5xl font-bold text-primary-600 mb-1">
                      €{calculatedPrice.recommendedPrice.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600 mb-4">zzgl. 19% MwSt.</p>
                    <p className="text-xs text-gray-500 mb-4">
                      (Mindestpreis: €{calculatedPrice.minimumPrice.toFixed(2)} zzgl. MwSt.)
                    </p>
                    
                    <div className="bg-white rounded-lg p-4 mb-4 text-left">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Preisberechnung:</p>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>📍 Entfernung: {calculatedPrice.distance} km × €{calculatedPrice.breakdown.perKm} = €{calculatedPrice.distanceCost.toFixed(2)}</p>
                        <p>⏱️ Fahrzeit: {calculatedPrice.duration} × €{calculatedPrice.breakdown.perHour}/h = €{calculatedPrice.timeCost.toFixed(2)}</p>
                        <div className="border-t border-gray-200 my-2"></div>
                        <p className="font-semibold">Mindestpreis (Mindestlohn): €{calculatedPrice.minimumPrice.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">+ 20% Aufschlag = €{calculatedPrice.recommendedPrice.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1 mb-4">
                      <p>🚗 Entfernung: {calculatedPrice.distance} km</p>
                      <p>⏱️ Fahrzeit: {calculatedPrice.duration}</p>
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
          <p className="text-gray-400">© 2025 Courierly Express. Alle Rechte vorbehalten.</p>
        </div>
      </div>

      {/* Order Confirmation Dialog */}
      {showOrderDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-strong max-w-md w-full p-8 animate-slide-up">
            <div className="text-center mb-6">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Fahrt beauftragen?
              </h3>
              <p className="text-gray-600">
                Möchten Sie diese Fahrt jetzt beauftragen?
              </p>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Von:</span>
                <span className="font-medium text-gray-900">{pickupLocation?.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Nach:</span>
                <span className="font-medium text-gray-900">{deliveryLocation?.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Entfernung:</span>
                <span className="font-medium text-gray-900">{calculatedPrice?.distance} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fahrzeit:</span>
                <span className="font-medium text-gray-900">{calculatedPrice?.duration}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">Preis:</span>
                  <span className="font-bold text-primary-600 text-lg">
                    €{calculatedPrice?.recommendedPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {user ? (
              // User is logged in - direct order creation
              <div className="space-y-3">
                <button
                  onClick={() => {
                    navigate('/dashboard');
                    setShowOrderDialog(false);
                  }}
                  className="w-full bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition-all shadow-medium"
                >
                  Auftrag jetzt erstellen
                </button>
                <button
                  onClick={() => setShowOrderDialog(false)}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                >
                  Abbrechen
                </button>
              </div>
            ) : (
              // User not logged in - show login/register options
              <div className="space-y-3">
                <p className="text-sm text-gray-600 text-center mb-4">
                  Um einen Auftrag zu erstellen, müssen Sie sich anmelden oder registrieren
                </p>
                <button
                  onClick={handleLoginRedirect}
                  className="w-full bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition-all shadow-medium flex items-center justify-center"
                >
                  <LogIn className="h-5 w-5 mr-2" />
                  Anmelden
                </button>
                <button
                  onClick={handleRegisterRedirect}
                  className="w-full bg-secondary-500 text-white py-3 rounded-xl font-semibold hover:bg-secondary-600 transition-all shadow-medium"
                >
                  Jetzt registrieren
                </button>
                <button
                  onClick={() => setShowOrderDialog(false)}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                >
                  Abbrechen
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
