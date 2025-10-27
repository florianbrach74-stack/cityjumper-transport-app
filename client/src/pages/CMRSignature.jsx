import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cmrAPI } from '../services/cmrApi';
import SignaturePad from '../components/SignaturePad';
import { FileText, MapPin, Package, CheckCircle, Truck } from 'lucide-react';

const CMRSignature = () => {
  const { cmrNumber } = useParams();
  const navigate = useNavigate();
  const [cmr, setCmr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [location, setLocation] = useState('');
  const [remarks, setRemarks] = useState('');
  const [consigneeName, setConsigneeName] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [deliveryType, setDeliveryType] = useState('signature'); // 'signature' or 'photo'
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchCMR();
    // Get geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(`${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`);
        },
        () => {
          setLocation('Standort nicht verfügbar');
        }
      );
    }
  }, [cmrNumber]);

  const fetchCMR = async () => {
    try {
      const response = await cmrAPI.getCMRByCMRNumber(cmrNumber);
      setCmr(response.data.cmr);
      
      // Check if already signed
      if (response.data.cmr.consignee_signature) {
        setSuccess(true);
      }
    } catch (err) {
      setError('CMR-Dokument nicht gefunden');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoSubmit = async () => {
    if (!consigneeName.trim()) {
      setError('Bitte geben Sie den Namen des Empfängers ein');
      return;
    }

    if (!photoPreview) {
      setError('Bitte laden Sie ein Foto hoch');
      return;
    }

    setSubmitting(true);
    try {
      await cmrAPI.addSignature(cmr.id, {
        signatureType: 'consignee',
        signatureData: null, // No signature, only photo
        location,
        remarks,
        consigneeName: consigneeName.trim(),
        photoUrl: photoPreview, // Base64 encoded photo
      });
      
      setSuccess(true);
      await fetchCMR();
    } catch (err) {
      setError('Fehler beim Speichern des Fotos');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignature = async (signatureData) => {
    if (!consigneeName.trim()) {
      setError('Bitte geben Sie den Namen des Empfängers ein');
      return;
    }

    setSubmitting(true);
    try {
      await cmrAPI.addSignature(cmr.id, {
        signatureType: 'consignee',
        signatureData,
        location,
        remarks,
        consigneeName: consigneeName.trim(),
        photoUrl: photoPreview || null, // Include photo if available
      });
      
      setShowSignaturePad(false);
      setSuccess(true);
      
      // Refresh CMR data
      await fetchCMR();
    } catch (err) {
      setError('Fehler beim Speichern der Unterschrift');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-600 mb-4">
            <FileText className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Fehler</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-green-600 mb-4">
            <CheckCircle className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erfolgreich unterschrieben!</h2>
          <p className="text-gray-600 mb-6">
            Das CMR-Dokument wurde erfolgreich unterschrieben. Der Absender und Frachtführer wurden benachrichtigt.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">CMR-Nummer</p>
            <p className="text-lg font-semibold text-gray-900">{cmr.cmr_number}</p>
          </div>
          <p className="text-sm text-gray-500">
            Sie können dieses Fenster jetzt schließen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">CMR Frachtbrief</h1>
              <p className="text-sm text-gray-600">Internationale Frachtbescheinigung</p>
            </div>
            <FileText className="h-12 w-12 text-primary-600" />
          </div>
          <div className="bg-primary-50 rounded-lg p-4">
            <p className="text-sm text-primary-800 font-medium">CMR-Nummer</p>
            <p className="text-xl font-bold text-primary-900">{cmr.cmr_number}</p>
          </div>
        </div>

        {/* Shipment Details */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sendungsdetails</h2>
          
          {/* Sender */}
          <div className="mb-4 pb-4 border-b">
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700">Absender</p>
                <p className="text-gray-900">{cmr.sender_name}</p>
                <p className="text-sm text-gray-600">{cmr.sender_address}</p>
                <p className="text-sm text-gray-600">
                  {cmr.sender_postal_code} {cmr.sender_city}, {cmr.sender_country}
                </p>
              </div>
            </div>
          </div>

          {/* Consignee */}
          <div className="mb-4 pb-4 border-b">
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700">Empfänger</p>
                <p className="text-gray-900">{cmr.consignee_name}</p>
                <p className="text-sm text-gray-600">{cmr.consignee_address}</p>
                <p className="text-sm text-gray-600">
                  {cmr.consignee_postal_code} {cmr.consignee_city}, {cmr.consignee_country}
                </p>
              </div>
            </div>
          </div>

          {/* Carrier */}
          <div className="mb-4 pb-4 border-b">
            <div className="flex items-start space-x-3">
              <Truck className="h-5 w-5 text-primary-600 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700">Frachtführer</p>
                <p className="text-gray-900">{cmr.carrier_name}</p>
              </div>
            </div>
          </div>

          {/* Goods */}
          <div>
            <div className="flex items-start space-x-3">
              <Package className="h-5 w-5 text-gray-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">Güter</p>
                <p className="text-gray-900">{cmr.goods_description}</p>
                <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                  {cmr.number_of_packages && (
                    <div>
                      <span className="text-gray-600">Anzahl: </span>
                      <span className="font-medium">{cmr.number_of_packages}</span>
                    </div>
                  )}
                  {cmr.gross_weight && (
                    <div>
                      <span className="text-gray-600">Gewicht: </span>
                      <span className="font-medium">{cmr.gross_weight} kg</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Signature Section */}
        {!cmr.consignee_signature && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Empfangsbestätigung</h2>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Für Fahrer:</strong> Bitte geben Sie den Namen des Empfängers ein und wählen Sie:
                <br/>• <strong>Unterschrift</strong> - Empfänger unterschreibt auf dem Handy
                <br/>• <strong>Foto</strong> - Für Briefkasten-Zustellung (z.B. Kündigung)
              </p>
            </div>

            {/* Delivery Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Zustellungsart *</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setDeliveryType('signature')}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    deliveryType === 'signature'
                      ? 'border-primary-600 bg-primary-50 text-primary-900'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="font-semibold">✍️ Unterschrift</div>
                  <div className="text-xs mt-1">Empfänger unterschreibt</div>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryType('photo')}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    deliveryType === 'photo'
                      ? 'border-primary-600 bg-primary-50 text-primary-900'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="font-semibold">📸 Foto</div>
                  <div className="text-xs mt-1">Briefkasten-Zustellung</div>
                </button>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name des Empfängers *
                </label>
                <input
                  type="text"
                  value={consigneeName}
                  onChange={(e) => setConsigneeName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="z.B. Max Mustermann"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tragen Sie hier den Namen der Person ein, die die Sendung entgegennimmt
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Standort (automatisch erfasst)
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Standort"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bemerkungen (optional)
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="z.B. Sendung in gutem Zustand erhalten"
                />
              </div>

              {/* Photo Upload (only if photo delivery type) */}
              {deliveryType === 'photo' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Foto hochladen *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                  {photoPreview && (
                    <div className="mt-2">
                      <img src={photoPreview} alt="Preview" className="max-w-full h-48 object-contain rounded-lg border" />
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    📸 Foto von Briefkasten, Kündigung, etc.
                  </p>
                </div>
              )}
            </div>

            {deliveryType === 'signature' ? (
              <button
                onClick={() => {
                  if (!consigneeName.trim()) {
                    alert('Bitte geben Sie den Namen des Empfängers ein');
                    return;
                  }
                  setShowSignaturePad(true);
                }}
                className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <FileText className="h-5 w-5 mr-2" />
                Empfänger unterschreiben lassen
              </button>
            ) : (
              <button
                onClick={handlePhotoSubmit}
                disabled={submitting || !photoPreview}
                className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Wird gespeichert...
                  </>
                ) : (
                  <>
                    <FileText className="h-5 w-5 mr-2" />
                    Foto speichern
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Signature Pad Modal */}
        {showSignaturePad && (
          <SignaturePad
            onSave={handleSignature}
            onCancel={() => setShowSignaturePad(false)}
          />
        )}
      </div>
    </div>
  );
};

export default CMRSignature;
