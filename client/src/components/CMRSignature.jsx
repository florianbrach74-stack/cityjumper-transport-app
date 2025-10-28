import React, { useState, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X } from 'lucide-react';

const CMRSignature = ({ order, mode, onClose, onComplete }) => {
  const [senderName, setSenderName] = useState('');
  const [senderSignature, setSenderSignature] = useState(null);
  const [carrierSignature, setCarrierSignature] = useState(null);
  const [receiverName, setReceiverName] = useState('');
  const [receiverSignature, setReceiverSignature] = useState(null);
  const [loading, setLoading] = useState(false);

  const senderSigRef = useRef(null);
  const carrierSigRef = useRef(null);
  const receiverSigRef = useRef(null);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const data = {};

      if (mode === 'pickup') {
        if (!senderName || !senderSigRef.current?.isEmpty() === false || !carrierSigRef.current?.isEmpty() === false) {
          alert('Bitte füllen Sie alle Felder aus und unterschreiben Sie.');
          setLoading(false);
          return;
        }
        data.senderName = senderName;
        data.senderSignature = senderSigRef.current.toDataURL();
        data.carrierSignature = carrierSigRef.current.toDataURL();
      } else if (mode === 'delivery') {
        if (!receiverName || !receiverSigRef.current?.isEmpty() === false) {
          alert('Bitte füllen Sie alle Felder aus und unterschreiben Sie.');
          setLoading(false);
          return;
        }
        data.receiverName = receiverName;
        data.receiverSignature = receiverSigRef.current.toDataURL();
      }

      await onComplete(data);
    } catch (error) {
      console.error('Error submitting signatures:', error);
      alert('Fehler beim Speichern der Unterschriften');
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
                  placeholder="Vollständiger Name"
                />
              </div>
              <div>
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
