import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X, Trash2, Check } from 'lucide-react';

const SignatureModal = ({ title, onClose, onSubmit, signerName: initialSignerName, isCarrier = false }) => {
  const sigPad = useRef(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [location, setLocation] = useState('');
  const [remarks, setRemarks] = useState('');
  const [signerName, setSignerName] = useState(initialSignerName || '');

  useEffect(() => {
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(`${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`);
        },
        (error) => {
          console.log('Geolocation error:', error);
          setLocation('Standort manuell eingeben');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setLocation('GPS nicht verfügbar - Bitte manuell eingeben');
    }
  }, []);

  const clear = () => {
    sigPad.current.clear();
    setIsEmpty(true);
  };

  const handleSubmit = () => {
    if (sigPad.current.isEmpty()) {
      alert('Bitte unterschreiben Sie zuerst');
      return;
    }

    if (!location.trim()) {
      alert('Bitte geben Sie einen Standort ein');
      return;
    }

    if (!signerName.trim()) {
      alert('Bitte geben Sie einen Namen ein');
      return;
    }

    const signatureData = sigPad.current.toDataURL();
    onSubmit({
      signatureData,
      location: location.trim(),
      remarks: remarks.trim() || null,
      consigneeName: signerName.trim(),
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="border-b px-6 py-4 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              {signerName && (
                <p className="text-sm text-gray-600">Unterzeichner: {signerName}</p>
              )}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                disabled={isCarrier}
                placeholder="Name der unterzeichnenden Person"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              {isCarrier && (
                <p className="text-xs text-gray-500 mt-1">
                  Name wird automatisch aus Ihrem Account übernommen
                </p>
              )}
            </div>

            {/* Signature Pad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unterschrift *
              </label>
              <div className="border-2 border-gray-300 rounded-lg bg-white">
                <SignatureCanvas
                  ref={sigPad}
                  canvasProps={{
                    className: 'w-full h-48 touch-none',
                  }}
                  onEnd={() => setIsEmpty(false)}
                />
              </div>
              <button
                onClick={clear}
                className="mt-2 flex items-center text-sm text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Unterschrift löschen
              </button>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Standort *
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Standort wird automatisch ermittelt..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bemerkungen (optional)
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
                placeholder="Optionale Bemerkungen..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="border-t px-6 py-4 flex justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
            >
              <Check className="h-4 w-4 mr-2" />
              Unterschrift bestätigen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignatureModal;
