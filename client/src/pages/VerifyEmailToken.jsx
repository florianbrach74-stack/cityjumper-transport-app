import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://cityjumper-api-production-01e4.up.railway.app/api';

const VerifyEmailToken = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Kein Verifizierungs-Token gefunden.');
        return;
      }

      try {
        console.log('🔍 Verifying token:', token);
        
        // Rufe Backend API auf
        const response = await axios.get(`${API_URL}/auth/verify-email/${token}`);
        
        console.log('✅ Verification response:', response.data);
        
        setStatus('success');
        setMessage('Email erfolgreich verifiziert! Sie werden in 3 Sekunden zum Login weitergeleitet...');
        
        // Lösche pendingVerificationEmail aus localStorage
        localStorage.removeItem('pendingVerificationEmail');
        
        // Nach 3 Sekunden zum Login weiterleiten
        setTimeout(() => {
          navigate('/login', {
            state: { 
              message: 'Email erfolgreich verifiziert! Sie können sich jetzt anmelden.',
              verified: true
            }
          });
        }, 3000);
        
      } catch (error) {
        console.error('❌ Verification error:', error);
        
        const errorData = error.response?.data;
        setStatus('error');
        
        if (errorData?.alreadyVerified) {
          setMessage('Diese Email wurde bereits verifiziert. Sie können sich jetzt anmelden.');
          setTimeout(() => {
            navigate('/login', {
              state: { message: 'Email bereits verifiziert.' }
            });
          }, 3000);
        } else if (errorData?.expired) {
          setMessage('Dieser Verifizierungs-Link ist abgelaufen. Bitte fordern Sie einen neuen an.');
        } else {
          setMessage(errorData?.error || 'Verifizierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
        }
      }
    };

    verifyToken();
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full mb-4">
              <span className="text-3xl">🚚</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Email-Verifizierung</h1>
          </div>

          {/* Status */}
          <div className="text-center">
            {status === 'verifying' && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
                </div>
                <p className="text-gray-600">Ihre Email wird verifiziert...</p>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-green-600 mb-2">Erfolgreich verifiziert!</h2>
                  <p className="text-gray-600">{message}</p>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-red-600 mb-2">Verifizierung fehlgeschlagen</h2>
                  <p className="text-gray-600 mb-4">{message}</p>
                  <Link
                    to="/login"
                    className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Zum Login
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              Probleme? <Link to="/login" className="text-purple-600 hover:text-purple-700">Zurück zum Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailToken;
