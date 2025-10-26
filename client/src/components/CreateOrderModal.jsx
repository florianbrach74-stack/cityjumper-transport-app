import React, { useState } from 'react';
import { ordersAPI } from '../services/api';
import { X, MapPin, Calendar, Truck, Package, AlertCircle } from 'lucide-react';
import AddressAutocomplete from './AddressAutocomplete';

const CreateOrderModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    pickup_address: '',
    pickup_city: '',
    pickup_postal_code: '',
    pickup_country: 'Deutschland',
    pickup_date: '',
    pickup_time: '',
    pickup_contact_name: '',
    pickup_contact_phone: '',
    delivery_address: '',
    delivery_city: '',
    delivery_postal_code: '',
    delivery_country: 'Deutschland',
    delivery_date: '',
    delivery_time: '',
    delivery_contact_name: '',
    delivery_contact_phone: '',
    vehicle_type: 'Kleintransporter',
    weight: '',
    length: '',
    width: '',
    height: '',
    pallets: '',
    description: '',
    special_requirements: '',
    price: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const vehicleTypes = [
    'Kleintransporter (bis 2 Paletten)',
    'Mittlerer Transporter (bis 4 Paletten)',
    'Großer Transporter (bis 8 Paletten)',
    'Transporter mit Hebebühne',
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePickupAddressSelect = (address) => {
    setFormData((prev) => ({
      ...prev,
      pickup_address: address.full,
      pickup_city: address.city,
      pickup_postal_code: address.postalCode,
      pickup_country: address.country,
    }));
  };

  const handleDeliveryAddressSelect = (address) => {
    setFormData((prev) => ({
      ...prev,
      delivery_address: address.full,
      delivery_city: address.city,
      delivery_postal_code: address.postalCode,
      delivery_country: address.country,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Convert empty strings to null for optional numeric fields
      const orderData = {
        ...formData,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        length: formData.length ? parseFloat(formData.length) : null,
        width: formData.width ? parseFloat(formData.width) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        pallets: formData.pallets ? parseInt(formData.pallets) : null,
        price: formData.price ? parseFloat(formData.price) : null,
      };

      await ordersAPI.createOrder(orderData);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Fehler beim Erstellen des Auftrags');
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
              <AddressAutocomplete
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
                <label className="block text-sm font-medium text-gray-700">Uhrzeit</label>
                <input
                  type="time"
                  name="pickup_time"
                  value={formData.pickup_time}
                  onChange={handleChange}
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

          {/* Delivery Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-green-600" />
              Zustellung
            </h4>
            <div className="space-y-4">
              <AddressAutocomplete
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
              <div>
                <label className="block text-sm font-medium text-gray-700">Kontaktperson</label>
                <input
                  type="text"
                  name="delivery_contact_name"
                  value={formData.delivery_contact_name}
                  onChange={handleChange}
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
                <label className="block text-sm font-medium text-gray-700">Gewicht (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Paletten</label>
                <input
                  type="number"
                  name="pallets"
                  value={formData.pallets}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Länge (cm)</label>
                <input
                  type="number"
                  step="0.01"
                  name="length"
                  value={formData.length}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Breite (cm)</label>
                <input
                  type="number"
                  step="0.01"
                  name="width"
                  value={formData.width}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Höhe (cm)</label>
                <input
                  type="number"
                  step="0.01"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Preis (€)</label>
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
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
    </div>
  );
};

export default CreateOrderModal;
