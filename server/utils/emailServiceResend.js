const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html, from = 'Courierly <noreply@courierly.de>' }) => {
  try {
    console.log(`📧 Sending email via Resend to: ${to}`);
    console.log(`   Subject: ${subject}`);
    
    const data = await resend.emails.send({
      from: from,
      to: Array.isArray(to) ? to : [to],
      subject: subject,
      html: html,
    });

    console.log('✅ Email sent successfully via Resend');
    console.log(`   Message ID: ${data.id}`);
    
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('❌ Resend email error:', error);
    throw error;
  }
};

// Helper function for order notifications
const sendOrderNotification = async ({ to, customerName, orderDetails }) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #00d9ff;">Neuer Transportauftrag</h1>
      
      <p>Hallo ${customerName},</p>
      
      <p>Ein neuer Transportauftrag wurde erstellt:</p>
      
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Auftragsdetails:</h3>
        <ul style="list-style: none; padding: 0;">
          <li><strong>Von:</strong> ${orderDetails.pickupCity}</li>
          <li><strong>Nach:</strong> ${orderDetails.deliveryCity}</li>
          <li><strong>Datum:</strong> ${orderDetails.pickupDate}</li>
          <li><strong>Fahrzeug:</strong> ${orderDetails.vehicleType}</li>
          <li><strong>Preis:</strong> ${orderDetails.price} €</li>
        </ul>
      </div>
      
      <p>Sie können den Auftrag in Ihrem Dashboard einsehen.</p>
      
      <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
        Mit freundlichen Grüßen,<br>
        Ihr Courierly Team
      </p>
    </div>
  `;

  return sendEmail({
    to,
    subject: 'Neuer Transportauftrag - Courierly',
    html
  });
};

// Helper function for bid notifications
const sendBidNotification = async ({ to, contractorName, orderDetails, bidAmount }) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #00d9ff;">Neues Angebot für Ihren Auftrag</h1>
      
      <p>Guten Tag,</p>
      
      <p><strong>${contractorName}</strong> hat ein Angebot für Ihren Transportauftrag abgegeben:</p>
      
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Auftragsdetails:</h3>
        <ul style="list-style: none; padding: 0;">
          <li><strong>Route:</strong> ${orderDetails.pickupCity} → ${orderDetails.deliveryCity}</li>
          <li><strong>Angebotspreis:</strong> ${bidAmount} €</li>
        </ul>
      </div>
      
      <p>Sie können das Angebot in Ihrem Dashboard annehmen oder ablehnen.</p>
      
      <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
        Mit freundlichen Grüßen,<br>
        Ihr Courierly Team
      </p>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Neues Angebot von ${contractorName} - Courierly`,
    html
  });
};

module.exports = {
  sendEmail,
  sendOrderNotification,
  sendBidNotification
};
