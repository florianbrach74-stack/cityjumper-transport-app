import React, { useState, useEffect } from 'react';
import { cmrAPI } from '../services/cmrApi';
import { ordersAPI } from '../services/api';
import SignatureModal from './SignatureModal';
import { FileText, Download, ExternalLink, CheckCircle, Clock, QrCode, PenTool } from 'lucide-react';

const CMRViewer = ({ orderId, onClose }) => {
  const [cmr, setCmr] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSignatureModal, setShowSignatureModal] = useState(null); // 'sender' or 'carrier'
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Get current user
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    fetchData();
  }, [orderId]);

  const fetchData = async () => {
    try {
      const [cmrResponse, orderResponse] = await Promise.all([
        cmrAPI.getCMRByOrderId(orderId),
        ordersAPI.getOrder(orderId)
      ]);
      setCmr(cmrResponse.data.cmr);
      setOrder(orderResponse.data.order);
    } catch (err) {
      setError('CMR-Dokument nicht gefunden');
    } finally {
      setLoading(false);
    }
  };

  const handleSignatureSubmit = async (signatureType, data) => {
    try {
      await cmrAPI.addSignature(cmr.id, {
        ...data,
        signatureType,
      });
      setShowSignatureModal(null);
      await fetchData(); // Refresh CMR and order data
      alert('Unterschrift erfolgreich hinzugefügt!');
    } catch (err) {
      console.error('Error adding signature:', err);
      alert('Fehler beim Hinzufügen der Unterschrift');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      created: { color: 'bg-blue-100 text-blue-800', text: 'Erstellt', icon: FileText },
      in_transit: { color: 'bg-purple-100 text-purple-800', text: 'Unterwegs', icon: Clock },
      delivered: { color: 'bg-green-100 text-green-800', text: 'Zugestellt', icon: CheckCircle },
      signed: { color: 'bg-green-100 text-green-800', text: 'Unterschrieben', icon: CheckCircle },
    };
    const badge = badges[status] || badges.created;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="h-3 w-3" />
        <span>{badge.text}</span>
      </span>
    );
  };

  const copySignatureLink = () => {
    const link = `${window.location.origin}/cmr/${cmr.cmr_number}`;
    navigator.clipboard.writeText(link);
    alert('Link kopiert! Senden Sie diesen Link an den Empfänger zur Unterschrift.');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            Schließen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">CMR Frachtbrief</h3>
              <p className="text-sm text-gray-600">Nr: {cmr.cmr_number}</p>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusBadge(cmr.status)}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 ml-4"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Document Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">CMR-Nummer</p>
                  <p className="font-semibold text-gray-900">{cmr.cmr_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Erstellt am</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(cmr.created_at).toLocaleString('de-DE')}
                  </p>
                </div>
              </div>
            </div>

            {/* Parties */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Sender */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Absender</h4>
                <p className="text-sm text-gray-900">{cmr.sender_name}</p>
                <p className="text-sm text-gray-600">{cmr.sender_address}</p>
                <p className="text-sm text-gray-600">
                  {cmr.sender_postal_code} {cmr.sender_city}
                </p>
                <p className="text-sm text-gray-600">{cmr.sender_country}</p>
                {cmr.sender_signature && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-green-600 flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Unterschrieben
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(cmr.sender_signed_at).toLocaleString('de-DE')}
                    </p>
                  </div>
                )}
              </div>

              {/* Carrier */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Frachtführer</h4>
                <p className="text-sm text-gray-900">{cmr.carrier_name}</p>
                {cmr.carrier_address && (
                  <>
                    <p className="text-sm text-gray-600">{cmr.carrier_address}</p>
                    <p className="text-sm text-gray-600">
                      {cmr.carrier_postal_code} {cmr.carrier_city}
                    </p>
                  </>
                )}
                {cmr.carrier_signature && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-green-600 flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Unterschrieben
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(cmr.carrier_signed_at).toLocaleString('de-DE')}
                    </p>
                  </div>
                )}
              </div>

              {/* Consignee */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Empfänger</h4>
                <p className="text-sm text-gray-900">{cmr.consignee_name}</p>
                <p className="text-sm text-gray-600">{cmr.consignee_address}</p>
                <p className="text-sm text-gray-600">
                  {cmr.consignee_postal_code} {cmr.consignee_city}
                </p>
                <p className="text-sm text-gray-600">{cmr.consignee_country}</p>
                {cmr.consignee_signature ? (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-green-600 flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Unterschrieben
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(cmr.consignee_signed_at).toLocaleString('de-DE')}
                    </p>
                    {cmr.consignee_remarks && (
                      <p className="text-xs text-gray-600 mt-1">
                        Bemerkung: {cmr.consignee_remarks}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-yellow-600 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Ausstehend
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Goods Description */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Sendungsdetails</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                {cmr.number_of_packages && (
                  <div>
                    <p className="text-xs text-gray-600">Anzahl</p>
                    <p className="text-sm font-medium">{cmr.number_of_packages}</p>
                  </div>
                )}
                {cmr.method_of_packing && (
                  <div>
                    <p className="text-xs text-gray-600">Verpackung</p>
                    <p className="text-sm font-medium">{cmr.method_of_packing}</p>
                  </div>
                )}
                {cmr.gross_weight && (
                  <div>
                    <p className="text-xs text-gray-600">Gewicht</p>
                    <p className="text-sm font-medium">{cmr.gross_weight} kg</p>
                  </div>
                )}
                {cmr.volume && (
                  <div>
                    <p className="text-xs text-gray-600">Volumen</p>
                    <p className="text-sm font-medium">{cmr.volume} m³</p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Beschreibung</p>
                <p className="text-sm text-gray-900">{cmr.goods_description}</p>
              </div>
              {cmr.special_agreements && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-gray-600 mb-1">Besondere Vereinbarungen</p>
                  <p className="text-sm text-gray-900">{cmr.special_agreements}</p>
                </div>
              )}
            </div>

            {/* Signature Buttons - Context-aware based on order status */}
            <div className="space-y-3">
              {/* Pickup Phase: Sender & Carrier signatures */}
              {order && (order.status === 'accepted' || order.status === 'picked_up') && (
                <>
                  {/* Sender Signature */}
                  {!cmr.sender_signature && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-green-900">1. Absender-Unterschrift</h4>
                          <p className="text-sm text-green-800">
                            Bei Abholung: Absender unterschreibt auf Ihrem Gerät
                          </p>
                        </div>
                        <button
                          onClick={() => setShowSignatureModal('sender')}
                          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          <PenTool className="h-4 w-4 mr-2" />
                          Unterschreiben
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Carrier Signature */}
                  {!cmr.carrier_signature && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-purple-900">2. Frachtführer-Unterschrift</h4>
                          <p className="text-sm text-purple-800">
                            Bei Abholung: Sie unterschreiben als Frachtführer
                          </p>
                        </div>
                        <button
                          onClick={() => setShowSignatureModal('carrier')}
                          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                          <PenTool className="h-4 w-4 mr-2" />
                          Unterschreiben
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Delivery Phase: Consignee signature only */}
              {order && order.status === 'delivered' && !cmr.consignee_signature && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-blue-900">3. Empfänger-Unterschrift</h4>
                      <p className="text-sm text-blue-800">
                        Bei Zustellung: Empfänger unterschreibt auf Ihrem Gerät
                      </p>
                    </div>
                    <button
                      onClick={() => setShowSignatureModal('consignee')}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <PenTool className="h-4 w-4 mr-2" />
                      Unterschreiben
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Schließen
              </button>
              <button
                onClick={() => {
                  const downloadUrl = `${import.meta.env.VITE_API_URL || 'https://cityjumper-api-production-01e4.up.railway.app'}/api/cmr/${cmr.cmr_number}/download`;
                  console.log('Download URL:', downloadUrl);
                  console.log('CMR Number:', cmr.cmr_number);
                  window.open(downloadUrl, '_blank');
                }}
                disabled={!cmr.cmr_number}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4 mr-2" />
                PDF herunterladen
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Signature Modal */}
      {showSignatureModal && (
        <SignatureModal
          title={
            showSignatureModal === 'sender' ? 'Absender-Unterschrift' :
            showSignatureModal === 'carrier' ? 'Frachtführer-Unterschrift' :
            'Empfänger-Unterschrift'
          }
          signerName={
            showSignatureModal === 'carrier' && currentUser 
              ? `${currentUser.first_name} ${currentUser.last_name}` 
              : ''
          }
          isCarrier={showSignatureModal === 'carrier'}
          onClose={() => setShowSignatureModal(null)}
          onSubmit={(data) => handleSignatureSubmit(showSignatureModal, data)}
        />
      )}
    </div>
  );
};

export default CMRViewer;
