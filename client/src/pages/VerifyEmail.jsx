import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, CheckCircle, AlertCircle, Home } from 'lucide-react';
import api from '../services/api';

const VerifyEmail = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Email aus location.state ODER localStorage
  const emailFromState = location.state?.email;
  const emailFromStorage = localStorage.getItem('pendingVerificationEmail');
  const email = emailFromState || emailFromStorage;
  
  // Speichere Email im localStorage wenn vorhanden
  useEffect(() => {
    if (emailFromState) {
      localStorage.setItem('pendingVerificationEmail', emailFromState);
    }
  }, [emailFromState]);

  // No automatic redirect - show error message instead if no email

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/verify-email', { email, code });
      setSuccess(true);
      
      // Lösche pendingVerificationEmail aus localStorage
      localStorage.removeItem('pendingVerificationEmail');
      
      // Nach 3 Sekunden zum Login weiterleiten (mehr Zeit zum Lesen)
      setTimeout(() => {
        navigate('/login', { 
          state: { message: 'Email erfolgreich verifiziert! Sie können sich jetzt anmelden.' },
          replace: true
        });
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Verifizierung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');

    try {
      await api.post('/auth/resend-verification', { email });
      alert('✅ Neuer Code wurde an Ihre Email-Adresse gesendet!');
    } catch (err) {
      setError(err.response?.data?.error || 'Fehler beim Senden des Codes');
    } finally {
      setResending(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
  };

  // Show loading state while checking for email
  if (!email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-yellow-100 rounded-full p-4">
              <AlertCircle className="h-16 w-16 text-yellow-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Keine Email-Adresse gefunden
          </h2>
          <p className="text-gray-600 mb-4">
            Bitte registrieren Sie sich zuerst oder melden Sie sich an.
          </p>
          <Link
            to="/register"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Zur Registrierung
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 rounded-full p-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Email verifiziert!
          </h2>
          <p className="text-gray-600">
            Ihre Email-Adresse wurde erfolgreich verifiziert. Sie werden zum Login weitergeleitet...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4">
      {/* Back to Home Button */}
      <Link 
        to="/"
        className="absolute top-6 left-6 flex items-center space-x-2 text-primary-700 hover:text-primary-900 font-medium transition-colors group"
      >
        <Home className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
        <span>Zur Startseite</span>
      </Link>

      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-primary-100 rounded-full p-4">
              <Mail className="h-16 w-16 text-primary-600" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Email verifizieren
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Wir haben einen 6-stelligen Verifizierungs-Code an
          </p>
          <p className="text-primary-600 font-semibold">
            {email}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            gesendet. Bitte prüfen Sie auch Ihren Spam-Ordner.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          <form onSubmit={handleVerify} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                Verifizierungs-Code
              </label>
              <input
                type="text"
                value={code}
                onChange={handleCodeChange}
                placeholder="000000"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-center text-3xl font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                maxLength="6"
                required
                autoFocus
              />
              <p className="mt-2 text-xs text-gray-500 text-center">
                Geben Sie den 6-stelligen Code ein
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Wird verifiziert...
                </span>
              ) : (
                'Email verifizieren'
              )}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Code nicht erhalten?</span>
              </div>
            </div>

            <button
              onClick={handleResend}
              disabled={resending}
              className="mt-4 w-full flex justify-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {resending ? 'Wird gesendet...' : 'Code erneut senden'}
            </button>

            <p className="mt-4 text-xs text-center text-gray-500">
              Der Code ist 15 Minuten gültig. Danach können Sie einen neuen anfordern.
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link
            to="/login"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            ← Zurück zum Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
