const pool = require('../config/database');
const emailService = require('../utils/emailService');

/**
 * Überwacht nicht-vermittelte Aufträge und sendet automatische Benachrichtigungen
 * 
 * Läuft alle 5 Minuten und prüft:
 * 1. Zeitfenster-Start erreicht? → Email "Preis anpassen?"
 * 2. Zeitfenster-Ende + 1h überschritten? → Email "Auftrag abgelaufen" + Archivierung
 */
class OrderMonitoringService {
  
  /**
   * Hauptfunktion - wird vom Cron-Job aufgerufen
   */
  async checkUnassignedOrders() {
    try {
      console.log('🔍 [Order Monitoring] Starting check for unassigned orders...');
      
      // Use current time in Europe/Berlin timezone
      const now = new Date();
      const berlinTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
      
      console.log(`Current time (UTC): ${now.toISOString()}`);
      console.log(`Current time (Berlin): ${berlinTime.toISOString()}`);
      
      // 1. Prüfe Aufträge bei Zeitfenster-Start (noch nicht benachrichtigt)
      await this.checkPickupWindowStart(berlinTime);
      
      // 2. Prüfe abgelaufene Aufträge (Zeitfenster-Ende + 1h)
      await this.checkExpiredOrders(berlinTime);
      
      console.log('✅ [Order Monitoring] Check completed');
      
    } catch (error) {
      console.error('❌ [Order Monitoring] Error:', error);
    }
  }
  
  /**
   * Prüft Aufträge, bei denen das Zeitfenster gerade begonnen hat
   * Sendet Email: "Noch nicht vermittelt - Preis anpassen?"
   */
  async checkPickupWindowStart(now) {
    try {
      // Finde alle pending Aufträge, bei denen:
      // - pickup_date + pickup_time_from <= jetzt
      // - Noch keine Benachrichtigung gesendet
      // - Status = 'pending' (nicht zugewiesen)
      
      const query = `
        SELECT 
          o.*,
          u.email as customer_email,
          u.first_name as customer_first_name,
          u.last_name as customer_last_name
        FROM transport_orders o
        JOIN users u ON o.customer_id = u.id
        WHERE o.status = 'pending'
        AND o.contractor_id IS NULL
        AND o.pickup_window_start_notified = FALSE
        AND o.pickup_date IS NOT NULL
        AND o.pickup_time_from IS NOT NULL
        AND (o.pickup_date + o.pickup_time_from) <= $1
      `;
      
      const result = await pool.query(query, [now]);
      
      console.log(`📧 [Zeitfenster-Start] Found ${result.rows.length} orders to notify`);
      
      for (const order of result.rows) {
        await this.sendPickupWindowStartNotification(order);
      }
      
    } catch (error) {
      console.error('❌ [Zeitfenster-Start] Error:', error);
    }
  }
  
  /**
   * Sendet Email bei Zeitfenster-Start
   */
  async sendPickupWindowStartNotification(order) {
    try {
      const pickupDateTime = `${order.pickup_date} ${order.pickup_time_from}`;
      
      // Email senden
      console.log(`📧 Sending pickup window notification to: ${order.customer_email}`);
      const emailResult = await emailService.sendEmail({
        to: order.customer_email,
        subject: `⏰ Ihr Auftrag #${order.id} - Noch nicht vermittelt`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0ea5e9;">Hallo ${order.customer_first_name} ${order.customer_last_name},</h2>
            
            <p>Ihr Auftrag <strong>#${order.id}</strong> konnte bisher leider noch nicht vermittelt werden.</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #374151;">Auftragsdetails:</h3>
              <p><strong>Abholung:</strong> ${order.pickup_city} (${order.pickup_postal_code})</p>
              <p><strong>Zustellung:</strong> ${order.delivery_city} (${order.delivery_postal_code})</p>
              <p><strong>Datum:</strong> ${new Date(order.pickup_date).toLocaleDateString('de-DE')}</p>
              <p><strong>Zeitfenster:</strong> ${order.pickup_time_from} - ${order.pickup_time_to || 'flexibel'}</p>
              <p><strong>Aktueller Preis:</strong> €${parseFloat(order.price).toFixed(2)}</p>
            </div>
            
            <h3 style="color: #f59e0b;">💡 Tipp: Preis anpassen</h3>
            <p>Um die Wahrscheinlichkeit einer schnellen Vermittlung zu erhöhen, können Sie den Preis für diesen Auftrag anpassen.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'https://www.courierly.de'}/customer/orders/${order.id}/edit-price" 
                 style="background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Preis jetzt anpassen
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              <strong>Hinweis:</strong> Wenn der Auftrag bis ${order.pickup_time_to || order.pickup_time_from} + 1 Stunde nicht vermittelt wurde, 
              wird er automatisch aus dem System entfernt.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #6b7280; font-size: 12px;">
              Bei Fragen erreichen Sie uns unter:<br>
              📧 info@courierly.de<br>
              📞 01724216672
            </p>
          </div>
        `
      });
      
      // Markiere als benachrichtigt
      const updateResult = await pool.query(`
        UPDATE transport_orders
        SET 
          pickup_window_start_notified = TRUE,
          pickup_window_start_notification_sent_at = NOW()
        WHERE id = $1
        RETURNING id, pickup_window_start_notified
      `, [order.id]);
      
      if (updateResult.rowCount === 0) {
        console.error(`❌ [Zeitfenster-Start] Failed to update order #${order.id} - order not found`);
      } else {
        console.log(`✅ [Zeitfenster-Start] Notification sent and order #${order.id} marked as notified`);
      }
      
    } catch (error) {
      console.error(`❌ [Zeitfenster-Start] Error sending notification for order #${order.id}:`, error);
      // Re-throw to prevent silent failures
      throw error;
    }
  }
  
  /**
   * Prüft abgelaufene Aufträge (Zeitfenster-Ende + 1h überschritten)
   * Sendet Email und archiviert Auftrag
   */
  async checkExpiredOrders(now) {
    try {
      // Finde alle pending Aufträge, bei denen:
      // - pickup_date + pickup_time_to + 1h <= jetzt
      // - Noch nicht archiviert
      // - Status = 'pending'
      
      const query = `
        SELECT 
          o.*,
          u.email as customer_email,
          u.first_name as customer_first_name,
          u.last_name as customer_last_name
        FROM transport_orders o
        JOIN users u ON o.customer_id = u.id
        WHERE o.status = 'pending'
        AND o.contractor_id IS NULL
        AND o.expired_and_archived = FALSE
        AND o.expiration_notification_sent_at IS NULL
        AND o.pickup_date IS NOT NULL
        AND (
          CASE 
            WHEN o.pickup_time_to IS NOT NULL THEN
              (o.pickup_date + o.pickup_time_to) + interval '1 hour'
            ELSE
              (o.pickup_date + o.pickup_time_from) + interval '1 hour'
          END
        ) <= $1
      `;
      
      const result = await pool.query(query, [now]);
      
      console.log(`🗄️ [Ablauf] Found ${result.rows.length} expired orders to archive`);
      
      for (const order of result.rows) {
        await this.archiveExpiredOrder(order);
      }
      
    } catch (error) {
      console.error('❌ [Ablauf] Error:', error);
    }
  }
  
  /**
   * Archiviert abgelaufenen Auftrag und sendet Email
   */
  async archiveExpiredOrder(order) {
    try {
      const endTime = order.pickup_time_to || order.pickup_time_from;
      
      // Email senden
      console.log(`📧 Sending expiration notification to: ${order.customer_email}`);
      const emailResult = await emailService.sendEmail({
        to: order.customer_email,
        subject: `❌ Ihr Auftrag #${order.id} konnte nicht vermittelt werden`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ef4444;">Hallo ${order.customer_first_name} ${order.customer_last_name},</h2>
            
            <p>Leider konnte Ihr Auftrag <strong>#${order.id}</strong> nicht rechtzeitig vermittelt werden.</p>
            
            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
              <h3 style="margin-top: 0; color: #991b1b;">Auftrag automatisch archiviert</h3>
              <p>Da das Abholzeitfenster abgelaufen ist, wurde der Auftrag aus dem System entfernt.</p>
            </div>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #374151;">Auftragsdetails:</h3>
              <p><strong>Abholung:</strong> ${order.pickup_city} (${order.pickup_postal_code})</p>
              <p><strong>Zustellung:</strong> ${order.delivery_city} (${order.delivery_postal_code})</p>
              <p><strong>Geplantes Datum:</strong> ${new Date(order.pickup_date).toLocaleDateString('de-DE')}</p>
              <p><strong>Zeitfenster:</strong> ${order.pickup_time_from} - ${endTime}</p>
              <p><strong>Preis:</strong> €${parseFloat(order.price).toFixed(2)}</p>
            </div>
            
            <h3 style="color: #0ea5e9;">🚚 Neuen Auftrag erstellen?</h3>
            <p>Wir entschuldigen uns für die Unannehmlichkeiten und hoffen, bei künftigen Aufträgen wieder Ihre erste Wahl zu sein.</p>
            
            <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>💡 Tipps für erfolgreiche Vermittlung:</strong></p>
              <ul style="margin: 10px 0;">
                <li>Längeres Zeitfenster wählen (z.B. 8:00 - 18:00)</li>
                <li>Flexibles Abholdatum angeben</li>
                <li>Marktgerechten Preis kalkulieren</li>
                <li>Frühzeitig buchen (mind. 24h im Voraus)</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'https://www.courierly.de'}/customer/create-order" 
                 style="background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Neuen Auftrag erstellen
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #6b7280; font-size: 12px;">
              Bei Fragen oder Feedback erreichen Sie uns unter:<br>
              📧 info@courierly.de<br>
              📞 01724216672
            </p>
            
            <p style="color: #6b7280; font-size: 12px;">
              Wir freuen uns auf Ihre nächste Buchung!<br>
              Ihr Courierly Team
            </p>
          </div>
        `
      });
      
      // Auftrag aus Datenbank LÖSCHEN (spart Speicher, verschwindet aus verfügbaren Aufträgen)
      const deleteResult = await pool.query(`
        DELETE FROM transport_orders
        WHERE id = $1
        RETURNING id
      `, [order.id]);
      
      if (deleteResult.rowCount === 0) {
        console.error(`❌ [Ablauf] Failed to delete order #${order.id} - order not found`);
      } else {
        console.log(`✅ [Ablauf] Order #${order.id} DELETED from database and notification sent`);
      }
      
    } catch (error) {
      console.error(`❌ [Ablauf] Error archiving order #${order.id}:`, error);
      // Re-throw to prevent silent failures
      throw error;
    }
  }
  
  /**
   * Startet den Cron-Job (alle 5 Minuten)
   */
  startMonitoring() {
    console.log('🚀 [Order Monitoring] Service started - checking every 5 minutes');
    
    // Sofort einmal ausführen
    this.checkUnassignedOrders();
    
    // Dann alle 5 Minuten
    setInterval(() => {
      this.checkUnassignedOrders();
    }, 5 * 60 * 1000); // 5 Minuten
  }
}

module.exports = new OrderMonitoringService();
