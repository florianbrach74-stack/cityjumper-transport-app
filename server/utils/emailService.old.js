const nodemailer = require('nodemailer');

// Email disclaimer for all templates
const getEmailDisclaimer = () => `
  <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
    <p style="margin: 0; color: #92400e; font-size: 14px;">
      <strong>⚠️ Wichtiger Hinweis:</strong> Courierly ist eine Vermittlungsplattform. 
      Wir garantieren keine Auftragsübernahme. 
      <strong>Tipp:</strong> Höhere Preise erhöhen die Wahrscheinlichkeit einer schnellen Übernahme.
    </p>
  </div>
`;

// Create transporter only if email credentials are provided
let transporter = null;

if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  try {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_PORT === '465',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    console.log('✅ Email service configured');
  } catch (error) {
    console.warn('⚠️ Email service configuration failed:', error.message);
  }
} else {
  console.warn('⚠️ Email service not configured - emails will be logged only');
}

const sendNewOrderNotification = async (contractorEmail, orderData) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: contractorEmail,
    subject: 'Neuer Transportauftrag verfügbar',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Neuer Transportauftrag verfügbar</h2>
        <p>Es gibt einen neuen Transportauftrag in Ihrem Gebiet:</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Auftragsdetails:</h3>
          <p><strong>Abholung:</strong> PLZ ${orderData.pickup_postal_code}, ${orderData.pickup_city}</p>
          <p><strong>Zustellung:</strong> PLZ ${orderData.delivery_postal_code}, ${orderData.delivery_city}</p>
          <p><strong>Datum:</strong> ${new Date(orderData.pickup_date).toLocaleDateString('de-DE')}</p>
          <p><strong>Fahrzeugtyp:</strong> ${orderData.vehicle_type}</p>
          ${orderData.price ? `<p><strong>Geschätzter Preis:</strong> €${orderData.price}</p>` : ''}
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          <strong>Hinweis:</strong> Die genauen Kundendaten (Name, vollständige Adresse) werden erst nach Zuweisung durch den Administrator sichtbar.
        </p>
        
        ${getEmailDisclaimer()}
        
        <a href="${process.env.FRONTEND_URL || 'https://cityjumper-transport.vercel.app'}/dashboard" 
           style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
          Zum Dashboard
        </a>
        
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          Sie erhalten diese E-Mail, weil Sie Benachrichtigungen für dieses PLZ-Gebiet aktiviert haben.
        </p>
      </div>
    `,
  };

  if (!transporter) {
    console.log(`📧 [EMAIL DISABLED] Would send notification to ${contractorEmail}`);
    console.log('Order details:', { pickup: orderData.pickup_postal_code, delivery: orderData.delivery_postal_code });
    return;
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Notification email sent to ${contractorEmail}`);
  } catch (error) {
    console.error(`❌ Error sending email to ${contractorEmail}:`, error);
  }
};

const sendOrderAssignmentNotification = async (contractorEmail, orderData) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: contractorEmail,
    subject: 'Auftrag zugewiesen - Vollständige Details verfügbar',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Auftrag wurde Ihnen zugewiesen!</h2>
        <p>Sie haben einen neuen Auftrag erhalten. Hier sind die vollständigen Details:</p>
        
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
          <h3 style="margin-top: 0; color: #16a34a;">Abholung:</h3>
          <p><strong>Adresse:</strong> ${orderData.pickup_address}</p>
          <p><strong>PLZ/Stadt:</strong> ${orderData.pickup_postal_code} ${orderData.pickup_city}</p>
          <p><strong>Datum:</strong> ${new Date(orderData.pickup_date).toLocaleDateString('de-DE')}</p>
          ${orderData.pickup_time ? `<p><strong>Uhrzeit:</strong> ${orderData.pickup_time}</p>` : ''}
          ${orderData.pickup_contact_name ? `<p><strong>Kontakt:</strong> ${orderData.pickup_contact_name}</p>` : ''}
          ${orderData.pickup_contact_phone ? `<p><strong>Telefon:</strong> ${orderData.pickup_contact_phone}</p>` : ''}
        </div>
        
        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
          <h3 style="margin-top: 0; color: #2563eb;">Zustellung:</h3>
          <p><strong>Adresse:</strong> ${orderData.delivery_address}</p>
          <p><strong>PLZ/Stadt:</strong> ${orderData.delivery_postal_code} ${orderData.delivery_city}</p>
          ${orderData.delivery_contact_name ? `<p><strong>Kontakt:</strong> ${orderData.delivery_contact_name}</p>` : ''}
          ${orderData.delivery_contact_phone ? `<p><strong>Telefon:</strong> ${orderData.delivery_contact_phone}</p>` : ''}
        </div>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Weitere Details:</h3>
          <p><strong>Fahrzeugtyp:</strong> ${orderData.vehicle_type}</p>
          ${orderData.price ? `<p><strong>Preis:</strong> €${orderData.price}</p>` : ''}
          ${orderData.description ? `<p><strong>Beschreibung:</strong> ${orderData.description}</p>` : ''}
          ${orderData.special_requirements ? `<p><strong>Besondere Anforderungen:</strong> ${orderData.special_requirements}</p>` : ''}
        </div>
        
        ${getEmailDisclaimer()}
        
        <a href="${process.env.FRONTEND_URL || 'https://cityjumper-transport.vercel.app'}/dashboard" 
           style="display: inline-block; background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
          Auftrag ansehen
        </a>
      </div>
    `,
  };

  if (!transporter) {
    console.log(`📧 [EMAIL DISABLED] Would send assignment notification to ${contractorEmail}`);
    return;
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Assignment email sent to ${contractorEmail}`);
  } catch (error) {
    console.error(`❌ Error sending assignment email to ${contractorEmail}:`, error);
  }
};

module.exports = {
  sendNewOrderNotification,
  sendOrderAssignmentNotification,
};
