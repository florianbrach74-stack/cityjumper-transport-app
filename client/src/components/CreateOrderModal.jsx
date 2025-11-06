import React, { useState, useEffect } from 'react';
import { ordersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { X, MapPin, Calendar, Truck, Package, AlertCircle } from 'lucide-react';
import AddressSearch from './AddressSearch';
import RouteMap from './RouteMap';
import MultiStopManager from './MultiStopManager';

const CreateOrderModal = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  
  // Check for pending order data
  const pendingOrder = JSON.parse(localStorage.getItem('pendingOrder') || '{}');
  
  // Hole heutiges Datum für Direktfahrt
  const today = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toTimeString().slice(0, 5);

  const [formData, setFormData] = useState({
    pickup_address: pendingOrder.pickupAddress || (user?.company_address || ''),
    pickup_city: pendingOrder.pickupLocation?.city || (user?.company_city || ''),
    pickup_postal_code: pendingOrder.pickupLocation?.postalCode || (user?.company_postal_code || ''),
    pickup_country: 'Deutschland',
    pickup_company: user?.company_name || '',
    pickup_date: today,
    pickup_time_from: currentTime,
    pickup_time_to: '',
    pickup_contact_name: user?.company_name ? `${user.first_name} ${user.last_name}` : '',
    pickup_contact_phone: user?.phone || '',
    delivery_address: pendingOrder.deliveryAddress || '',
    delivery_city: pendingOrder.deliveryLocation?.city || '',
    delivery_postal_code: pendingOrder.deliveryLocation?.postalCode || '',
    delivery_country: 'Deutschland',
    delivery_date: today, // Standard: Direktfahrt = gleiches Datum
    delivery_time_from: currentTime,
    delivery_time_to: '',
    delivery_contact_name: '',
    delivery_contact_phone: '',
    vehicle_type: pendingOrder.vehicleType || 'Kleintransporter',
    weight: '100', // Standard: 100kg (Europalette)
    length: '120', // Standard: 120cm (Europalette)
    width: '80',   // Standard: 80cm (Europalette)
    height: '15',  // Standard: 15cm (Europalette)
    pallets: '1',  // Standard: 1 Palette
    description: '',
    special_requirements: '',
    price: pendingOrder.calculatedPrice?.recommendedPrice?.toFixed(2) || '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pickupLocation, setPickupLocation] = useState(pendingOrder.pickupLocation || null);
  const [deliveryLocation, setDeliveryLocation] = useState(pendingOrder.deliveryLocation || null);
  const [routeInfo, setRouteInfo] = useState(pendingOrder.routeInfo || null);
  const [priceWarning, setPriceWarning] = useState('');
  const [minimumPrice, setMinimumPrice] = useState(null);
  const [pickupStops, setPickupStops] = useState([]);
  const [deliveryStops, setDeliveryStops] = useState([]);
  const [extraStopsFee, setExtraStopsFee] = useState(0);
  const [showPartialLoadDialog, setShowPartialLoadDialog] = useState(false);
  const [isPartialLoad, setIsPartialLoad] = useState(false);
  const [withdrawalConsent, setWithdrawalConsent] = useState(false);

  const vehicleTypes = [
    'Kleintransporter (bis 2 Paletten)',
    'Mittlerer Transporter (bis 4 Paletten)',
    'Großer Transporter (bis 8 Paletten)',
    'Transporter mit Hebebühne',
  ];

  const validatePrice = (price) => {
    if (!routeInfo || !price) {
      setPriceWarning('');
      return true;
    }

    const PRICE_PER_KM = 0.50;
    const HOURLY_RATE = 22.50;
    const START_FEE = 6.00;
    const EXTRA_STOP_FEE = 6.00;
    
    const distanceCost = routeInfo.distance * PRICE_PER_KM;
    const durationHours = routeInfo.durationMinutes / 60;
    const timeCost = durationHours * HOURLY_RATE;
    
    // Berechne Extra-Stop-Gebühr
    const totalExtraStops = pickupStops.length + deliveryStops.length;
    const extraStopsCost = totalExtraStops * EXTRA_STOP_FEE;
    setExtraStopsFee(extraStopsCost);
    
    const calculatedMinimumPrice = distanceCost + timeCost + START_FEE + extraStopsCost;
    
    setMinimumPrice(calculatedMinimumPrice);
    
    const proposedPrice = parseFloat(price);
    
    if (proposedPrice < calculatedMinimumPrice) {
      const difference = calculatedMinimumPrice - proposedPrice;
      setPriceWarning(
        `⚠️ ACHTUNG: Der Preis unterschreitet den Mindestlohn! ` +
        `Mindestpreis: €${calculatedMinimumPrice.toFixed(2)} ` +
        `(inkl. ${totalExtraStops} Extra-Stops à €6) ` +
        `(Sie sind €${difference.toFixed(2)} zu niedrig)`
      );
      return false;
    } else {
      setPriceWarning('');
      return true;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Validiere Preis bei Änderung
    if (name === 'price') {
      validatePrice(value);
    }
  };

  const handlePickupAddressSelect = (address) => {
    setFormData((prev) => ({
      ...prev,
      pickup_address: `${address.street} ${address.houseNumber}`.trim(),
      pickup_city: address.city,
      pickup_postal_code: address.postalCode,
      pickup_country: address.country,
    }));
    setPickupLocation(address);
  };

  const handleDeliveryAddressSelect = (address) => {
    setFormData((prev) => ({
      ...prev,
      delivery_address: `${address.street} ${address.houseNumber}`.trim(),
      delivery_city: address.city,
      delivery_postal_code: address.postalCode,
      delivery_country: address.country,
    }));
    setDeliveryLocation(address);
  };

  const handleRouteCalculated = async (routeData) => {
    setRouteInfo(routeData);
    
    // Berechne automatisch den Preis
    if (routeData && !formData.price) {
      try {
        const PRICE_PER_KM = 0.50;
        const HOURLY_RATE = 22.50;
        const START_FEE = 6.00;
        const EXTRA_STOP_FEE = 6.00;
        
        const distanceCost = routeData.distance * PRICE_PER_KM;
        const durationHours = routeData.durationMinutes / 60;
        const timeCost = durationHours * HOURLY_RATE;
        
        // Berechne Extra-Stop-Gebühr
        const totalExtraStops = pickupStops.length + deliveryStops.length;
        const extraStopsCost = totalExtraStops * EXTRA_STOP_FEE;
        setExtraStopsFee(extraStopsCost);
        
        const calculatedMinimumPrice = distanceCost + timeCost + START_FEE + extraStopsCost;
        const recommendedPrice = calculatedMinimumPrice * 1.2;
        
        setMinimumPrice(calculatedMinimumPrice);
        
        setFormData(prev => ({
          ...prev,
          price: recommendedPrice.toFixed(2)
        }));
      } catch (error) {
        console.error('Error calculating price:', error);
      }
    }
  };
  
  // Aktualisiere Preis und Extra-Stops-Gebühr wenn Stops sich ändern
  useEffect(() => {
    const EXTRA_STOP_FEE = 6.00;
    const totalExtraStops = pickupStops.length + deliveryStops.length;
    const calculatedFee = totalExtraStops * EXTRA_STOP_FEE;
    setExtraStopsFee(calculatedFee);
    
    if (routeInfo && formData.price) {
      validatePrice(formData.price);
    }
  }, [pickupStops.length, deliveryStops.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Check withdrawal consent for private customers (role: customer, not company)
    if (user?.role === 'customer' && !user?.company_name && !withdrawalConsent) {
      setError('Bitte bestätigen Sie die Widerrufsbelehrung, um fortzufahren.');
      return;
    }
    
    // Prüfe Mindestlohn - zeige Beiladungs-Dialog wenn unterschritten
    if (priceWarning && !isPartialLoad) {
      setShowPartialLoadDialog(true);
      return;
    }
    
    setLoading(true);

    try {
      // Convert empty strings to null for optional numeric fields
      const orderData = {
        ...formData,
        // Wenn Lieferdatum/zeit fehlt, nutze Abholdatum/zeit
        delivery_date: formData.delivery_date || formData.pickup_date,
        delivery_time_from: formData.delivery_time_from || formData.pickup_time_from,
        delivery_time_to: formData.delivery_time_to || formData.pickup_time_to,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        length: formData.length ? parseFloat(formData.length) : null,
        width: formData.width ? parseFloat(formData.width) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        pallets: formData.pallets ? parseInt(formData.pallets) : null,
        price: formData.price ? parseFloat(formData.price) : null,
        // Multi-Stop-Daten
        pickup_stops: pickupStops.length > 0 ? pickupStops : undefined,
        delivery_stops: deliveryStops.length > 0 ? deliveryStops : undefined,
        // Beiladungs-Daten
        is_partial_load: isPartialLoad,
        minimum_price_at_creation: minimumPrice,
        // Widerrufsbelehrung-Zustimmung
        withdrawal_consent_given: user?.role === 'customer' && !user?.company_name ? withdrawalConsent : null,
      };

      console.log('Sending order data:', orderData);
      const response = await ordersAPI.createOrder(orderData);
      console.log('Order created successfully:', response);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating order:', err);
      console.error('Error response:', err.response);
      console.error('Error data:', err.response?.data);
      
      let errorMessage = 'Fehler beim Erstellen des Auftrags';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.details) {
        errorMessage = err.response.data.details;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900">Neuen Transportauftrag erstellen</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Pickup Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-primary-600" />
              Abholung
            </h4>
            <div className="space-y-4">
              <AddressSearch
                label="Abholadresse"
                value={formData.pickup_address}
                onChange={(value) => setFormData(prev => ({ ...prev, pickup_address: value }))}
                onAddressSelect={handlePickupAddressSelect}
                required
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stadt *</label>
                  <input
                    type="text"
                    name="pickup_city"
                    required
                    value={formData.pickup_city}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">PLZ *</label>
                  <input
                    type="text"
                    name="pickup_postal_code"
                    required
                    value={formData.pickup_postal_code}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    readOnly
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Datum *</label>
                <input
                  type="date"
                  name="pickup_date"
                  required
                  value={formData.pickup_date}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Zeitfenster Von</label>
                <input
                  type="time"
                  name="pickup_time_from"
                  value={formData.pickup_time_from}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="z.B. 11:00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Zeitfenster Bis (optional)</label>
                <input
                  type="time"
                  name="pickup_time_to"
                  value={formData.pickup_time_to}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="z.B. 13:00"
                />
                <p className="text-xs text-gray-500 mt-1">Leer lassen für feste Zeit</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Firma (optional)</label>
                <input
                  type="text"
                  name="pickup_company"
                  value={formData.pickup_company || ''}
                  onChange={handleChange}
                  placeholder="z.B. Amazon GmbH"
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Kontaktperson</label>
                <input
                  type="text"
                  name="pickup_contact_name"
                  value={formData.pickup_contact_name}
                  onChange={handleChange}
                  placeholder="z.B. Fr. Müller"
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Telefon</label>
                <input
                  type="tel"
                  name="pickup_contact_phone"
                  value={formData.pickup_contact_phone}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Delivery */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-primary-600" />
              Zustellung
            </h4>
            <p className="text-sm text-gray-600 mb-4 bg-blue-50 border border-blue-200 rounded p-2">
              🚚 <strong>Direktfahrt:</strong> Zustellung erfolgt am gleichen Tag zur gleichen Zeit wie Abholung. 
              Sie können Datum/Zeit ändern falls gewünscht.
            </p>
            <div className="space-y-4">
              <AddressSearch
                label="Lieferadresse"
                value={formData.delivery_address}
                onChange={(value) => setFormData(prev => ({ ...prev, delivery_address: value }))}
                onAddressSelect={handleDeliveryAddressSelect}
                required
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stadt *</label>
                  <input
                    type="text"
                    name="delivery_city"
                    required
                    value={formData.delivery_city}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">PLZ *</label>
                  <input
                    type="text"
                    name="delivery_postal_code"
                    required
                    value={formData.delivery_postal_code}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    readOnly
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Datum</label>
                  <input
                    type="date"
                    name="delivery_date"
                    value={formData.delivery_date}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Zeitfenster Von</label>
                  <input
                    type="time"
                    name="delivery_time_from"
                    value={formData.delivery_time_from}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="z.B. 14:00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Zeitfenster Bis (optional)</label>
                  <input
                    type="time"
                    name="delivery_time_to"
                    value={formData.delivery_time_to}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="z.B. 16:00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Firma (optional)</label>
                <input
                  type="text"
                  name="delivery_company"
                  value={formData.delivery_company || ''}
                  onChange={handleChange}
                  placeholder="z.B. IKEA Berlin"
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Kontaktperson</label>
                <input
                  type="text"
                  name="delivery_contact_name"
                  value={formData.delivery_contact_name}
                  onChange={handleChange}
                  placeholder="z.B. Hr. Schmidt"
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Telefon</label>
                <input
                  type="tel"
                  name="delivery_contact_phone"
                  value={formData.delivery_contact_phone}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Multi-Stop Manager */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
            <div className="mb-4">
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                🚚 Multi-Stop-Auftrag (Optional)
              </h4>
              <p className="text-sm text-gray-600">
                Fügen Sie zusätzliche Abhol- oder Zustelladressen hinzu. 
                <strong className="text-blue-600"> Jeder zusätzliche Stop kostet 6€ extra.</strong>
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <MultiStopManager
                  type="pickup"
                  stops={pickupStops}
                  onStopsChange={setPickupStops}
                />
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <MultiStopManager
                  type="delivery"
                  stops={deliveryStops}
                  onStopsChange={setDeliveryStops}
                />
              </div>
            </div>
            
            {(pickupStops.length > 0 || deliveryStops.length > 0) && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm font-medium text-yellow-900">
                  💰 Extra-Stops-Gebühr: {pickupStops.length + deliveryStops.length} Stops × 6€ = 
                  <span className="text-lg font-bold ml-2">€{extraStopsFee.toFixed(2)}</span>
                </p>
              </div>
            )}
          </div>

          {/* Route Map */}
          {(pickupLocation || deliveryLocation) && (
            <div className="bg-white p-4 rounded-lg border-2 border-primary-200">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Route & Entfernung</h4>
              <RouteMap 
                pickup={pickupLocation} 
                delivery={deliveryLocation}
                onRouteCalculated={handleRouteCalculated}
              />
            </div>
          )}

          {/* Shipment Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Package className="h-5 w-5 mr-2 text-primary-600" />
              Sendungsdetails
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Fahrzeugtyp *</label>
                <select
                  name="vehicle_type"
                  required
                  value={formData.vehicle_type}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  {vehicleTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Gewicht (kg)
                  <span className="text-xs text-gray-500 ml-2">(Standard: 100kg)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="100"
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Paletten
                  <span className="text-xs text-gray-500 ml-2">(Standard: 1)</span>
                </label>
                <input
                  type="number"
                  name="pallets"
                  value={formData.pallets}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Länge (cm)
                  <span className="text-xs text-gray-500 ml-2">(Standard: 120cm Europalette)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="length"
                  value={formData.length}
                  onChange={handleChange}
                  placeholder="120"
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Breite (cm)
                  <span className="text-xs text-gray-500 ml-2">(Standard: 80cm Europalette)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="width"
                  value={formData.width}
                  onChange={handleChange}
                  placeholder="80"
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Höhe (cm)
                  <span className="text-xs text-gray-500 ml-2">(Standard: 15cm)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  placeholder="15"
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Preis (€) * <span className="text-xs text-gray-600">zzgl. 19% MwSt.</span>
                  <span className="text-xs text-gray-500 ml-2">(Automatisch berechnet, änderbar)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  required
                  value={formData.price}
                  onChange={handleChange}
                  className={`mt-1 block w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                    priceWarning 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-300 bg-primary-50'
                  }`}
                />
                {priceWarning && (
                  <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                    <p className="text-xs text-red-700">
                      📊 Berechnung: {routeInfo?.distance}km × €0,50 + {(routeInfo?.durationMinutes / 60).toFixed(2)}h × €22,50/h + €6 Startgebühr + {pickupStops.length + deliveryStops.length} Extra-Stops × €6 = €{minimumPrice?.toFixed(2)}
                    </p>
                  </div>
                )}
                {!priceWarning && minimumPrice && (
                  <p className="text-xs text-green-600 mt-1">
                    ✅ Preis hält Mindestlohn ein (Minimum: €{minimumPrice.toFixed(2)})
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  💡 Basierend auf Mindestlohn-Kalkulation (€0,50/km + €22,50/h + €6 Startgebühr + Extra-Stops)
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Beschreibung</label>
                <textarea
                  name="description"
                  rows="2"
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Besondere Anforderungen
                </label>
                <textarea
                  name="special_requirements"
                  rows="2"
                  value={formData.special_requirements}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          {/* Widerrufsbelehrung für Privatkunden */}
          {user?.role === 'customer' && !user?.company_name && (
            <div className="pt-4 border-t">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="withdrawalConsent"
                    checked={withdrawalConsent}
                    onChange={(e) => setWithdrawalConsent(e.target.checked)}
                    className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="withdrawalConsent" className="ml-3 text-sm text-gray-700">
                    <span className="font-semibold">Ich stimme ausdrücklich zu,</span> dass FB Transporte vor Ablauf der Widerrufsfrist mit der Durchführung des Transports beginnt.
                    Mir ist bekannt, dass ich mein Widerrufsrecht bei vollständiger Vertragserfüllung verliere.
                    <br />
                    <a 
                      href="/widerruf" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 underline font-medium mt-1 inline-block"
                    >
                      → Widerrufsbelehrung lesen
                    </a>
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Wird erstellt...' : 'Auftrag erstellen'}
            </button>
          </div>
        </form>
      </div>

      {/* Beiladungs-Bestätigungsdialog */}
      {showPartialLoadDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-[60] flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="mb-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-8 w-8 text-orange-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  ⚠️ Mindestlohn-Unterschreitung
                </h3>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-orange-900 mb-2">
                  <strong>Ihr Preis:</strong> €{parseFloat(formData.price).toFixed(2)}
                </p>
                <p className="text-sm text-orange-900 mb-2">
                  <strong>Mindestpreis:</strong> €{minimumPrice?.toFixed(2)}
                </p>
                <p className="text-sm text-orange-900">
                  <strong>Differenz:</strong> €{(minimumPrice - parseFloat(formData.price)).toFixed(2)} zu niedrig
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Option: Beiladung (Flexible Abholung & Zustellung)
                  </h4>
                  <p className="text-sm text-blue-800 mb-3">
                    Wir <strong>vermitteln</strong> Ihren Auftrag als Beiladung an Auftragnehmer. 
                    Ihr Transport wird mit anderen Aufträgen kombiniert, um Kosten zu sparen.
                  </p>
                  <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
                    <li><strong>Flexible Abholung & Zustellung</strong> innerhalb von 7 Tagen</li>
                    <li><strong>Keine Garantie</strong> für Auftragsübernahme - wir vermitteln nur</li>
                    <li>Sie können den Preis jederzeit erhöhen, um schneller einen Auftragnehmer zu finden</li>
                    <li>Transport wird mit anderen Aufträgen kombiniert</li>
                    <li>Auftragnehmer sehen, dass es sich um eine Beiladung handelt</li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">
                    Alternative: Preis anpassen
                  </h4>
                  <p className="text-sm text-green-800">
                    Erhöhen Sie den Preis auf mindestens €{minimumPrice?.toFixed(2)}, um eine garantierte 
                    Direktfahrt zum Wunschtermin zu erhalten.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowPartialLoadDialog(false);
                  // Preis auf Mindestpreis setzen
                  setFormData(prev => ({
                    ...prev,
                    price: minimumPrice.toFixed(2)
                  }));
                  setPriceWarning('');
                }}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                ✓ Preis auf €{minimumPrice?.toFixed(2)} erhöhen
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPartialLoad(true);
                  setShowPartialLoadDialog(false);
                  // Trigger submit again
                  document.querySelector('form').requestSubmit();
                }}
                className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
              >
                📦 Als Beiladung fortfahren
              </button>
              <button
                type="button"
                onClick={() => setShowPartialLoadDialog(false)}
                className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateOrderModal;
