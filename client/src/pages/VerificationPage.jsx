import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';
import { verificationAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { Upload, FileText, CheckCircle, AlertCircle, PenTool, Trash2 } from 'lucide-react';

const VerificationPage = () => {
  const navigate = useNavigate();
  const sigPad = useRef(null);
  
  const [insuranceFile, setInsuranceFile] = useState(null);
  const [businessLicenseFile, setBusinessLicenseFile] = useState(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [signatureEmpty, setSignatureEmpty] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      if (type === 'insurance') {
        setInsuranceFile(file);
      } else {
        setBusinessLicenseFile(file);
      }
    } else {
      alert('Bitte laden Sie nur PDF-Dateien hoch');
    }
  };

  const clearSignature = () => {
    sigPad.current.clear();
    setSignatureEmpty(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!insuranceFile || !businessLicenseFile) {
      setError('Bitte laden Sie alle erforderlichen Dokumente hoch');
      return;
    }

    if (!agreedToTerms) {
      setError('Bitte bestätigen Sie die Mindestlohn-Erklärung');
      return;
    }

    if (sigPad.current.isEmpty()) {
      setError('Bitte unterschreiben Sie die Erklärung');
      return;
    }

    setSubmitting(true);
    try {
      // Convert files to base64
      const insuranceBase64 = await fileToBase64(insuranceFile);
      const businessLicenseBase64 = await fileToBase64(businessLicenseFile);
      const signatureData = sigPad.current.toDataURL();

      await verificationAPI.submitVerification({
        insuranceDocumentUrl: insuranceBase64,
        businessLicenseUrl: businessLicenseBase64,
        minimumWageSignature: signatureData,
      });

      alert('Verifizierung eingereicht! Sie werden benachrichtigt sobald Ihr Account freigegeben wurde.');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Fehler beim Einreichen der Verifizierung');
    } finally {
      setSubmitting(false);
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Account-Verifizierung</h1>
            <p className="text-gray-600">
              Bitte laden Sie die erforderlichen Dokumente hoch und unterschreiben Sie die Mindestlohn-Erklärung.
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Insurance Document */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="inline h-4 w-4 mr-1" />
                Transportversicherung *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileChange(e, 'insurance')}
                  className="hidden"
                  id="insurance-upload"
                />
                <label htmlFor="insurance-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  {insuranceFile ? (
                    <p className="text-green-600 font-medium">{insuranceFile.name}</p>
                  ) : (
                    <>
                      <p className="text-gray-600">Klicken Sie hier um eine PDF hochzuladen</p>
                      <p className="text-xs text-gray-500 mt-1">Nur PDF-Dateien</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Business License */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="inline h-4 w-4 mr-1" />
                Gewerbeanmeldung *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileChange(e, 'license')}
                  className="hidden"
                  id="license-upload"
                />
                <label htmlFor="license-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  {businessLicenseFile ? (
                    <p className="text-green-600 font-medium">{businessLicenseFile.name}</p>
                  ) : (
                    <>
                      <p className="text-gray-600">Klicken Sie hier um eine PDF hochzuladen</p>
                      <p className="text-xs text-gray-500 mt-1">Nur PDF-Dateien</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Minimum Wage Declaration */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3">Mindestlohngesetz-Erklärung</h3>
              <div className="text-sm text-blue-800 space-y-2 mb-4">
                <p>Hiermit erkläre ich, dass ich:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Das Mindestlohngesetz (MiLoG) einhalte</li>
                  <li>Alle Mitarbeiter mindestens den gesetzlichen Mindestlohn zahle</li>
                  <li>Die Arbeitszeitnachweise ordnungsgemäß führe</li>
                  <li>Bei Verstößen mit Sanktionen rechne</li>
                </ul>
              </div>

              <label className="flex items-start space-x-3 mb-4">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm text-gray-700">
                  Ich bestätige, dass ich die Mindestlohngesetz-Erklärung gelesen habe und einhalte
                </span>
              </label>

              {/* Signature Pad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <PenTool className="inline h-4 w-4 mr-1" />
                  Unterschrift *
                </label>
                <div className="border-2 border-gray-300 rounded-lg bg-white">
                  <SignatureCanvas
                    ref={sigPad}
                    canvasProps={{
                      className: 'w-full h-32',
                    }}
                    onEnd={() => setSignatureEmpty(false)}
                  />
                </div>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="mt-2 flex items-center text-sm text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Unterschrift löschen
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Wird eingereicht...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Verifizierung einreichen
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerificationPage;
