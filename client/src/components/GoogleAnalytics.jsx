import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// WICHTIG: Ersetze 'G-XXXXXXXXXX' mit deiner echten Google Analytics Mess-ID
// Die bekommst du von: https://analytics.google.com
const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX';

export const GoogleAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    // Nur laden wenn Mess-ID gesetzt ist
    if (GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') {
      console.log('⚠️ Google Analytics: Bitte Mess-ID in GoogleAnalytics.jsx eintragen');
      return;
    }

    // Google Analytics Script laden
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_MEASUREMENT_ID}', {
        page_path: window.location.pathname,
      });
    `;
    document.head.appendChild(script2);

    console.log('✅ Google Analytics geladen');
  }, []);

  // Track page views bei Navigation
  useEffect(() => {
    if (window.gtag && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_path: location.pathname + location.search,
      });
      console.log('📊 Page View:', location.pathname);
    }
  }, [location]);

  return null;
};

// Event Tracking Funktionen
export const trackEvent = (eventName, eventParams = {}) => {
  if (window.gtag && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
    window.gtag('event', eventName, eventParams);
    console.log('📊 Event:', eventName, eventParams);
  }
};

// Vordefinierte Events
export const trackRegistration = (method = 'email') => {
  trackEvent('sign_up', { 
    method,
    event_category: 'engagement'
  });
};

export const trackLogin = (method = 'email') => {
  trackEvent('login', { 
    method,
    event_category: 'engagement'
  });
};

export const trackOrderCreated = (value, orderId) => {
  trackEvent('create_order', { 
    currency: 'EUR',
    value: parseFloat(value),
    transaction_id: orderId,
    event_category: 'ecommerce'
  });
};

export const trackPriceCalculation = (distance, price) => {
  trackEvent('calculate_price', {
    event_category: 'engagement',
    distance_km: distance,
    calculated_price: price
  });
};

export const trackOrderAccepted = (orderId, contractorId) => {
  trackEvent('order_accepted', {
    event_category: 'engagement',
    order_id: orderId,
    contractor_id: contractorId
  });
};

export const trackOrderCompleted = (orderId, value) => {
  trackEvent('order_completed', {
    event_category: 'ecommerce',
    order_id: orderId,
    value: parseFloat(value),
    currency: 'EUR'
  });
};

export const trackEmailVerification = (success) => {
  trackEvent('email_verification', {
    event_category: 'engagement',
    success: success
  });
};

export const trackPasswordReset = () => {
  trackEvent('password_reset', {
    event_category: 'engagement'
  });
};

export default GoogleAnalytics;
