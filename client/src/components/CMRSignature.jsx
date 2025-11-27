import React, { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X, Camera, CheckCircle, ArrowRight, Package } from 'lucide-react';
import api from '../utils/api';

const CMRSignatureMultiStop = ({ order, mode, onClose, onComplete }) => {
  // Multi-stop state
  const [cmrGroup, setCmrGroup] = useState(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [isMultiStop, setIsMultiStop] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Signature state
  const [senderName, setSenderName] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [receiverNotHome, setReceiverNotHome] = useState(false);
  const [deliveryPhoto, setDeliveryPhoto] = useState(null);
  const [waitingMinutes, setWaitingMinutes] = useState(0);
  const [waitingNotes, setWaitingNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const senderSigRef = useRef(null);
  const carrierSigRef = useRef(null);
  const receiverSigRef = useRef(null);
  const photoInputRef = useRef(null);

  // Load CMR group info
  useEffect(() => {
    if (mode === 'delivery') {
      loadCMRGroup();
    } else {
      setLoading(false);
    }
  }, [order.id, mode]);

  const loadCMRGroup = async () => {
    try {
      const response = await api.get(`/cmr/order/${order.id}/group`);
      const data = response.data;
      
      if (data.isMultiStop && data.cmrs.length > 1) {
        setIsMultiStop(true);
        setCmrGroup(data);
        console.log('📦 Multi-stop order detected:', data.cmrs.length, 'deliveries');
      }
    } catch (error) {
      console.error('Error loading CMR group:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentCMR = () => {
    if (!isMultiStop || !cmrGroup) return null;
    return cmrGroup.cmrs[currentStopIndex];
  };

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDeliveryPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePickupSubmit = async () => {
    setSubmitting(true);
    try {
      // Validate
      if (!senderName || !senderName.trim()) {
        alert('Bitte geben Sie den Namen des Absenders ein.');
        setSubmitting(false);
        return;
      }
      if (senderSigRef.current?.isEmpty()) {
        alert('Bitte unterschreiben Sie als Absender.');
        setSubmitting(false);
        return;
      }
      if (carrierSigRef.current?.isEmpty()) {
        alert('Bitte unterschreiben Sie als Frachtführer.');
        setSubmitting(false);
        return;
      }

      const data = {
        senderName: senderName,
        senderSignature: senderSigRef.current.toDataURL(),
        carrierSignature: carrierSigRef.current.toDataURL(),
        pickupWaitingMinutes: parseInt(waitingMinutes) || 0,
        waitingNotes: waitingNotes.trim() || undefined
      };

      // If multi-stop, save shared signatures
      if (isMultiStop && cmrGroup?.canShareSenderSignature) {
        await api.post(`/cmr/order/${order.id}/shared-signatures`, {
          senderSignature: data.senderSignature,
          carrierSignature: data.carrierSignature
        });
        console.log('✅ Shared signatures saved for all CMRs');
      }

      await onComplete(data);
    } catch (error) {
      console.error('Error submitting pickup:', error);
      alert('Fehler beim Speichern: ' + (error.message || 'Unbekannter Fehler'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeliverySubmit = async () => {
    setSubmitting(true);
    try {
      const currentCMR = getCurrentCMR();

      // Validate
      if (!receiverNotHome) {
        if (!receiverName || !receiverName.trim()) {
          alert('Bitte geben Sie den Namen des Empfängers ein.');
          setSubmitting(false);
          return;
        }
        if (receiverSigRef.current?.isEmpty()) {
          alert('Bitte lassen Sie den Empfänger unterschreiben.');
          setSubmitting(false);
          return;
        }
      } else {
        if (!deliveryPhoto) {
          alert('Bitte machen Sie ein Foto der Zustellung.');
          setSubmitting(false);
          return;
        }
      }

      // Prepare data
      const data = {
        receiverName: receiverNotHome ? 'Nicht angetroffen' : receiverName,
        receiverSignature: receiverNotHome ? null : receiverSigRef.current.toDataURL(),
        deliveryPhoto: deliveryPhoto || undefined,
        deliveryWaitingMinutes: parseInt(waitingMinutes) || 0,
        waitingNotes: waitingNotes.trim() || undefined
      };

      // If multi-stop, handle sequential delivery
      if (isMultiStop && currentCMR) {
        // Save photo if provided
        if (deliveryPhoto) {
          await api.post(`/cmr/${currentCMR.id}/delivery-photo`, {
            photoBase64: deliveryPhoto
          });
        }

        // Check if there are more deliveries
        const nextResponse = await api.get(`/cmr/order/${order.id}/next-delivery`);
        const nextData = nextResponse.data;

        if (nextData.completed) {
          // All deliveries done!
          console.log('🎉 All deliveries completed!');
          await onComplete(data);
        } else {
          // Move to next delivery
          console.log('→ Moving to next delivery');
          setCurrentStopIndex(currentStopIndex + 1);
          
          // Reset form for next delivery
          setReceiverName('');
          setReceiverNotHome(false);
          setDeliveryPhoto(null);
          setWaitingMinutes(0);
          setWaitingNotes('');
          if (receiverSigRef.current) {
            receiverSigRef.current.clear();
          }
          
          setSubmitting(false);
          return; // Don't close modal, continue to next delivery
        }
      } else {
        // Single delivery
        await onComplete(data);
      }
    } catch (error) {
      console.error('Error submitting delivery:', error);
      alert('Fehler beim Speichern: ' + (error.message || 'Unbekannter Fehler'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade CMR-Daten...</p>
        </div>
      </div>
    );
  }

  const currentCMR = getCurrentCMR();
  const totalStops = cmrGroup?.totalStops || 1;
  const currentStop = currentStopIndex + 1;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {mode === 'pickup' ? '📦 Paket abholen' : '🚚 Paket zustellen'}
              </h3>
              {isMultiStop && mode === 'delivery' && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-primary-600" />
                    <span className="text-sm font-medium text-primary-600">
                      Zustellung {currentStop} von {totalStops}
                    </span>
                  </div>
                  {currentCMR && (
                    <p className="text-sm text-gray-600 mt-1">
                      {currentCMR.consignee_name} • {currentCMR.consignee_city}
                    </p>
                  )}
                  {/* Progress bar */}
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(currentStop / totalStops) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {mode === 'pickup' ? (
            <>
              {/* Sender Signature */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name des Absenders *
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="z.B. Max Mustermann"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unterschrift Absender *
                </label>
                <div className="border-2 border-gray-300 rounded-lg">
                  <SignatureCanvas
                    ref={senderSigRef}
                    canvasProps={{
                      className: 'w-full h-40 bg-gray-50'
                    }}
                  />
                </div>
                <button
                  onClick={() => senderSigRef.current?.clear()}
                  className="mt-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Löschen
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unterschrift Frachtführer *
                </label>
                <div className="border-2 border-gray-300 rounded-lg">
                  <SignatureCanvas
                    ref={carrierSigRef}
                    canvasProps={{
                      className: 'w-full h-40 bg-gray-50'
                    }}
                  />
                </div>
                <button
                  onClick={() => carrierSigRef.current?.clear()}
                  className="mt-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Löschen
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Delivery Mode */}
              {currentCMR && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Zustelladresse:</h4>
                  <p className="text-sm text-blue-800">
                    {currentCMR.consignee_name}<br />
                    {currentCMR.consignee_address}<br />
                    {currentCMR.consignee_postal_code} {currentCMR.consignee_city}
                  </p>
                </div>
              )}

              {/* Receiver Not Home Option */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="notHome"
                  checked={receiverNotHome}
                  onChange={(e) => setReceiverNotHome(e.target.checked)}
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                />
                <label htmlFor="notHome" className="text-sm font-medium text-gray-700">
                  Empfänger nicht angetroffen (Ablage vor Haustür)
                </label>
              </div>

              {!receiverNotHome ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name des Empfängers *
                    </label>
                    <input
                      type="text"
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="z.B. Anna Schmidt"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unterschrift Empfänger *
                    </label>
                    <div className="border-2 border-gray-300 rounded-lg">
                      <SignatureCanvas
                        ref={receiverSigRef}
                        canvasProps={{
                          className: 'w-full h-40 bg-gray-50'
                        }}
                      />
                    </div>
                    <button
                      onClick={() => receiverSigRef.current?.clear()}
                      className="mt-2 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Löschen
                    </button>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Foto der Zustellung * (Paket vor Haustür/Briefkasten)
                  </label>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoCapture}
                    className="hidden"
                  />
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 flex items-center justify-center space-x-2"
                  >
                    <Camera className="h-5 w-5" />
                    <span>{deliveryPhoto ? 'Foto ändern' : 'Foto aufnehmen'}</span>
                  </button>
                  {deliveryPhoto && (
                    <div className="mt-2">
                      <img src={deliveryPhoto} alt="Delivery" className="w-full rounded-lg" />
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Waiting Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wartezeit (Minuten) - Erste 30 Min. kostenlos
            </label>
            <input
              type="number"
              min="0"
              value={waitingMinutes}
              onChange={(e) => setWaitingMinutes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            {waitingMinutes > 30 && (
              <p className="mt-1 text-sm text-orange-600">
                Zusätzliche Kosten: €{((waitingMinutes - 30) / 5 * 3).toFixed(2)}
              </p>
            )}
          </div>

          {waitingMinutes > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notizen zur Wartezeit
              </label>
              <textarea
                value={waitingNotes}
                onChange={(e) => setWaitingNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows="2"
                placeholder="z.B. Kunde war nicht erreichbar..."
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={submitting}
          >
            Abbrechen
          </button>
          <button
            onClick={mode === 'pickup' ? handlePickupSubmit : handleDeliverySubmit}
            disabled={submitting}
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Speichern...</span>
              </>
            ) : (
              <>
                {isMultiStop && mode === 'delivery' && currentStop < totalStops ? (
                  <>
                    <span>Weiter zur nächsten Zustellung</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Bestätigen</span>
                  </>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CMRSignatureMultiStop;
