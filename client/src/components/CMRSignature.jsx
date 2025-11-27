import React, { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X, Camera, CheckCircle, ArrowRight, Package } from 'lucide-react';

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
      console.log('🔍 [CMR] Loading CMR group for order:', order.id);
      const token = localStorage.getItem('token');
      const response = await fetch(`https://cityjumper-api-production-01e4.up.railway.app/api/cmr/order/${order.id}/group`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('🔍 [CMR] Response status:', response.status);
      const data = await response.json();
      console.log('🔍 [CMR] Response data:', JSON.stringify(data, null, 2));
      
      if (data.isMultiStop && data.cmrs.length > 1) {
        setIsMultiStop(true);
        setCmrGroup(data);
        console.log('✅ [CMR] Multi-stop order detected:', data.cmrs.length, 'deliveries');
        
        // Log each CMR status
        data.cmrs.forEach((cmr, idx) => {
          console.log(`   CMR ${idx + 1}:`, {
            id: cmr.id,
            stop: `${cmr.delivery_stop_index + 1}/${cmr.total_stops}`,
            completed: !!(cmr.consignee_signature || cmr.delivery_photo_base64 || cmr.consignee_photo),
            hasSignature: !!cmr.consignee_signature,
            hasPhoto: !!(cmr.delivery_photo_base64 || cmr.consignee_photo)
          });
        });
        
        // Find first uncompleted stop
        const firstUncompletedIndex = data.cmrs.findIndex(cmr => 
          !cmr.consignee_signature && !cmr.delivery_photo_base64 && !cmr.consignee_photo
        );
        console.log('🔍 [CMR] First uncompleted stop index:', firstUncompletedIndex);
        if (firstUncompletedIndex !== -1) {
          setCurrentStopIndex(firstUncompletedIndex);
          console.log('✅ [CMR] Set current stop to:', firstUncompletedIndex + 1);
        }
      } else {
        console.log('ℹ️ [CMR] Single-stop order or no multi-stop data');
      }
    } catch (error) {
      console.error('❌ [CMR] Error loading CMR group:', error);
      console.error('❌ [CMR] Error stack:', error.stack);
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
        const token = localStorage.getItem('token');
        await fetch(`https://cityjumper-api-production-01e4.up.railway.app/api/cmr/order/${order.id}/shared-signatures`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            senderSignature: data.senderSignature,
            carrierSignature: data.carrierSignature
          })
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
    console.log('🚀 [DELIVERY] Starting delivery submission...');
    
    try {
      const currentCMR = getCurrentCMR();
      console.log('🔍 [DELIVERY] Current CMR:', currentCMR ? {
        id: currentCMR.id,
        stop: `${currentCMR.delivery_stop_index + 1}/${currentCMR.total_stops}`,
        consignee: currentCMR.consignee_name
      } : 'null');

      // Validate
      if (!receiverNotHome) {
        if (!receiverName || !receiverName.trim()) {
          console.warn('⚠️ [DELIVERY] Validation failed: No receiver name');
          alert('Bitte geben Sie den Namen des Empfängers ein.');
          setSubmitting(false);
          return;
        }
        if (receiverSigRef.current?.isEmpty()) {
          console.warn('⚠️ [DELIVERY] Validation failed: No signature');
          alert('Bitte lassen Sie den Empfänger unterschreiben.');
          setSubmitting(false);
          return;
        }
      } else {
        if (!deliveryPhoto) {
          console.warn('⚠️ [DELIVERY] Validation failed: No photo');
          alert('Bitte machen Sie ein Foto der Zustellung.');
          setSubmitting(false);
          return;
        }
      }

      console.log('✅ [DELIVERY] Validation passed');

      // Prepare data
      const data = {
        receiverName: receiverNotHome ? 'Nicht angetroffen' : receiverName,
        receiverSignature: receiverNotHome ? null : receiverSigRef.current.toDataURL(),
        deliveryPhoto: deliveryPhoto || undefined,
        deliveryWaitingMinutes: parseInt(waitingMinutes) || 0,
        waitingNotes: waitingNotes.trim() || undefined,
        cmrId: currentCMR?.id // WICHTIG: CMR ID mitschicken für Multi-Stop
      };

      console.log('📦 [DELIVERY] Submitting delivery:', {
        cmrId: data.cmrId,
        receiverName: data.receiverName,
        hasSignature: !!data.receiverSignature,
        hasPhoto: !!data.deliveryPhoto,
        isMultiStop: isMultiStop
      });
      
      // Call onComplete which handles the API call
      console.log('🔄 [DELIVERY] Calling onComplete...');
      await onComplete(data);
      console.log('✅ [DELIVERY] onComplete finished successfully');
      
      // If multi-stop, reload and check status
      if (isMultiStop) {
        console.log('🔄 [DELIVERY] Reloading CMR group...');
        await loadCMRGroup();
        
        // Check if all stops are completed NOW (after reload)
        const allCompleted = cmrGroup.cmrs.every(cmr => 
          cmr.consignee_signature || cmr.delivery_photo_base64 || cmr.consignee_photo
        );

        console.log(`✅ [DELIVERY] Stop ${currentStopIndex + 1}/${cmrGroup.cmrs.length} completed`);
        console.log(`📊 [DELIVERY] All stops completed: ${allCompleted}`);

        if (!allCompleted) {
          // More stops remaining
          console.log('ℹ️ [DELIVERY] More stops remaining - closing modal');
          alert(`Stop ${currentStopIndex + 1}/${cmrGroup.cmrs.length} erfolgreich abgeschlossen!\n\nWeitere Stops ausstehend.\nSie können jetzt:\n- Den nächsten Stop abschließen\n- Zurück zum Dashboard gehen\n- Andere Aufträge bearbeiten`);
          
          // Reset form for next delivery
          setReceiverName('');
          setReceiverNotHome(false);
          setDeliveryPhoto(null);
          setWaitingMinutes(0);
          setWaitingNotes('');
          if (receiverSigRef.current) receiverSigRef.current.clear();
          
          // Close modal
          onClose();
        } else {
          // All stops done - onComplete already handled the completion
          console.log('🎉 [DELIVERY] All stops completed - order finished!');
        }
      } else {
        console.log('ℹ️ [DELIVERY] Single-stop order completed');
      }
    } catch (error) {
      console.error('❌ [DELIVERY] Error submitting delivery:', error);
      console.error('❌ [DELIVERY] Error message:', error.message);
      console.error('❌ [DELIVERY] Error stack:', error.stack);
      alert('Fehler beim Speichern: ' + (error.message || 'Unbekannter Fehler'));
    } finally {
      console.log('🏁 [DELIVERY] Submission finished, setting submitting=false');
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
                  {/* Stop Selection */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Welchen Stop möchten Sie jetzt abschließen?
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {cmrGroup?.cmrs
                        .filter(cmr => !cmr.consignee_signature && !cmr.delivery_photo_base64) // Nur offene Stops
                        .map((cmr, filteredIndex) => {
                          const originalIndex = cmrGroup.cmrs.indexOf(cmr);
                          const isCurrent = originalIndex === currentStopIndex;
                          
                          return (
                            <button
                              key={cmr.id}
                              onClick={() => setCurrentStopIndex(originalIndex)}
                              className={`p-3 rounded-lg border-2 text-left transition-all ${
                                isCurrent 
                                  ? 'border-primary-600 bg-primary-50' 
                                  : 'border-gray-300 hover:border-primary-400'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <span className={`text-sm font-medium ${
                                      isCurrent ? 'text-primary-700' : 'text-gray-700'
                                    }`}>
                                      Stop {originalIndex + 1}/{totalStops}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {cmr.consignee_name || 'Empfänger'}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {cmr.consignee_address}, {cmr.consignee_postal_code} {cmr.consignee_city}
                                  </p>
                                </div>
                                {isCurrent && (
                                  <ArrowRight className="h-5 w-5 text-primary-600" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      
                      {/* Show completed stops separately */}
                      {cmrGroup?.cmrs
                        .filter(cmr => cmr.consignee_signature || cmr.delivery_photo_base64)
                        .map((cmr, index) => {
                          const originalIndex = cmrGroup.cmrs.indexOf(cmr);
                          return (
                            <div
                              key={cmr.id}
                              className="p-3 rounded-lg border-2 border-green-300 bg-green-50 opacity-60"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-green-700">
                                      Stop {originalIndex + 1}/{totalStops}
                                    </span>
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {cmr.consignee_name || 'Empfänger'}
                                  </p>
                                  <p className="text-xs text-green-600 font-medium">
                                    ✓ Abgeschlossen
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                  
                  {/* Current Stop Info */}
                  <div className="flex items-center space-x-2 mb-2">
                    <Package className="h-4 w-4 text-primary-600" />
                    <span className="text-sm font-medium text-primary-600">
                      Aktuell: Zustellung {currentStop} von {totalStops}
                    </span>
                  </div>
                  {currentCMR && (
                    <p className="text-sm text-gray-600 mb-2">
                      {currentCMR.consignee_name} • {currentCMR.consignee_city}
                    </p>
                  )}
                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
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
