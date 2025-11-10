const { Resend } = require('resend');

let resend = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

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

// Helper function to send emails via Resend
const sendEmail = async ({ to, subject, html }) => {
  try {
    // Initialize Resend if not already done
    if (!resend && process.env.RESEND_API_KEY) {
      const { Resend } = require('resend');
      resend = new Resend(process.env.RESEND_API_KEY);
      console.log('✅ Resend initialized on-demand');
    }

    if (!resend || !process.env.RESEND_API_KEY) {
      console.warn('⚠️  Resend API key not configured - email will be logged only');
      console.log(`📧 Would send email to: ${to}`);
      console.log(`   Subject: ${subject}`);
      return { success: false, message: 'Email service not configured' };
    }

    console.log(`📧 Sending email via Resend to: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   API Key present: ${!!process.env.RESEND_API_KEY}`);
    
    const data = await resend.emails.send({
      from: 'Courierly <noreply@courierly.de>',
      to: Array.isArray(to) ? to : [to],
      subject: subject,
      html: html,
    });

    console.log('✅ Email sent successfully via Resend');
    console.log(`   Message ID: ${data.id}`);
    
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('❌ Resend email error:', error);
    console.error('   Error details:', error.message);
    console.error('   Error stack:', error.stack);
    return { success: false, error: error.message };
  }
};

const sendNewOrderNotification = async (contractorEmail, orderData) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Neuer Transportauftrag verfügbar</h2>
      <p>Es gibt einen neuen Transportauftrag in Ihrem Gebiet:</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Auftragsdetails:</h3>
        <p><strong>Abholung:</strong> PLZ ${orderData.pickup_postal_code}, ${orderData.pickup_city}</p>
        <p><strong>Zustellung:</strong> PLZ ${orderData.delivery_postal_code}, ${orderData.delivery_city}</p>
        <p><strong>Datum:</strong> ${new Date(orderData.pickup_date).toLocaleDateString('de-DE')}</p>
        <p><strong>Fahrzeugtyp:</strong> ${orderData.vehicle_type}</p>
        <p><strong>Preis:</strong> ${orderData.price} €</p>
      </div>

      ${getEmailDisclaimer()}
      
      <p>Melden Sie sich in Ihrem Dashboard an, um den Auftrag anzunehmen.</p>
      
      <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
        Mit freundlichen Grüßen,<br>
        Ihr Courierly Team
      </p>
    </div>
  `;

  return sendEmail({
    to: contractorEmail,
    subject: 'Neuer Transportauftrag verfügbar',
    html
  });
};

const sendOrderAssignmentNotification = async (customerEmail, contractorData, orderData) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">Ihr Auftrag wurde angenommen!</h2>
      <p>Gute Nachrichten! Ihr Transportauftrag wurde von einem Transportunternehmen angenommen.</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Transportunternehmen:</h3>
        <p><strong>Firma:</strong> ${contractorData.company_name || `${contractorData.first_name} ${contractorData.last_name}`}</p>
        <p><strong>Email:</strong> ${contractorData.email}</p>
        <p><strong>Telefon:</strong> ${contractorData.phone || 'Nicht angegeben'}</p>
      </div>

      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Auftragsdetails:</h3>
        <p><strong>Von:</strong> ${orderData.pickup_city}</p>
        <p><strong>Nach:</strong> ${orderData.delivery_city}</p>
        <p><strong>Datum:</strong> ${new Date(orderData.pickup_date).toLocaleDateString('de-DE')}</p>
        <p><strong>Preis:</strong> ${orderData.price} €</p>
      </div>
      
      <p>Das Transportunternehmen wird sich in Kürze mit Ihnen in Verbindung setzen.</p>
      
      <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
        Mit freundlichen Grüßen,<br>
        Ihr Courierly Team
      </p>
    </div>
  `;

  return sendEmail({
    to: customerEmail,
    subject: 'Ihr Transportauftrag wurde angenommen - Courierly',
    html
  });
};

const sendBidNotification = async (customerEmail, contractorData, orderData, bidAmount) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #00d9ff;">Neues Angebot für Ihren Auftrag</h2>
      <p>Guten Tag,</p>
      <p><strong>${contractorData.company_name || `${contractorData.first_name} ${contractorData.last_name}`}</strong> hat ein Angebot für Ihren Transportauftrag abgegeben:</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Auftragsdetails:</h3>
        <p><strong>Route:</strong> ${orderData.pickup_city} → ${orderData.delivery_city}</p>
        <p><strong>Angebotspreis:</strong> ${bidAmount} €</p>
      </div>
      
      <p>Sie können das Angebot in Ihrem Dashboard annehmen oder ablehnen.</p>
      
      <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
        Mit freundlichen Grüßen,<br>
        Ihr Courierly Team
      </p>
    </div>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Neues Angebot von ${contractorData.company_name || contractorData.first_name} - Courierly`,
    html
  });
};

const sendAdminNotification = async (adminEmail, subject, message) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Admin-Benachrichtigung</h2>
      <p>${message}</p>
      
      <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
        Courierly Admin System
      </p>
    </div>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `[Admin] ${subject}`,
    html
  });
};

module.exports = {
  sendEmail,
  sendNewOrderNotification,
  sendOrderAssignmentNotification,
  sendBidNotification,
  sendAdminNotification
};
