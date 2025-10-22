const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Email configuration error:', error);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"ZipMend Transport" <noreply@zipmend.com>',
      to,
      subject,
      html,
    });
    console.log('📧 Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
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
          <p><strong>Zustellung:</strong> ${order.delivery_city}, ${order.delivery_postal_code}</p>
          <p><strong>Abholdatum:</strong> ${order.pickup_date}</p>
          <p><strong>Fahrzeugtyp:</strong> ${order.vehicle_type}</p>
          ${order.price ? `<p><strong>Preis:</strong> €${order.price}</p>` : ''}
        </div>
        
        <p>Wir werden Sie benachrichtigen, sobald ein Auftragnehmer Ihren Auftrag annimmt.</p>
        
        <p style="margin-top: 30px;">Mit freundlichen Grüßen,<br>Ihr ZipMend Team</p>
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
          <p><strong>Zustellung:</strong> ${order.delivery_city}, ${order.delivery_postal_code}</p>
          <p><strong>Abholdatum:</strong> ${order.pickup_date}</p>
        </div>
        
        <p>Der Auftragnehmer wird sich bei Bedarf mit Ihnen in Verbindung setzen.</p>
        
        <p style="margin-top: 30px;">Mit freundlichen Grüßen,<br>Ihr ZipMend Team</p>
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
        
        <p style="margin-top: 30px;">Mit freundlichen Grüßen,<br>Ihr ZipMend Team</p>
      </div>
    `,
  }),
};

module.exports = {
  sendEmail,
  emailTemplates,
};
