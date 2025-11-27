import React, { useState, useEffect } from 'react';
import { ordersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { X, MapPin, Calendar, Truck, Package, AlertCircle, Star } from 'lucide-react';
import AddressSearch from './AddressSearch';
import RouteMap from './RouteMap';
import MultiStopManager from './MultiStopManager';
import SavedRoutesManager from './SavedRoutesManager';

const CreateOrderModal = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  
  // Check for pending order data
  const pendingOrder = JSON.parse(localStorage.getItem('pendingOrder') || '{}');
  
  // Hole heutiges Datum für Direktfahrt
  const today = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toTimeString().slice(0, 5);
  
  // Calculate initial delivery time (pickup + 30min)
  const calculateInitialDeliveryTime = (timeStr) => {
    const [hours, mins] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins + 30, 0, 0);
    return date.toTimeString().slice(0, 5);
  };

  const [formData, setFormData] = useState({
    pickup_address: pendingOrder.pickupAddress || (user?.company_address || ''),
    pickup_city: pendingOrder.pickupLocation?.city || (user?.company_city || ''),
    pickup_postal_code: pendingOrder.pickupLocation?.postalCode || (user?.company_postal_code || ''),
    pickup_country: 'Deutschland',
    pickup_company: user?.company_name || '',
    pickup_date: today,
    pickup_time_from: currentTime,
    pickup_time_to: calculateInitialDeliveryTime(currentTime),
    pickup_contact_name: user?.company_name ? `${user.first_name} ${user.last_name}` : '',
    pickup_contact_phone: user?.phone || '',
    delivery_address: pendingOrder.deliveryAddress || '',
    delivery_city: pendingOrder.deliveryLocation?.city || '',
    delivery_postal_code: pendingOrder.deliveryLocation?.postalCode || '',
    delivery_country: 'Deutschland',
    delivery_date: today, // Standard: Direktfahrt = gleiches Datum
    delivery_time_from: currentTime,
    delivery_time_to: calculateInitialDeliveryTime(currentTime), // WICHTIG: Abholzeit Von + 30min
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
  const [needsLoadingHelp, setNeedsLoadingHelp] = useState(false);
  const [needsUnloadingHelp, setNeedsUnloadingHelp] = useState(false);
  const [legalDelivery, setLegalDelivery] = useState(false);
  const [showLegalDeliveryInfo, setShowLegalDeliveryInfo] = useState(false);
  const [loadingHelpFee, setLoadingHelpFee] = useState(0);
  const [showSavedRoutes, setShowSavedRoutes] = useState(false);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');

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
    const LOADING_HELP_FEE = 6.00;
    
    const distanceCost = routeInfo.distance * PRICE_PER_KM;
    const durationHours = routeInfo.durationMinutes / 60;
    const timeCost = durationHours * HOURLY_RATE;
    
    // Berechne Extra-Stop-Gebühr
    const totalExtraStops = pickupStops.length + deliveryStops.length;
    const extraStopsCost = totalExtraStops * EXTRA_STOP_FEE;
    setExtraStopsFee(extraStopsCost);
    
    // Berechne Belade-/Entlade-Hilfe-Gebühr
    const helpFee = (needsLoadingHelp ? LOADING_HELP_FEE : 0) + (needsUnloadingHelp ? LOADING_HELP_FEE : 0);
    setLoadingHelpFee(helpFee);
    
    const calculatedMinimumPrice = distanceCost + timeCost + START_FEE + extraStopsCost + helpFee;
    
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

  // Hilfsfunktion: Addiere Minuten zu einer Zeit (HH:MM)
  const addMinutesToTime = (timeString, minutes) => {
    if (!timeString) return '';
    const [hours, mins] = timeString.split(':').map(Number);
    const minutesToAdd = Number(minutes); // Stelle sicher dass es eine Zahl ist
    const date = new Date();
    date.setHours(hours, mins + minutesToAdd, 0, 0);
    return date.toTimeString().slice(0, 5);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-fill "Bis" Zeit mit +30min wenn "Von" geändert wird
    if (name === 'pickup_time_from' && value) {
      const suggestedPickupTo = addMinutesToTime(value, 30);
      const shouldUpdatePickupTo = !formData.pickup_time_to || formData.pickup_time_to < value;
      
      // WICHTIG: Zustellzeit "Bis" MUSS MINDESTENS Abholzeit "Von" + 30min sein
      const minDeliveryTimeTo = addMinutesToTime(value, 30);
      
      // Wenn Zustellzeit "Bis" kleiner als Minimum ist, aktualisiere sie
      let newDeliveryTimeTo = formData.delivery_time_to;
      if (!formData.delivery_time_to || formData.delivery_time_to < minDeliveryTimeTo) {
        newDeliveryTimeTo = minDeliveryTimeTo;
      }
      
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        pickup_time_to: shouldUpdatePickupTo ? suggestedPickupTo : prev.pickup_time_to,
        delivery_time_to: newDeliveryTimeTo
      }));
    } else if (name === 'pickup_time_to' && value) {
      // Keine Auto-Anpassung bei Abholzeit Bis
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else if (name === 'delivery_time_from' && value) {
      // WICHTIG: Zustellzeit "Von" muss mindestens gleich Zustellzeit "Bis" sein (Punktlandung)
      // Aber Zustellzeit "Bis" muss mindestens Abholzeit "Von" + 30min sein
      const minDeliveryTimeTo = addMinutesToTime(formData.pickup_time_from || '00:00', 30);
      
      // Wenn Zustellzeit "Von" gesetzt wird, setze "Bis" auf gleichen Wert (Punktlandung)
      // ABER nur wenn "Bis" das Minimum erfüllt
      let newDeliveryTimeTo = formData.delivery_time_to;
      if (value >= minDeliveryTimeTo) {
        // Punktlandung möglich
        newDeliveryTimeTo = value;
      } else {
        // Minimum nicht erfüllt, setze auf Minimum
        newDeliveryTimeTo = minDeliveryTimeTo;
        alert(`Zustellzeit "Bis" muss mindestens Abholzeit "Von" + 30min sein (${minDeliveryTimeTo}). Zustellzeit wurde angepasst.`);
      }
      
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        delivery_time_to: newDeliveryTimeTo,
      }));
    } else if (name === 'delivery_time_to' && value) {
      // Zustellzeit "Bis" muss MINDESTENS Abholzeit "Von" + 30min sein
      const minDeliveryTimeTo = addMinutesToTime(formData.pickup_time_from || '00:00', 30);
      
      if (value < minDeliveryTimeTo) {
        alert(`Zustellzeit "Bis" muss mindestens Abholzeit "Von" + 30 Minuten sein (${minDeliveryTimeTo})!`);
        setFormData((prev) => ({
          ...prev,
          [name]: minDeliveryTimeTo,
        }));
        return;
      }
      
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    
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
        
        // Berechne Belade-/Entlade-Hilfe-Gebühr
        const LOADING_HELP_FEE = 6.00;
        const helpFee = (needsLoadingHelp ? LOADING_HELP_FEE : 0) + (needsUnloadingHelp ? LOADING_HELP_FEE : 0);
        setLoadingHelpFee(helpFee);
        
        const calculatedMinimumPrice = distanceCost + timeCost + START_FEE + extraStopsCost + helpFee;
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

  // Load a saved route into the form
  const handleLoadSavedRoute = (route) => {
    setFormData(prev => ({
      ...prev,
      pickup_address: route.pickup_address,
      pickup_city: route.pickup_city,
      pickup_postal_code: route.pickup_postal_code,
      pickup_country: route.pickup_country || 'Deutschland',
      pickup_company: route.pickup_company || prev.pickup_company,
      pickup_contact_name: route.pickup_contact_name || prev.pickup_contact_name,
      pickup_contact_phone: route.pickup_contact_phone || prev.pickup_contact_phone,
      delivery_address: route.delivery_address,
      delivery_city: route.delivery_city,
      delivery_postal_code: route.delivery_postal_code,
      delivery_country: route.delivery_country || 'Deutschland',
      delivery_company: route.delivery_company || '',
      delivery_contact_name: route.delivery_contact_name || '',
      delivery_contact_phone: route.delivery_contact_phone || '',
      description: route.cargo_description || prev.description,
      weight: route.cargo_weight || prev.weight,
      length: route.cargo_length || prev.length,
      width: route.cargo_width || prev.width,
      height: route.cargo_height || prev.height,
    }));

    // Set locations for map
    setPickupLocation({
      city: route.pickup_city,
      postalCode: route.pickup_postal_code,
      country: route.pickup_country || 'Deutschland'
    });
    setDeliveryLocation({
      city: route.delivery_city,
      postalCode: route.delivery_postal_code,
      country: route.delivery_country || 'Deutschland'
    });

    setShowSavedRoutes(false);
  };
  
  // Auto-adjust delivery times when pickup times change
  useEffect(() => {
    if (formData.pickup_time_from && formData.delivery_time_from) {
      // Ensure delivery_time_from is not before pickup_time_from
      if (formData.delivery_time_from < formData.pickup_time_from) {
        const minDeliveryTime = addMinutesToTime(formData.pickup_time_from, 30);
        setFormData(prev => ({
          ...prev,
          delivery_time_from: formData.pickup_time_from,
          delivery_time_to: minDeliveryTime
        }));
      }
    }
  }, [formData.pickup_time_from]);

  // Aktualisiere Preis und Extra-Stops-Gebühr wenn Stops sich ändern
  useEffect(() => {
    const PRICE_PER_KM = 0.50;
    const HOURLY_RATE = 22.50;
    const START_FEE = 6.00;
    const EXTRA_STOP_FEE = 6.00;
    const LOADING_HELP_FEE = 6.00;
    
    const totalExtraStops = pickupStops.length + deliveryStops.length;
    const calculatedFee = totalExtraStops * EXTRA_STOP_FEE;
    setExtraStopsFee(calculatedFee);
    
    // Berechne Belade-/Entlade-Hilfe-Gebühr
    const helpFee = (needsLoadingHelp ? LOADING_HELP_FEE : 0) + (needsUnloadingHelp ? LOADING_HELP_FEE : 0);
    setLoadingHelpFee(helpFee);
    
    // Aktualisiere Preis automatisch, wenn Route vorhanden ist
    if (routeInfo) {
      const distanceCost = routeInfo.distance * PRICE_PER_KM;
      const durationHours = routeInfo.durationMinutes / 60;
      const timeCost = durationHours * HOURLY_RATE;
      
      const calculatedMinimumPrice = distanceCost + timeCost + START_FEE + calculatedFee + helpFee;
      const recommendedPrice = calculatedMinimumPrice * 1.2;
      
      setMinimumPrice(calculatedMinimumPrice);
      
      // Aktualisiere Preis automatisch
      setFormData(prev => ({
        ...prev,
        price: recommendedPrice.toFixed(2)
      }));
      
      validatePrice(recommendedPrice.toFixed(2));
    }
  }, [pickupStops.length, deliveryStops.length, needsLoadingHelp, needsUnloadingHelp, routeInfo]);

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
        // Belade-/Entlade-Hilfe
        needs_loading_help: needsLoadingHelp,
        needs_unloading_help: needsUnloadingHelp,
        loading_help_fee: loadingHelpFee,
        // Rechtssichere Zustellung
        legal_delivery: legalDelivery,
      };

      console.log('Sending order data:', orderData);
      const response = await ordersAPI.createOrder(orderData);
      console.log('Order created successfully:', response);
      
      // Save as template if requested
      if (saveAsTemplate && templateName) {
        try {
          const routeData = {
            route_name: templateName,
            pickup_address: formData.pickup_address,
            pickup_city: formData.pickup_city,
            pickup_postal_code: formData.pickup_postal_code,
            pickup_country: formData.pickup_country,
            pickup_company: formData.pickup_company,
            pickup_contact_name: formData.pickup_contact_name,
            pickup_contact_phone: formData.pickup_contact_phone,
            delivery_address: formData.delivery_address,
            delivery_city: formData.delivery_city,
            delivery_postal_code: formData.delivery_postal_code,
            delivery_country: formData.delivery_country,
            delivery_company: formData.delivery_company,
            delivery_contact_name: formData.delivery_contact_name,
            delivery_contact_phone: formData.delivery_contact_phone,
            cargo_description: formData.description,
            cargo_weight: formData.weight ? parseFloat(formData.weight) : null,
            cargo_length: formData.length ? parseFloat(formData.length) : null,
            cargo_width: formData.width ? parseFloat(formData.width) : null,
            cargo_height: formData.height ? parseFloat(formData.height) : null,
          };
          
          const token = localStorage.getItem('token');
          await fetch('https://cityjumper-api-production-01e4.up.railway.app/api/saved-routes', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(routeData)
          });
          console.log('Route saved as template:', templateName);
        } catch (err) {
          console.error('Error saving route template:', err);
          // Don't block order creation if template save fails
        }
      }
      
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
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowSavedRoutes(!showSavedRoutes)}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 border border-yellow-300 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <Star className="h-4 w-4" />
              Gespeicherte Routen
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Saved Routes Section */}
        {showSavedRoutes && (
          <div className="p-6 bg-yellow-50 border-b">
            <SavedRoutesManager onSelectRoute={handleLoadSavedRoute} />
          </div>
        )}

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
                <label className="block text-sm font-medium text-gray-700">Abholzeit Von</label>
                <input
                  type="time"
                  name="pickup_time_from"
                  value={formData.pickup_time_from}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="z.B. 11:00"
                />
                <p className="text-xs text-gray-500 mt-1">Automatisch +30min Zeitfenster</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Abholzeit Bis</label>
                <input
                  type="time"
                  name="pickup_time_to"
                  value={formData.pickup_time_to}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="z.B. 13:00"
                />
                <p className="text-xs text-gray-500 mt-1">Wird automatisch vorgeschlagen (+30min)</p>
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
                  <label className="block text-sm font-medium text-gray-700">Zustellzeit Von</label>
                  <input
                    type="time"
                    name="delivery_time_from"
                    value={formData.delivery_time_from}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="z.B. 14:00"
                  />
                  <p className="text-xs text-gray-500 mt-1">Automatisch +30min Zeitfenster</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Zustellzeit Bis</label>
                  <input
                    type="time"
                    name="delivery_time_to"
                    value={formData.delivery_time_to}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="z.B. 16:00"
                  />
                  <p className="text-xs text-gray-500 mt-1">Wird automatisch vorgeschlagen (+30min)</p>
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
              
              {/* Belade-/Entlade-Hilfe - VOR dem Preisfeld */}
              <div className="md:col-span-2 space-y-3 pt-4 border-t">
                <h5 className="text-sm font-semibold text-gray-900">Zusätzliche Dienstleistungen</h5>
                
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="needsLoadingHelp"
                    checked={needsLoadingHelp}
                    onChange={(e) => setNeedsLoadingHelp(e.target.checked)}
                    className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="needsLoadingHelp" className="text-sm text-gray-700">
                    <span className="font-medium">Beladehilfe benötigt</span>
                    <span className="text-primary-600 font-semibold ml-2">(+€6,00)</span>
                    <p className="text-xs text-gray-500 mt-1">
                      Der Fahrer hilft beim Beladen des Fahrzeugs am Abholort
                    </p>
                  </label>
                </div>
                
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="needsUnloadingHelp"
                    checked={needsUnloadingHelp}
                    onChange={(e) => setNeedsUnloadingHelp(e.target.checked)}
                    className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="needsUnloadingHelp" className="text-sm text-gray-700">
                    <span className="font-medium">Entladehilfe benötigt</span>
                    <span className="text-primary-600 font-semibold ml-2">(+€6,00)</span>
                    <p className="text-xs text-gray-500 mt-1">
                      Der Fahrer hilft beim Entladen des Fahrzeugs am Zustellort
                    </p>
                  </label>
                </div>
                
                {loadingHelpFee > 0 && (
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                    <p className="text-sm text-primary-800 font-medium">
                      Zusätzliche Gebühr für Be-/Entladehilfe: €{loadingHelpFee.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="md:col-span-2">
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
                      📊 Berechnung: {routeInfo?.distance}km × €0,50 + {(routeInfo?.durationMinutes / 60).toFixed(2)}h × €22,50/h + €6 Startgebühr + {pickupStops.length + deliveryStops.length} Extra-Stops × €6{loadingHelpFee > 0 ? ` + €${loadingHelpFee.toFixed(2)} Be-/Entladehilfe` : ''} = €{minimumPrice?.toFixed(2)}
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
              
              {/* Rechtssichere Zustellung */}
              <div className="md:col-span-2 pt-4 border-t">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="legalDelivery"
                    checked={legalDelivery}
                    onChange={(e) => {
                      setLegalDelivery(e.target.checked);
                      if (e.target.checked) {
                        setShowLegalDeliveryInfo(true);
                      }
                    }}
                    className="mt-1 h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                  />
                  <label htmlFor="legalDelivery" className="text-sm text-gray-700">
                    <span className="font-medium">Rechtssichere Zustellung</span>
                    <p className="text-xs text-gray-500 mt-1">
                      Für rechtlich relevante Dokumente (z.B. Kündigungen, Mahnungen)
                    </p>
                  </label>
                </div>
                
                {showLegalDeliveryInfo && legalDelivery && (
                  <div className="mt-3 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="ml-3">
                        <h5 className="text-sm font-semibold text-amber-900 mb-2">
                          Wichtiger Hinweis zur rechtssicheren Zustellung
                        </h5>
                        <p className="text-sm text-amber-800 leading-relaxed">
                          Damit es eine rechtssichere Zustellung wird und der Kurier im Falle eines Rechtsstreits auch bestätigen kann, was er transportiert hat, ist es notwendig, dass Sie dem Fahrer das Transportgut (z.B. die Kündigung) zeigen. Andernfalls hat die Erfahrung gezeigt, dass sonst gerne behauptet wird, dass in dem Umschlag ein weißes Blatt oder ähnliches war. Der Kurier kann, wenn er den Inhalt nicht gesehen hat, nur bestätigen, dass er einen Brief mit unbekanntem Inhalt zugestellt hat.
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowLegalDeliveryInfo(false)}
                          className="mt-3 text-sm text-amber-700 hover:text-amber-900 font-medium underline"
                        >
                          Hinweis ausblenden
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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

          {/* Save as Template Option */}
          <div className="pt-4 border-t">
            <label className="flex items-center space-x-2 text-sm text-gray-700 mb-4">
              <input
                type="checkbox"
                checked={saveAsTemplate}
                onChange={(e) => setSaveAsTemplate(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="flex items-center">
                <Star className="h-4 w-4 mr-1 text-yellow-500" />
                Diese Route als Vorlage speichern
              </span>
            </label>
            
            {saveAsTemplate && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vorlagenname *
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="z.B. Werk Berlin → Lager Hamburg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required={saveAsTemplate}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
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
