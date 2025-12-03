import React, { useState, useEffect } from 'react';
import { X, User, Building, MapPin, Package, Calendar, Truck, FileText, DollarSign } from 'lucide-react';
import api from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import InvoiceGenerator from './InvoiceGenerator';

const DetailedOrderView = ({ orderId, onClose }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInvoice, setShowInvoice] = useState(false);

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      const response = await api.get(`/admin/orders/${orderId}/details`);
      setOrder(response.data.order);
    } catch (error) {
      console.error('Error loading order details:', error);
      alert('Fehler beim Laden der Auftragsdetails');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      in_transit: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    const labels = {
      pending: 'Ausstehend',
      accepted: 'Akzeptiert',
      in_transit: 'Unterwegs',
      completed: 'Abgeschlossen',
      cancelled: 'Storniert'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <>
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-10 mx-auto p-5 max-w-6xl">
          <div className="bg-white rounded-lg shadow-xl">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Auftrag #{order.id}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Erstellt am {new Date(order.created_at).toLocaleString('de-DE')}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {getStatusBadge(order.status)}
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Customer & Contractor Info */}
              <div className="grid grid-cols-2 gap-6">
                {/* Customer */}
                <div className="border rounded-lg p-4 bg-blue-50">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <User className="h-5 w-5 mr-2 text-blue-600" />
                    Auftraggeber (Kunde)
                  </h3>
                  {order.customer_company ? (
                    <div className="space-y-2 text-sm">
                      <div>
                        <Building className="h-4 w-4 inline mr-2 text-blue-600" />
                        <strong>{order.customer_company}</strong>
                      </div>
                      {order.customer_company_address && (
                        <div className="ml-6 text-gray-700">
                          {order.customer_company_address}<br />
                          {order.customer_company_postal_code} {order.customer_company_city}
                        </div>
                      )}
                      {order.customer_tax_id && (
                        <div className="ml-6 text-gray-600">
                          Steuer-Nr: {order.customer_tax_id}
                        </div>
                      )}
                      {order.customer_vat_id && (
                        <div className="ml-6 text-gray-600">
                          USt-IdNr: {order.customer_vat_id}
                        </div>
                      )}
                      <div className="border-t pt-2 mt-2">
                        <div className="text-gray-700">
                          Kontakt: {order.customer_first_name} {order.customer_last_name}
                        </div>
                        <div className="text-gray-600">
                          📧 {order.customer_email}
                        </div>
                        {order.customer_phone && (
                          <div className="text-gray-600">
                            📱 {order.customer_phone}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 text-sm">
                      <div className="font-medium">
                        {order.customer_first_name} {order.customer_last_name}
                      </div>
                      <div className="text-gray-600">📧 {order.customer_email}</div>
                      {order.customer_phone && (
                        <div className="text-gray-600">📱 {order.customer_phone}</div>
                      )}
                      <div className="text-xs text-gray-500 mt-2">Privatkunde</div>
                    </div>
                  )}
                </div>

                {/* Contractor */}
                <div className="border rounded-lg p-4 bg-green-50">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Truck className="h-5 w-5 mr-2 text-green-600" />
                    Auftragnehmer
                  </h3>
                  {order.contractor_id ? (
                    order.contractor_company ? (
                      <div className="space-y-2 text-sm">
                        <div>
                          <Building className="h-4 w-4 inline mr-2 text-green-600" />
                          <strong>{order.contractor_company}</strong>
                        </div>
                        {order.contractor_company_address && (
                          <div className="ml-6 text-gray-700">
                            {order.contractor_company_address}<br />
                            {order.contractor_company_postal_code} {order.contractor_company_city}
                          </div>
                        )}
                        <div className="border-t pt-2 mt-2">
                          <div className="text-gray-700">
                            Kontakt: {order.contractor_first_name} {order.contractor_last_name}
                          </div>
                          <div className="text-gray-600">
                            📧 {order.contractor_email}
                          </div>
                          {order.contractor_phone && (
                            <div className="text-gray-600">
                              📱 {order.contractor_phone}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 text-sm">
                        <div className="font-medium">
                          {order.contractor_first_name} {order.contractor_last_name}
                        </div>
                        <div className="text-gray-600">📧 {order.contractor_email}</div>
                        {order.contractor_phone && (
                          <div className="text-gray-600">📱 {order.contractor_phone}</div>
                        )}
                      </div>
                    )
                  ) : (
                    <div className="text-sm text-gray-500 italic">
                      Noch kein Auftragnehmer zugewiesen
                    </div>
                  )}
                </div>
              </div>

              {/* Route Information */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-primary-600" />
                  Routeninformationen
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  {/* Pickup */}
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">📍 Abholung</div>
                    <div className="space-y-1 text-sm text-gray-600">
                      {order.pickup_company && (
                        <div className="font-medium text-gray-900">{order.pickup_company}</div>
                      )}
                      {order.pickup_contact_name && (
                        <div>Kontakt: {order.pickup_contact_name}</div>
                      )}
                      <div>{order.pickup_address}</div>
                      <div>{order.pickup_postal_code} {order.pickup_city}</div>
                      <div className="pt-2 border-t">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        {new Date(order.pickup_date).toLocaleDateString('de-DE')}
                        {order.pickup_time_start && order.pickup_time_end && (
                          <> • {order.pickup_time_start} - {order.pickup_time_end}</>
                        )}
                      </div>
                      {order.pickup_contact_phone && (
                        <div>📱 {order.pickup_contact_phone}</div>
                      )}
                    </div>
                  </div>

                  {/* Delivery */}
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">🎯 Zustellung</div>
                    <div className="space-y-1 text-sm text-gray-600">
                      {order.delivery_company && (
                        <div className="font-medium text-gray-900">{order.delivery_company}</div>
                      )}
                      {order.delivery_contact_name && (
                        <div>Kontakt: {order.delivery_contact_name}</div>
                      )}
                      <div>{order.delivery_address}</div>
                      <div>{order.delivery_postal_code} {order.delivery_city}</div>
                      <div className="pt-2 border-t">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        {new Date(order.delivery_date).toLocaleDateString('de-DE')}
                        {order.delivery_time_start && order.delivery_time_end && (
                          <> • {order.delivery_time_start} - {order.delivery_time_end}</>
                        )}
                      </div>
                      {order.delivery_contact_phone && (
                        <div>📱 {order.delivery_contact_phone}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Multi-Stop Information */}
                {(order.pickup_stops?.length > 0 || order.delivery_stops?.length > 0) && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-sm font-medium text-orange-600 mb-3">
                      🚚 Multi-Stop Auftrag ({(order.pickup_stops?.length || 0) + (order.delivery_stops?.length || 0) + 2} Stops)
                    </div>
                    
                    {/* Additional Pickup Stops */}
                    {order.pickup_stops?.length > 0 && (
                      <div className="mb-4">
                        <div className="text-xs font-medium text-gray-700 mb-2">Zusätzliche Abholungen:</div>
                        <div className="space-y-2">
                          {order.pickup_stops.map((stop, index) => (
                            <div key={index} className="pl-4 border-l-2 border-green-400 text-sm text-gray-600">
                              <div className="font-medium">{stop.address}</div>
                              <div>{stop.postal_code} {stop.city}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Additional Delivery Stops */}
                    {order.delivery_stops?.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-gray-700 mb-2">Zusätzliche Zustellungen:</div>
                        <div className="space-y-2">
                          {order.delivery_stops.map((stop, index) => (
                            <div key={index} className="pl-4 border-l-2 border-blue-400 text-sm text-gray-600">
                              <div className="font-medium">{stop.address}</div>
                              <div>{stop.postal_code} {stop.city}</div>
                              {stop.time_start && stop.time_end && (
                                <div className="text-blue-600 font-medium">⏰ {stop.time_start} - {stop.time_end}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Distance & Duration */}
                {(order.distance_km || order.duration_minutes) && (
                  <div className="mt-4 pt-4 border-t bg-gray-50 -mx-4 px-4 py-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {order.distance_km && (
                        <div>
                          <span className="text-gray-600">🛣️ Entfernung:</span>
                          <span className="font-semibold ml-2">{order.distance_km} km</span>
                        </div>
                      )}
                      {order.duration_minutes && (
                        <div>
                          <span className="text-gray-600">⏱️ Fahrzeit:</span>
                          <span className="font-semibold ml-2">
                            {Math.floor(order.duration_minutes / 60)}h {order.duration_minutes % 60}min
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Shipment Details */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Package className="h-5 w-5 mr-2 text-primary-600" />
                  Sendungsdetails
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Fahrzeug:</div>
                    <div className="font-medium">{order.vehicle_type}</div>
                  </div>
                  {order.weight && (
                    <div>
                      <div className="text-gray-600">Gewicht:</div>
                      <div className="font-medium">{order.weight} kg</div>
                    </div>
                  )}
                  {order.pallets && (
                    <div>
                      <div className="text-gray-600">Paletten:</div>
                      <div className="font-medium">{order.pallets}</div>
                    </div>
                  )}
                  {(order.length || order.width || order.height) && (
                    <div>
                      <div className="text-gray-600">Maße (L×B×H):</div>
                      <div className="font-medium">
                        {order.length}×{order.width}×{order.height} cm
                      </div>
                    </div>
                  )}
                </div>
                {order.description && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-gray-600 text-sm">Beschreibung:</div>
                    <div className="text-sm mt-1">{order.description}</div>
                  </div>
                )}
                {order.special_requirements && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-gray-600 text-sm">Besondere Anforderungen:</div>
                    <div className="text-sm mt-1">{order.special_requirements}</div>
                  </div>
                )}
                
                {/* Zusätzliche Dienstleistungen */}
                {(order.needs_loading_help || order.needs_unloading_help || order.legal_delivery) && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-gray-600 text-sm font-semibold mb-2">Zusätzliche Dienstleistungen:</div>
                    {order.needs_loading_help && (
                      <div className="flex items-center text-sm mt-1 text-primary-700">
                        <span className="mr-2">✓</span>
                        <span>Beladehilfe benötigt (+€6,00)</span>
                      </div>
                    )}
                    {order.needs_unloading_help && (
                      <div className="flex items-center text-sm mt-1 text-primary-700">
                        <span className="mr-2">✓</span>
                        <span>Entladehilfe benötigt (+€6,00)</span>
                      </div>
                    )}
                    {order.legal_delivery && (
                      <div className="mt-2 bg-amber-50 border-l-4 border-amber-500 p-3 rounded">
                        <div className="flex items-start">
                          <span className="text-amber-600 font-bold mr-2">⚠️</span>
                          <div>
                            <div className="font-semibold text-amber-900 text-sm">Rechtssichere Zustellung</div>
                            <div className="text-xs text-amber-800 mt-1">
                              WICHTIG: Lassen Sie sich vom Kunden das Transportgut zeigen (z.B. Kündigung), um im Rechtsstreit bestätigen zu können, was Sie transportiert haben. Andernfalls können Sie nur bestätigen, dass Sie einen Brief mit unbekanntem Inhalt zugestellt haben.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Price Information */}
              <div className="border-2 border-primary-200 rounded-lg p-4 bg-primary-50">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-primary-600" />
                  Preisinformationen
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-lg">
                    <span className="text-gray-700">Auftragspreis:</span>
                    <span className="font-bold text-primary-600">{formatPrice(order.price)}</span>
                  </div>
                  {order.waiting_time_fee > 0 && (
                    <div className="flex justify-between text-sm border-t pt-2">
                      <span className="text-gray-600">
                        Wartezeit {order.waiting_time_approved ? '(genehmigt)' : '(ausstehend)'}:
                      </span>
                      <span className={order.waiting_time_approved ? 'text-green-600 font-medium' : 'text-gray-600'}>
                        + {formatPrice(order.waiting_time_fee)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Schließen
              </button>
              <button
                onClick={() => setShowInvoice(true)}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <FileText className="h-4 w-4 mr-2" />
                Rechnung erstellen
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Generator */}
      {showInvoice && (
        <InvoiceGenerator
          order={order}
          onClose={() => setShowInvoice(false)}
        />
      )}
    </>
  );
};

export default DetailedOrderView;
