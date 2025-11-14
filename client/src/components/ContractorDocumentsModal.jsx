import { useState, useEffect } from 'react';
import { X, Download, FileText, Calendar } from 'lucide-react';
import { verificationAPI } from '../services/api';

export default function ContractorDocumentsModal({ contractor, onClose }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, [contractor.id]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await verificationAPI.getContractorDocuments(contractor.id);
      console.log('📄 Loaded documents:', response.data.documents);
      setDocuments(response.data.documents || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      alert('Fehler beim Laden der Dokumente');
    } finally {
      setLoading(false);
    }
  };

  const getDocumentTypeLabel = (type) => {
    const labels = {
      insurance: 'Versicherung',
      business_license: 'Gewerbeschein',
      minimum_wage_signature: 'Mindestlohn-Unterschrift'
    };
    return labels[type] || type;
  };

  const downloadDocument = async (documentId, fileName) => {
    try {
      const token = localStorage.getItem('token');
      const url = verificationAPI.downloadDocument(documentId);
      
      // Fetch with authorization header
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Download fehlgeschlagen');
      }
      
      // Get the blob
      const blob = await response.blob();
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download error:', error);
      alert('Fehler beim Herunterladen des Dokuments');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-bold">Verifizierungsdokumente</h2>
            <p className="text-sm text-gray-600 mt-1">
              {contractor.company_name || `${contractor.first_name} ${contractor.last_name}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Lade Dokumente...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Keine Dokumente gefunden</p>
              <p className="text-sm text-gray-500 mt-2">
                Der Auftragnehmer hat noch keine Dokumente hochgeladen.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold">
                          {getDocumentTypeLabel(doc.document_type)}
                        </h3>
                        {doc.is_current && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                            Aktuell
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <p className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          Hochgeladen: {new Date(doc.uploaded_at).toLocaleDateString('de-DE', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="text-xs text-gray-500">
                          Datei: {doc.file_name}
                        </p>
                        {doc.file_size && (
                          <p className="text-xs text-gray-500">
                            Größe: {(doc.file_size / 1024).toFixed(2)} KB
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => downloadDocument(doc.id, doc.file_name)}
                      className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
