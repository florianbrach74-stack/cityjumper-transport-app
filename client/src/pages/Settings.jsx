import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { User, Mail, Lock, MapPin, Building, Phone, Save, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

const Settings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Profile form
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    is_business: false,
    company_name: '',
    company_address: '',
    company_city: '',
    company_postal_code: '',
    company_country: 'Deutschland',
    tax_id: '',
    vat_id: '',
    address: '',
    city: '',
    postal_code: '',
  });

  // Password form
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  // Verification documents (for contractors)
  const [verificationData, setVerificationData] = useState({
    insurance_document: null,
    business_license: null,
    minimum_wage_signature: null,
  });

  const [verificationStatus, setVerificationStatus] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    setProfileData({
      first_name: userData.first_name || '',
      last_name: userData.last_name || '',
      email: userData.email || '',
      phone: userData.phone || '',
      is_business: !!userData.company_name,
      company_name: userData.company_name || '',
      company_address: userData.company_address || '',
      company_city: userData.company_city || '',
      company_postal_code: userData.company_postal_code || '',
      company_country: userData.company_country || 'Deutschland',
      tax_id: userData.tax_id || '',
      vat_id: userData.vat_id || '',
      address: userData.address || '',
      city: userData.city || '',
      postal_code: userData.postal_code || '',
    });

    // Load verification status for contractors
    if (userData.role === 'contractor') {
      fetchVerificationStatus();
    }
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/verification/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setVerificationStatus(data.verification);
    } catch (error) {
      console.error('Error fetching verification status:', error);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) throw new Error('Update failed');

      const data = await response.json();
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      setMessage({ type: 'success', text: 'Profil erfolgreich aktualisiert!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Fehler beim Aktualisieren des Profils' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage({ type: 'error', text: 'Passwörter stimmen nicht überein' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password,
        }),
      });

      if (!response.ok) throw new Error('Password update failed');

      setMessage({ type: 'success', text: 'Passwort erfolgreich geändert!' });
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Fehler beim Ändern des Passworts' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        setMessage({ 
          type: 'error', 
          text: `Die Datei ist zu groß! Maximale Größe: 5 MB. Ihre Datei: ${(file.size / 1024 / 1024).toFixed(2)} MB` 
        });
        e.target.value = ''; // Reset file input
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setVerificationData(prev => ({
          ...prev,
          [field]: reader.result,
        }));
        setMessage({ type: '', text: '' }); // Clear any previous error
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      
      // Map frontend field names to backend field names
      const payload = {
        insuranceDocumentUrl: verificationData.insurance_document,
        businessLicenseUrl: verificationData.business_license,
        minimumWageSignature: verificationData.minimum_wage_signature,
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/verification/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Verification submission failed');
      }

      setMessage({ type: 'success', text: 'Verifizierung erfolgreich eingereicht!' });
      fetchVerificationStatus();
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Fehler beim Einreichen der Verifizierung' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Einstellungen</h1>

        {/* Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Profile Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <User className="h-5 w-5 mr-2" />
            Profil
          </h2>
          
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vorname
                </label>
                <input
                  type="text"
                  value={profileData.first_name}
                  onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nachname
                </label>
                <input
                  type="text"
                  value={profileData.last_name}
                  onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="h-4 w-4 inline mr-1" />
                Email
              </label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="h-4 w-4 inline mr-1" />
                Telefon
              </label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Business/Private Toggle - For all users */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {user?.role === 'contractor' ? 'Unternehmenstyp' : 'Kundentyp'}
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setProfileData({ ...profileData, is_business: false })}
                  className={`flex-1 p-3 border-2 rounded-lg transition-all ${
                    !profileData.is_business
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <User className="h-5 w-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">Privatkunde</div>
                </button>
                <button
                  type="button"
                  onClick={() => setProfileData({ ...profileData, is_business: true })}
                  className={`flex-1 p-3 border-2 rounded-lg transition-all ${
                    profileData.is_business
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Building className="h-5 w-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">Firmenkunde</div>
                </button>
              </div>
            </div>

            {/* Company Details - Only show if business */}
            {profileData.is_business && (
              <div className="border-t pt-4 space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Firmendaten (für Rechnungsstellung)
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Firmenname *
                  </label>
                  <input
                    type="text"
                    value={profileData.company_name}
                    onChange={(e) => setProfileData({ ...profileData, company_name: e.target.value })}
                    placeholder="z.B. Amazon GmbH"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Firmenadresse
                  </label>
                  <input
                    type="text"
                    value={profileData.company_address}
                    onChange={(e) => setProfileData({ ...profileData, company_address: e.target.value })}
                    placeholder="Straße und Hausnummer"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PLZ
                    </label>
                    <input
                      type="text"
                      value={profileData.company_postal_code}
                      onChange={(e) => setProfileData({ ...profileData, company_postal_code: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stadt
                    </label>
                    <input
                      type="text"
                      value={profileData.company_city}
                      onChange={(e) => setProfileData({ ...profileData, company_city: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Steuernummer (optional)
                    </label>
                    <input
                      type="text"
                      value={profileData.tax_id}
                      onChange={(e) => setProfileData({ ...profileData, tax_id: e.target.value })}
                      placeholder="123/456/789"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      USt-IdNr. (optional)
                    </label>
                    <input
                      type="text"
                      value={profileData.vat_id}
                      onChange={(e) => setProfileData({ ...profileData, vat_id: e.target.value })}
                      placeholder="DE123456789"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    💡 Diese Daten werden für die Rechnungsstellung verwendet und beim Erstellen von Aufträgen automatisch vorausgefüllt.
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin className="h-4 w-4 inline mr-1" />
                Adresse
              </label>
              <input
                type="text"
                value={profileData.address}
                onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stadt
                </label>
                <input
                  type="text"
                  value={profileData.city}
                  onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PLZ
                </label>
                <input
                  type="text"
                  value={profileData.postal_code}
                  onChange={(e) => setProfileData({ ...profileData, postal_code: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              Profil speichern
            </button>
          </form>
        </div>

        {/* Password Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Lock className="h-5 w-5 mr-2" />
            Passwort ändern
          </h2>
          
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aktuelles Passwort
              </label>
              <input
                type="password"
                value={passwordData.current_password}
                onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Neues Passwort
              </label>
              <input
                type="password"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Passwort bestätigen
              </label>
              <input
                type="password"
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              Passwort ändern
            </button>
          </form>
        </div>

        {/* Verification (Contractors only) */}
        {user?.role === 'contractor' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Verifizierung
            </h2>

            {verificationStatus && (
              <div className={`mb-4 p-4 rounded-lg ${
                verificationStatus.status === 'approved' ? 'bg-green-50' :
                verificationStatus.status === 'rejected' ? 'bg-red-50' :
                'bg-yellow-50'
              }`}>
                <div className="flex items-center">
                  {verificationStatus.status === 'approved' ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                  )}
                  <span className="font-medium">
                    Status: {
                      verificationStatus.status === 'approved' ? 'Verifiziert' :
                      verificationStatus.status === 'rejected' ? 'Abgelehnt' :
                      'Ausstehend'
                    }
                  </span>
                </div>
                {verificationStatus.notes && (
                  <p className="text-sm mt-2">{verificationStatus.notes}</p>
                )}
              </div>
            )}

            {(!verificationStatus || verificationStatus.status === 'pending' || verificationStatus.status === 'rejected') && (
              <form onSubmit={handleVerificationSubmit} className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Hinweis:</strong> Maximale Dateigröße pro Dokument: 5 MB
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transportversicherung (PDF)
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileChange(e, 'insurance_document')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Max. 5 MB</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gewerbeanmeldung (PDF)
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileChange(e, 'business_license')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Max. 5 MB</p>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-2">Mindestlohn-Erklärung</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Ich erkläre hiermit, dass ich das Mindestlohngesetz einhalte und meinen Mitarbeitern mindestens den gesetzlichen Mindestlohn zahle.
                  </p>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      required
                      checked={!!verificationData.minimum_wage_signature}
                      onChange={(e) => {
                        if (e.target.checked) {
                          // Generate a simple signature timestamp
                          const signature = `Bestätigt am ${new Date().toLocaleString('de-DE')}`;
                          setVerificationData(prev => ({
                            ...prev,
                            minimum_wage_signature: signature
                          }));
                        } else {
                          setVerificationData(prev => ({
                            ...prev,
                            minimum_wage_signature: null
                          }));
                        }
                      }}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Ich bestätige die Mindestlohn-Erklärung
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Verifizierung einreichen
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
