import React, { useState, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X } from 'lucide-react';

const CMRSignature = ({ order, mode, onClose, onComplete }) => {
  const [senderName, setSenderName] = useState('');
  const [senderSignature, setSenderSignature] = useState(null);
  const [carrierSignature, setCarrierSignature] = useState(null);
  const [receiverName, setReceiverName] = useState('');
  const [receiverSignature, setReceiverSignature] = useState(null);
  const [deliveryPhoto, setDeliveryPhoto] = useState(null);
  const [waitingMinutes, setWaitingMinutes] = useState(0);
  const [waitingNotes, setWaitingNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const senderSigRef = useRef(null);
  const carrierSigRef = useRef(null);
  const receiverSigRef = useRef(null);

  // Calculate waiting time fee
  const calculateWaitingFee = (minutes) => {
    if (minutes <= 30) return 0;
    const chargeableMinutes = minutes - 30;
    const blocks = Math.ceil(chargeableMinutes / 5);
    return blocks * 3;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const data = {};

      if (mode === 'pickup') {
        // Validate sender name and signatures
        if (!senderName || !senderName.trim()) {
          alert('Bitte geben Sie den Namen des Absenders ein.');
          setLoading(false);
          return;
        }
        if (senderSigRef.current?.isEmpty()) {
          alert('Bitte unterschreiben Sie als Absender.');
          setLoading(false);
          return;
        }
        if (carrierSigRef.current?.isEmpty()) {
          alert('Bitte unterschreiben Sie als Frachtführer.');
          setLoading(false);
          return;
        }
        
        data.senderName = senderName;
        data.senderSignature = senderSigRef.current.toDataURL();
        data.carrierSignature = carrierSigRef.current.toDataURL();
        data.pickupWaitingMinutes = parseInt(waitingMinutes) || 0;
        if (waitingNotes.trim()) {
          data.waitingNotes = waitingNotes.trim();
        }
      } else if (mode === 'delivery') {
        // Validate receiver name and signature
        if (!receiverName || !receiverName.trim()) {
          alert('Bitte geben Sie den Namen des Empfängers ein.');
          setLoading(false);
          return;
        }
        if (receiverSigRef.current?.isEmpty()) {
          alert('Bitte lassen Sie den Empfänger unterschreiben.');
          setLoading(false);
          return;
        }
        
        data.receiverName = receiverName;
        data.receiverSignature = receiverSigRef.current.toDataURL();
        if (deliveryPhoto) {
          data.deliveryPhoto = deliveryPhoto;
        }
        data.deliveryWaitingMinutes = parseInt(waitingMinutes) || 0;
        if (waitingNotes.trim()) {
          data.waitingNotes = waitingNotes.trim();
        }
      }

      await onComplete(data);
    } catch (error) {
      console.error('Error submitting signatures:', error);
      alert('Fehler beim Speichern der Unterschriften: ' + (error.message || 'Unbekannter Fehler'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            {mode === 'pickup' ? 'Paket abholen - Unterschriften' : 'Paket zustellen - Empfänger-Unterschrift'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Auftrag #{order.id}</strong><br />
              {order.pickup_city} → {order.delivery_city}
            </p>
          </div>

          {mode === 'pickup' && (
            <>
              {/* Sender Section */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Absender</h4>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name des Absenders *
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Vollständiger Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unterschrift Absender *
                  </label>
                  <div className="border-2 border-gray-300 rounded-lg">
                    <SignatureCanvas
                      ref={senderSigRef}
                      canvasProps={{
                        className: 'w-full h-40 cursor-crosshair',
                      }}
                    />
                  </div>
                  <button
                    onClick={() => senderSigRef.current?.clear()}
                    className="mt-2 text-sm text-red-600 hover:text-red-700"
                  >
                    Unterschrift löschen
                  </button>
                </div>
              </div>

              {/* Carrier Section */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Frachtführer</h4>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name des Frachtführers
                  </label>
                  <input
                    type="text"
                    value={order.contractor_name || 'Wird automatisch ausgefüllt'}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unterschrift Frachtführer *
                  </label>
                  <div className="border-2 border-gray-300 rounded-lg">
                    <SignatureCanvas
                      ref={carrierSigRef}
                      canvasProps={{
                        className: 'w-full h-40 cursor-crosshair',
                      }}
                    />
                  </div>
                  <button
                    onClick={() => carrierSigRef.current?.clear()}
                    className="mt-2 text-sm text-red-600 hover:text-red-700"
                  >
                    Unterschrift löschen
                  </button>
                </div>
              </div>
              
              {/* Waiting Time for Pickup */}
              <div className="border rounded-lg p-4 mt-4 bg-yellow-50">
                <h4 className="font-medium text-gray-900 mb-3">⏱️ Wartezeit (optional)</h4>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wartezeit in Minuten
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={waitingMinutes}
                    onChange={(e) => setWaitingMinutes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="0"
                  />
                  <p className="mt-1 text-xs text-gray-600">
                    Erste 30 Min. inklusive, danach je 5 Min. = €3
                  </p>
                  {waitingMinutes > 30 && (
                    <p className="mt-1 text-sm font-semibold text-green-600">
                      Vergütung: €{calculateWaitingFee(waitingMinutes)} (nach Admin-Freigabe)
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grund der Wartezeit
                  </label>
                  <textarea
                    value={waitingNotes}
                    onChange={(e) => setWaitingNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="z.B. Absender nicht vor Ort, Laderampe besetzt..."
                  />
                </div>
              </div>
            </>
          )}

          {mode === 'delivery' && (
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Empfänger</h4>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name des Empfängers *
                </label>
                <input
                  type="text"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Vollständiger Name (oder 'Briefkasten' bei Einwurf)"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unterschrift Empfänger *
                </label>
                <div className="border-2 border-gray-300 rounded-lg">
                  <SignatureCanvas
                    ref={receiverSigRef}
                    canvasProps={{
                      className: 'w-full h-40 cursor-crosshair',
                    }}
                  />
                </div>
                <button
                  onClick={() => receiverSigRef.current?.clear()}
                  className="mt-2 text-sm text-red-600 hover:text-red-700"
                >
                  Unterschrift löschen
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zustellfoto (optional)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Bei Briefkasteneinwurf: Foto vom Briefkasten mit Paket
                </p>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      // Check file size (max 5MB)
                      if (file.size > 5 * 1024 * 1024) {
                        alert('Foto ist zu groß! Maximale Größe: 5 MB');
                        e.target.value = '';
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setDeliveryPhoto(reader.result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                {deliveryPhoto && (
                  <div className="mt-2">
                    <img src={deliveryPhoto} alt="Zustellfoto" className="max-w-full h-40 rounded-lg" />
                    <button
                      onClick={() => setDeliveryPhoto(null)}
                      className="mt-1 text-sm text-red-600 hover:text-red-700"
                    >
                      Foto entfernen
                    </button>
                  </div>
                )}
              </div>
              
              {/* Waiting Time for Delivery */}
              <div className="border rounded-lg p-4 mt-4 bg-yellow-50">
                <h4 className="font-medium text-gray-900 mb-3">⏱️ Wartezeit (optional)</h4>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wartezeit in Minuten
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={waitingMinutes}
                    onChange={(e) => setWaitingMinutes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="0"
                  />
                  <p className="mt-1 text-xs text-gray-600">
                    Erste 30 Min. inklusive, danach je 5 Min. = €3
                  </p>
                  {waitingMinutes > 30 && (
                    <p className="mt-1 text-sm font-semibold text-green-600">
                      Vergütung: €{calculateWaitingFee(waitingMinutes)} (nach Admin-Freigabe)
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grund der Wartezeit
                  </label>
                  <textarea
                    value={waitingNotes}
                    onChange={(e) => setWaitingNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="z.B. Empfänger nicht vor Ort, Entladung verzögert..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            disabled={loading}
          >
            {loading ? 'Wird gespeichert...' : mode === 'pickup' ? 'Abholung bestätigen' : 'Zustellung bestätigen'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CMRSignature;
