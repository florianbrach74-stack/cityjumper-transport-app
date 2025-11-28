const pool = require('../config/database');
const { sendEmail } = require('../config/email');

/**
 * Payment Reminder Service
 * Automatically sends payment reminders based on due dates
 */

async function checkAndSendReminders() {
  try {
    console.log('🔔 Checking for overdue invoices...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get all unpaid invoices that are overdue
    const result = await pool.query(`
      SELECT 
        i.*,
        u.email as customer_email,
        u.billing_email as customer_billing_email,
        u.first_name as customer_first_name,
        u.last_name as customer_last_name,
        u.company_name as customer_company,
        CURRENT_DATE - i.due_date as days_overdue
      FROM sent_invoices i
      LEFT JOIN users u ON i.customer_id = u.id
      WHERE i.payment_status = 'unpaid'
        AND i.due_date < CURRENT_DATE
      ORDER BY i.due_date ASC
    `);
    
    console.log(`📊 Found ${result.rows.length} overdue invoices`);
    
    for (const invoice of result.rows) {
      const daysOverdue = invoice.days_overdue;
      const reminderCount = invoice.reminder_count || 0;
      const lastReminderDate = invoice.last_reminder_sent_at ? new Date(invoice.last_reminder_sent_at) : null;
      
      // Calculate days since last reminder
      let daysSinceLastReminder = 999;
      if (lastReminderDate) {
        daysSinceLastReminder = Math.floor((today - lastReminderDate) / (1000 * 60 * 60 * 24));
      }
      
      let shouldSendReminder = false;
      let reminderType = 'friendly';
      
      // Reminder logic:
      // - First reminder: 1 day after due date
      // - Second reminder: 7 days after first reminder (8 days overdue)
      // - Final reminder: 7 days after second reminder (15 days overdue)
      
      if (reminderCount === 0 && daysOverdue >= 1) {
        shouldSendReminder = true;
        reminderType = 'friendly';
      } else if (reminderCount === 1 && daysOverdue >= 8 && daysSinceLastReminder >= 7) {
        shouldSendReminder = true;
        reminderType = 'urgent';
      } else if (reminderCount === 2 && daysOverdue >= 15 && daysSinceLastReminder >= 7) {
        shouldSendReminder = true;
        reminderType = 'final';
      }
      
      if (shouldSendReminder) {
        try {
          await sendPaymentReminder(invoice, reminderType);
          
          // Update invoice
          await pool.query(`
            UPDATE sent_invoices 
            SET 
              last_reminder_sent_at = CURRENT_TIMESTAMP,
              reminder_count = COALESCE(reminder_count, 0) + 1,
              payment_status = CASE 
                WHEN $1 = 'final' THEN 'overdue'
                ELSE payment_status
              END
            WHERE invoice_number = $2
          `, [reminderType, invoice.invoice_number]);
          
          console.log(`✅ Sent ${reminderType} reminder for invoice ${invoice.invoice_number} (${daysOverdue} days overdue)`);
        } catch (error) {
          console.error(`❌ Failed to send reminder for invoice ${invoice.invoice_number}:`, error.message);
        }
      }
    }
    
    console.log('✅ Payment reminder check completed');
    
  } catch (error) {
    console.error('❌ Error in payment reminder service:', error);
  }
}

async function sendPaymentReminder(invoice, reminderType) {
  const recipientEmail = invoice.customer_billing_email || invoice.customer_email;
  
  if (!recipientEmail) {
    throw new Error('No email address found for customer');
  }
  
  const reminderTemplates = {
    friendly: {
      subject: `Freundliche Zahlungserinnerung - Rechnung ${invoice.invoice_number}`,
      message: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Zahlungserinnerung</h2>
          <p>Sehr geehrte/r ${invoice.customer_first_name} ${invoice.customer_last_name},</p>
          <p>wir möchten Sie freundlich an die ausstehende Zahlung für folgende Rechnung erinnern:</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Rechnungsnummer:</strong> ${invoice.invoice_number}</p>
            <p style="margin: 5px 0;"><strong>Rechnungsdatum:</strong> ${new Date(invoice.invoice_date).toLocaleDateString('de-DE')}</p>
            <p style="margin: 5px 0;"><strong>Fälligkeitsdatum:</strong> ${new Date(invoice.due_date).toLocaleDateString('de-DE')}</p>
            <p style="margin: 5px 0;"><strong>Betrag:</strong> <span style="font-size: 18px; color: #2563eb;">€${parseFloat(invoice.total_amount).toFixed(2)}</span></p>
          </div>
          
          <p>Falls Sie die Rechnung bereits beglichen haben, betrachten Sie diese Email bitte als gegenstandslos.</p>
          
          <p style="margin-top: 30px;">Mit freundlichen Grüßen<br>Ihr Courierly Team</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #6b7280;">
            Courierly - Eine Marke der FB Transporte<br>
            Adolf-Menzel Straße 71, 12621 Berlin<br>
            Tel: 01724216672 | Email: info@courierly.de
          </p>
        </div>
      `
    },
    urgent: {
      subject: `Dringende Zahlungserinnerung - Rechnung ${invoice.invoice_number}`,
      message: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">⚠️ Dringende Zahlungserinnerung</h2>
          <p>Sehr geehrte/r ${invoice.customer_first_name} ${invoice.customer_last_name},</p>
          <p>die Zahlung für folgende Rechnung ist überfällig:</p>
          
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 5px 0;"><strong>Rechnungsnummer:</strong> ${invoice.invoice_number}</p>
            <p style="margin: 5px 0;"><strong>Fälligkeitsdatum:</strong> ${new Date(invoice.due_date).toLocaleDateString('de-DE')}</p>
            <p style="margin: 5px 0;"><strong>Tage überfällig:</strong> ${invoice.days_overdue}</p>
            <p style="margin: 5px 0;"><strong>Offener Betrag:</strong> <span style="font-size: 18px; color: #f59e0b;">€${parseFloat(invoice.total_amount).toFixed(2)}</span></p>
          </div>
          
          <p style="color: #dc2626; font-weight: bold;">Bitte begleichen Sie den Betrag umgehend, um Mahngebühren zu vermeiden.</p>
          
          <p>Bei Fragen oder Problemen kontaktieren Sie uns bitte unter:</p>
          <p><strong>Tel:</strong> 01724216672<br>
          <strong>Email:</strong> info@courierly.de</p>
          
          <p style="margin-top: 30px;">Mit freundlichen Grüßen<br>Ihr Courierly Team</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #6b7280;">
            Courierly - Eine Marke der FB Transporte<br>
            Adolf-Menzel Straße 71, 12621 Berlin<br>
            Tel: 01724216672 | Email: info@courierly.de
          </p>
        </div>
      `
    },
    final: {
      subject: `⚠️ LETZTE MAHNUNG - Rechnung ${invoice.invoice_number}`,
      message: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">🚨 LETZTE MAHNUNG</h2>
          <p>Sehr geehrte/r ${invoice.customer_first_name} ${invoice.customer_last_name},</p>
          <p>trotz mehrfacher Erinnerung ist die Zahlung für folgende Rechnung noch nicht eingegangen:</p>
          
          <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <p style="margin: 5px 0;"><strong>Rechnungsnummer:</strong> ${invoice.invoice_number}</p>
            <p style="margin: 5px 0;"><strong>Fälligkeitsdatum:</strong> ${new Date(invoice.due_date).toLocaleDateString('de-DE')}</p>
            <p style="margin: 5px 0;"><strong>Tage überfällig:</strong> ${invoice.days_overdue}</p>
            <p style="margin: 5px 0;"><strong>Offener Betrag:</strong> <span style="font-size: 20px; color: #dc2626; font-weight: bold;">€${parseFloat(invoice.total_amount).toFixed(2)}</span></p>
          </div>
          
          <div style="background: #dc2626; color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">⚠️ WICHTIG: Dies ist unsere letzte Mahnung!</p>
            <p style="margin: 10px 0 0 0;">Bitte begleichen Sie den Betrag innerhalb von 7 Tagen, andernfalls müssen wir rechtliche Schritte einleiten und ein Inkassoverfahren einleiten.</p>
          </div>
          
          <p><strong>Zahlungsinformationen:</strong></p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 10px 0;">
            <p style="margin: 5px 0;">IBAN: DE92 1005 0000 1062 9152 80</p>
            <p style="margin: 5px 0;">BIC: BELADEBEXXX</p>
            <p style="margin: 5px 0;">Verwendungszweck: ${invoice.invoice_number}</p>
          </div>
          
          <p>Kontakt für Rückfragen:</p>
          <p><strong>Tel:</strong> 01724216672<br>
          <strong>Email:</strong> info@courierly.de</p>
          
          <p style="margin-top: 30px;">Mit freundlichen Grüßen<br>Ihr Courierly Team</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #6b7280;">
            Courierly - Eine Marke der FB Transporte<br>
            Adolf-Menzel Straße 71, 12621 Berlin<br>
            Tel: 01724216672 | Email: info@courierly.de<br>
            USt-IdNr: DE299198928 | Steuernummer: 33/237/00521
          </p>
        </div>
      `
    }
  };
  
  const template = reminderTemplates[reminderType];
  
  await sendEmail(
    recipientEmail,
    template.subject,
    template.message
  );
}

module.exports = {
  checkAndSendReminders
};
