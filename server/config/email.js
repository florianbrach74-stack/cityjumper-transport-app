const { Resend } = require('resend');
require('dotenv').config();

let resend = null;
let emailEnabled = false;

// Initialize Resend only if API key is available
if (process.env.RESEND_API_KEY) {
  try {
    resend = new Resend(process.env.RESEND_API_KEY);
    emailEnabled = true;
    console.log('✅ Resend email service configured');
  } catch (error) {
    console.log('⚠️  Resend initialization failed:', error.message);
  }
} else {
  console.log('⚠️  Resend API key not configured (emails disabled)');
}

const sendEmail = async (to, subject, html, attachments = []) => {
  if (!emailEnabled) {
    console.log('⚠️  Email disabled, skipping:', subject);
    return { messageId: 'email-disabled' };
  }
  
  try {
    const emailData = {
      from: 'Courierly <noreply@courierly.de>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    };
    
    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      emailData.attachments = attachments;
    }
    
    const data = await resend.emails.send(emailData);
    
    console.log('📧 Email sent via Resend:', data.id);
    if (attachments.length > 0) {
      console.log(`   With ${attachments.length} attachment(s)`);
    }
    return { messageId: data.id };
  } catch (error) {
    console.error('❌ Error sending email via Resend:', error.message);
    return { messageId: 'email-failed', error: error.message };
  }
};

// Email templates
const emailTemplates = {
  orderCreated: (order, customerName) => ({
    subject: '✅ Ihr Transportauftrag wurde erfolgreich erstellt',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Transportauftrag erstellt</h2>
        <p>Hallo ${customerName},</p>
        <p>Ihr Transportauftrag wurde erfolgreich in unser System eingestellt.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Auftragsdetails:</h3>
          <p><strong>Auftragsnummer:</strong> #${order.id}</p>
          <p><strong>Abholung:</strong> ${order.pickup_city}, ${order.pickup_postal_code}</p>
          <p><strong>Abholdatum:</strong> ${new Date(order.pickup_date).toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' })}</p>
          <p><strong>Abholzeit:</strong> ${order.pickup_time_from || '00:00'} - ${order.pickup_time_to || 'flexibel'} Uhr</p>
          <p><strong>Zustellung:</strong> ${order.delivery_city}, ${order.delivery_postal_code}</p>
          <p><strong>Zustelldatum:</strong> ${order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' }) : 'Gleicher Tag'}</p>
          <p><strong>Zustellzeit:</strong> ${order.delivery_time_from || '00:00'} - ${order.delivery_time_to || 'flexibel'} Uhr</p>
          <p><strong>Fahrzeugtyp:</strong> ${order.vehicle_type}</p>
          ${order.price ? `<p><strong>Preis:</strong> €${order.price}</p>` : ''}
        </div>
        
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>⚠️ Wichtiger Hinweis:</strong> Courierly ist eine Vermittlungsplattform. 
            Wir können keine Übernahme Ihres Auftrags garantieren. Sie haben jedoch jederzeit die Möglichkeit, 
            durch eine <strong>Preisanpassung</strong> die Übernahmewahrscheinlichkeit zu erhöhen. 
            Sie können den Preis in Ihrem Dashboard anpassen.
          </p>
        </div>
        
        <p>Wir werden Sie benachrichtigen, sobald ein Auftragnehmer Ihren Auftrag annimmt.</p>
        
        <p style="margin-top: 30px;">Mit freundlichen Grüßen,<br>Ihr Courierly Team</p>
      </div>
    `,
  }),

  orderAccepted: (order, contractorName, customerName) => ({
    subject: '🚚 Ihr Transportauftrag wurde angenommen',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Auftrag angenommen!</h2>
        <p>Hallo ${customerName},</p>
        <p>Gute Nachrichten! Ihr Transportauftrag wurde von <strong>${contractorName}</strong> angenommen.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Auftragsdetails:</h3>
          <p><strong>Auftragsnummer:</strong> #${order.id}</p>
          <p><strong>Auftragnehmer:</strong> ${contractorName}</p>
          <p><strong>Abholung:</strong> ${order.pickup_city}, ${order.pickup_postal_code}</p>
          <p><strong>Abholdatum:</strong> ${new Date(order.pickup_date).toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' })}</p>
          <p><strong>Abholzeit:</strong> ${order.pickup_time_from || '00:00'} - ${order.pickup_time_to || 'flexibel'} Uhr</p>
          <p><strong>Zustellung:</strong> ${order.delivery_city}, ${order.delivery_postal_code}</p>
          <p><strong>Zustelldatum:</strong> ${order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' }) : 'Gleicher Tag'}</p>
          <p><strong>Zustellzeit:</strong> ${order.delivery_time_from || '00:00'} - ${order.delivery_time_to || 'flexibel'} Uhr</p>
        </div>
        
        <p>Der Auftragnehmer wird sich bei Bedarf mit Ihnen in Verbindung setzen.</p>
        
        <p style="margin-top: 30px;">Mit freundlichen Grüßen,<br>Ihr Courierly Team</p>
      </div>
    `,
  }),

  orderAcceptedContractor: (order, contractorName) => ({
    subject: '✅ Sie haben einen Transportauftrag angenommen',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Auftragsbestätigung</h2>
        <p>Hallo ${contractorName},</p>
        <p>Sie haben erfolgreich den folgenden Transportauftrag angenommen:</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Auftragsdetails:</h3>
          <p><strong>Auftragsnummer:</strong> #${order.id}</p>
          
          <h4>Abholung:</h4>
          <p>${order.pickup_address}<br>
          ${order.pickup_postal_code} ${order.pickup_city}<br>
          Datum: ${order.pickup_date}${order.pickup_time ? `, ${order.pickup_time}` : ''}</p>
          ${order.pickup_contact_name ? `<p>Kontakt: ${order.pickup_contact_name}${order.pickup_contact_phone ? `, Tel: ${order.pickup_contact_phone}` : ''}</p>` : ''}
          
          <h4>Zustellung:</h4>
          <p>${order.delivery_address}<br>
          ${order.delivery_postal_code} ${order.delivery_city}</p>
          ${order.delivery_contact_name ? `<p>Kontakt: ${order.delivery_contact_name}${order.delivery_contact_phone ? `, Tel: ${order.delivery_contact_phone}` : ''}</p>` : ''}
          
          <h4>Sendungsdetails:</h4>
          <p><strong>Fahrzeugtyp:</strong> ${order.vehicle_type}</p>
          ${order.weight ? `<p><strong>Gewicht:</strong> ${order.weight} kg</p>` : ''}
          ${order.pallets ? `<p><strong>Paletten:</strong> ${order.pallets}</p>` : ''}
          ${order.description ? `<p><strong>Beschreibung:</strong> ${order.description}</p>` : ''}
          ${order.special_requirements ? `<p><strong>Besondere Anforderungen:</strong> ${order.special_requirements}</p>` : ''}
          ${order.price ? `<p><strong>Preis:</strong> €${order.price}</p>` : ''}
        </div>
        
        <p>Bitte führen Sie den Transport gemäß den angegebenen Details durch.</p>
        
        <p style="margin-top: 30px;">Mit freundlichen Grüßen,<br>Ihr Courierly Team</p>
      </div>
    `,
  }),
};

module.exports = {
  sendEmail,
  emailTemplates,
};
