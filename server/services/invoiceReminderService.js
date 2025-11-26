const pool = require('../config/database');
const { sendEmail } = require('../config/email');

class InvoiceReminderService {
  /**
   * Startet den Cron-Job (täglich um 9:00 Uhr)
   */
  startReminderService() {
    console.log('🔔 [Invoice Reminder] Service started - checking daily at 9:00 AM');
    
    // NICHT sofort ausführen - wartet bis zum ersten geplanten Zeitpunkt
    // this.checkOverdueInvoices();
    
    // Dann täglich um 9:00 Uhr
    const now = new Date();
    const scheduledTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      9, 0, 0, 0
    );
    
    const msUntilScheduled = scheduledTime - now;
    
    setTimeout(() => {
      this.checkOverdueInvoices();
      // Dann alle 24 Stunden wiederholen
      setInterval(() => {
        this.checkOverdueInvoices();
      }, 24 * 60 * 60 * 1000);
    }, msUntilScheduled);
  }

  /**
   * Prüft überfällige Rechnungen und sendet Erinnerungen
   */
  async checkOverdueInvoices() {
    try {
      console.log('🔍 [Invoice Reminder] Checking for overdue invoices...');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 1. Markiere überfällige Rechnungen
      await this.markOverdueInvoices(today);

      // 2. Sende erste Erinnerung (1 Tag überfällig)
      await this.sendFirstReminder(today);

      // 3. Sende dringende Erinnerung (7 Tage überfällig)
      await this.sendUrgentReminder(today);

      // 4. Sende letzte Mahnung (14 Tage überfällig)
      await this.sendFinalReminder(today);

      console.log('✅ [Invoice Reminder] Check completed');

    } catch (error) {
      console.error('❌ [Invoice Reminder] Error:', error);
    }
  }

  /**
   * Markiert Rechnungen als überfällig
   */
  async markOverdueInvoices(today) {
    let client;
    try {
      client = await pool.connect();
      const result = await client.query(
        `UPDATE sent_invoices
         SET payment_status = 'overdue'
         WHERE payment_status = 'unpaid'
         AND due_date < $1
         RETURNING invoice_number`,
        [today]
      );

      if (result.rows.length > 0) {
        console.log(`📌 [Overdue] Marked ${result.rows.length} invoices as overdue`);
        
        // Auch die verknüpften Aufträge aktualisieren
        for (const invoice of result.rows) {
          await client.query(
            `UPDATE transport_orders
             SET payment_status = 'overdue'
             WHERE invoice_number = $1`,
            [invoice.invoice_number]
          );
        }
      }
    } catch (error) {
      console.error('❌ [Overdue] Error marking invoices:', error.message);
    } finally {
      if (client) client.release();
    }
  }

  /**
   * Sendet erste freundliche Erinnerung (1 Tag überfällig)
   */
  async sendFirstReminder(today) {
    try {
      const oneDayAgo = new Date(today);
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const query = `
        SELECT 
          i.*,
          u.email as customer_email,
          u.billing_email as customer_billing_email,
          u.first_name as customer_first_name,
          u.last_name as customer_last_name,
          u.company_name as customer_company
        FROM sent_invoices i
        LEFT JOIN users u ON i.customer_id = u.id
        WHERE i.payment_status = 'overdue'
        AND i.due_date = $1
        AND (i.reminder_count IS NULL OR i.reminder_count = 0)
      `;

      const result = await pool.query(query, [oneDayAgo]);

      for (const invoice of result.rows) {
        await this.sendReminderEmail(invoice, 'friendly');
        
        await pool.query(
          `UPDATE sent_invoices
           SET last_reminder_sent_at = CURRENT_TIMESTAMP,
               reminder_count = 1
           WHERE invoice_number = $1`,
          [invoice.invoice_number]
        );
      }

      if (result.rows.length > 0) {
        console.log(`📧 [First Reminder] Sent ${result.rows.length} friendly reminders`);
      }

    } catch (error) {
      console.error('❌ [First Reminder] Error:', error);
    }
  }

  /**
   * Sendet dringende Erinnerung (7 Tage überfällig)
   */
  async sendUrgentReminder(today) {
    try {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const query = `
        SELECT 
          i.*,
          u.email as customer_email,
          u.billing_email as customer_billing_email,
          u.first_name as customer_first_name,
          u.last_name as customer_last_name,
          u.company_name as customer_company
        FROM sent_invoices i
        LEFT JOIN users u ON i.customer_id = u.id
        WHERE i.payment_status = 'overdue'
        AND i.due_date <= $1
        AND i.reminder_count = 1
      `;

      const result = await pool.query(query, [sevenDaysAgo]);

      for (const invoice of result.rows) {
        await this.sendReminderEmail(invoice, 'urgent');
        
        await pool.query(
          `UPDATE sent_invoices
           SET last_reminder_sent_at = CURRENT_TIMESTAMP,
               reminder_count = 2
           WHERE invoice_number = $1`,
          [invoice.invoice_number]
        );
      }

      if (result.rows.length > 0) {
        console.log(`⚠️ [Urgent Reminder] Sent ${result.rows.length} urgent reminders`);
      }

    } catch (error) {
      console.error('❌ [Urgent Reminder] Error:', error);
    }
  }

  /**
   * Sendet letzte Mahnung (14 Tage überfällig)
   */
  async sendFinalReminder(today) {
    try {
      const fourteenDaysAgo = new Date(today);
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      const query = `
        SELECT 
          i.*,
          u.email as customer_email,
          u.billing_email as customer_billing_email,
          u.first_name as customer_first_name,
          u.last_name as customer_last_name,
          u.company_name as customer_company
        FROM sent_invoices i
        LEFT JOIN users u ON i.customer_id = u.id
        WHERE i.payment_status = 'overdue'
        AND i.due_date <= $1
        AND i.reminder_count = 2
      `;

      const result = await pool.query(query, [fourteenDaysAgo]);

      for (const invoice of result.rows) {
        await this.sendReminderEmail(invoice, 'final');
        
        await pool.query(
          `UPDATE sent_invoices
           SET last_reminder_sent_at = CURRENT_TIMESTAMP,
               reminder_count = 3
           WHERE invoice_number = $1`,
          [invoice.invoice_number]
        );
      }

      if (result.rows.length > 0) {
        console.log(`🚨 [Final Reminder] Sent ${result.rows.length} final reminders`);
      }

    } catch (error) {
      console.error('❌ [Final Reminder] Error:', error);
    }
  }

  /**
   * Sendet Erinnerungs-Email
   */
  async sendReminderEmail(invoice, type) {
    try {
      const recipientEmail = invoice.customer_billing_email || invoice.customer_email;
      const customerName = invoice.customer_company || 
                          `${invoice.customer_first_name} ${invoice.customer_last_name}`;

      const templates = {
        friendly: {
          subject: `Freundliche Zahlungserinnerung - Rechnung ${invoice.invoice_number}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #0ea5e9;">Zahlungserinnerung</h2>
              <p>Sehr geehrte/r ${customerName},</p>
              <p>wir möchten Sie freundlich an die ausstehende Zahlung für folgende Rechnung erinnern:</p>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Rechnungsnummer:</strong> ${invoice.invoice_number}</p>
                <p><strong>Rechnungsdatum:</strong> ${new Date(invoice.invoice_date).toLocaleDateString('de-DE')}</p>
                <p><strong>Fälligkeitsdatum:</strong> ${new Date(invoice.due_date).toLocaleDateString('de-DE')}</p>
                <p><strong>Betrag:</strong> €${parseFloat(invoice.total_amount).toFixed(2)}</p>
              </div>
              
              <p>Falls Sie die Rechnung bereits beglichen haben, betrachten Sie diese Email bitte als gegenstandslos.</p>
              
              <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Zahlungsinformationen:</strong></p>
                <p style="margin: 5px 0;">Bank: Berliner Sparkasse</p>
                <p style="margin: 5px 0;">IBAN: DE92 1005 0000 1062 9152 80</p>
                <p style="margin: 5px 0;">BIC: BELADEBEXXX</p>
              </div>
              
              <p>Bei Fragen erreichen Sie uns unter:<br>
              📧 info@courierly.de<br>
              📞 01724216672</p>
              
              <p>Mit freundlichen Grüßen<br>Ihr Courierly Team</p>
            </div>
          `
        },
        urgent: {
          subject: `Dringende Zahlungserinnerung - Rechnung ${invoice.invoice_number}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #f59e0b;">⚠️ Dringende Zahlungserinnerung</h2>
              <p>Sehr geehrte/r ${customerName},</p>
              <p>die Zahlung für folgende Rechnung ist nun bereits mehrere Tage überfällig:</p>
              
              <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <p><strong>Rechnungsnummer:</strong> ${invoice.invoice_number}</p>
                <p><strong>Fälligkeitsdatum:</strong> ${new Date(invoice.due_date).toLocaleDateString('de-DE')}</p>
                <p><strong>Offener Betrag:</strong> €${parseFloat(invoice.total_amount).toFixed(2)}</p>
              </div>
              
              <p style="color: #dc2626;"><strong>Bitte begleichen Sie den Betrag umgehend, um Mahngebühren zu vermeiden.</strong></p>
              
              <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Zahlungsinformationen:</strong></p>
                <p style="margin: 5px 0;">Bank: Berliner Sparkasse</p>
                <p style="margin: 5px 0;">IBAN: DE92 1005 0000 1062 9152 80</p>
                <p style="margin: 5px 0;">BIC: BELADEBEXXX</p>
              </div>
              
              <p>Bei Fragen oder Zahlungsschwierigkeiten kontaktieren Sie uns bitte umgehend:<br>
              📧 info@courierly.de<br>
              📞 01724216672</p>
              
              <p>Mit freundlichen Grüßen<br>Ihr Courierly Team</p>
            </div>
          `
        },
        final: {
          subject: `Letzte Mahnung - Rechnung ${invoice.invoice_number}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">🚨 Letzte Mahnung</h2>
              <p>Sehr geehrte/r ${customerName},</p>
              <p>trotz mehrfacher Erinnerung ist die Zahlung für folgende Rechnung noch nicht eingegangen:</p>
              
              <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                <p><strong>Rechnungsnummer:</strong> ${invoice.invoice_number}</p>
                <p><strong>Fälligkeitsdatum:</strong> ${new Date(invoice.due_date).toLocaleDateString('de-DE')}</p>
                <p><strong>Offener Betrag:</strong> €${parseFloat(invoice.total_amount).toFixed(2)}</p>
                <p style="color: #dc2626;"><strong>Tage überfällig:</strong> ${Math.floor((new Date() - new Date(invoice.due_date)) / (1000 * 60 * 60 * 24))}</p>
              </div>
              
              <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #dc2626; font-weight: bold; margin: 0;">⚠️ WICHTIG</p>
                <p style="margin: 10px 0;">Dies ist unsere letzte Mahnung. Bitte begleichen Sie den Betrag innerhalb von 7 Tagen.</p>
                <p style="margin: 10px 0; color: #dc2626;">Andernfalls müssen wir rechtliche Schritte einleiten und ein Inkassoverfahren einleiten.</p>
              </div>
              
              <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Zahlungsinformationen:</strong></p>
                <p style="margin: 5px 0;">Bank: Berliner Sparkasse</p>
                <p style="margin: 5px 0;">IBAN: DE92 1005 0000 1062 9152 80</p>
                <p style="margin: 5px 0;">BIC: BELADEBEXXX</p>
                <p style="margin: 5px 0; color: #dc2626;"><strong>Verwendungszweck: ${invoice.invoice_number}</strong></p>
              </div>
              
              <p>Kontaktieren Sie uns SOFORT bei Zahlungsschwierigkeiten:<br>
              📧 info@courierly.de<br>
              📞 01724216672</p>
              
              <p>Mit freundlichen Grüßen<br>Ihr Courierly Team</p>
            </div>
          `
        }
      };

      const template = templates[type];
      
      await sendEmail(
        recipientEmail,
        template.subject,
        template.html
      );

      console.log(`✅ [${type}] Reminder sent to ${recipientEmail} for invoice ${invoice.invoice_number}`);

    } catch (error) {
      console.error(`❌ [${type}] Error sending reminder for invoice ${invoice.invoice_number}:`, error);
    }
  }
}

module.exports = new InvoiceReminderService();
