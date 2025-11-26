const pool = require('../config/database');

/**
 * Berechne Stunden bis zur Abholzeit
 */
function calculateHoursUntilPickup(pickupDate, pickupTime) {
  const now = new Date();
  const pickupDateTime = new Date(`${pickupDate}T${pickupTime}`);
  const diffMs = pickupDateTime - now;
  const diffHours = diffMs / (1000 * 60 * 60);
  return Math.max(0, diffHours);
}

/**
 * Berechne Stornierungsgebühr laut AGB §7.1
 * 
 * - >24h: 0%
 * - 12-24h: 50%
 * - 2-12h: 75%
 * - <2h: 100%
 */
function calculateCancellationFee(orderPrice, hoursBeforePickup) {
  if (hoursBeforePickup >= 24) {
    return 0; // Kostenfrei
  } else if (hoursBeforePickup >= 12) {
    return orderPrice * 0.50; // 50%
  } else if (hoursBeforePickup >= 2) {
    return orderPrice * 0.75; // 75%
  } else {
    return orderPrice * 1.00; // 100%
  }
}

/**
 * Stornierung durch Auftragnehmer
 * 
 * Logik:
 * 1. Berechne Strafe (abhängig von Stunden bis Abholung)
 * 2. Kunde zahlt weiterhin ursprünglichen Preis
 * 3. Budget = Kundenpreis + Strafe
 * 4. Status zurück auf 'pending'
 * 5. Auftragnehmer wird entfernt
 */
async function cancelByContractor(orderId, reason = 'Auftragnehmer hat storniert') {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Hole Auftrag
    const orderResult = await client.query(
      `SELECT id, price, contractor_id, pickup_date, pickup_time, status
       FROM orders WHERE id = $1`,
      [orderId]
    );
    
    if (orderResult.rows.length === 0) {
      throw new Error('Auftrag nicht gefunden');
    }
    
    const order = orderResult.rows[0];
    
    if (!order.contractor_id) {
      throw new Error('Kein Auftragnehmer zugewiesen');
    }
    
    if (order.status === 'completed') {
      throw new Error('Auftrag bereits abgeschlossen');
    }
    
    // Berechne Stunden bis Abholung
    const hoursBeforePickup = calculateHoursUntilPickup(order.pickup_date, order.pickup_time);
    
    // Berechne was Auftragnehmer bekommen hätte (85%)
    const contractorPayout = order.price * 0.85;
    
    // Berechne Strafe laut AGB §7.2b (gleiche Staffelung wie Kunde)
    const penaltyPercentage = hoursBeforePickup >= 24 ? 0 :
                              hoursBeforePickup >= 12 ? 0.50 :
                              hoursBeforePickup >= 2 ? 0.75 : 1.00;
    
    const contractorPenalty = contractorPayout * penaltyPercentage;
    
    // Verfügbares Budget für Neuvermittlung
    const availableBudget = order.price + contractorPenalty;
    
    console.log('📊 Auftragnehmer-Stornierung:');
    console.log('   Kundenpreis:', order.price);
    console.log('   AN hätte bekommen:', contractorPayout);
    console.log('   Stunden bis Abholung:', hoursBeforePickup.toFixed(2));
    console.log('   Strafe (', (penaltyPercentage * 100), '%):', contractorPenalty);
    console.log('   Verfügbares Budget:', availableBudget);
    
    // Update Auftrag
    await client.query(
      `UPDATE orders SET
        status = 'pending',
        contractor_id = NULL,
        cancellation_status = 'cancelled_by_contractor',
        cancelled_by = 'contractor',
        cancellation_timestamp = NOW(),
        cancellation_reason = $1,
        hours_before_pickup = $2,
        contractor_penalty = $3,
        available_budget = $4,
        customer_cancellation_fee = 0,
        contractor_compensation = 0
       WHERE id = $5`,
      [reason, hoursBeforePickup, contractorPenalty, availableBudget, orderId]
    );
    
    await client.query('COMMIT');
    
    return {
      success: true,
      orderId,
      contractorPenalty,
      availableBudget,
      hoursBeforePickup,
      penaltyPercentage: penaltyPercentage * 100,
      message: `Auftrag wurde storniert. Strafe: €${contractorPenalty.toFixed(2)}, Budget: €${availableBudget.toFixed(2)}`
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Fehler bei Auftragnehmer-Stornierung:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Stornierung durch Kunden
 * 
 * Logik:
 * 1. Berechne Gebühr laut AGB §7.1
 * 2. Auftragnehmer bekommt Entschädigung (85% der Gebühr)
 * 3. Plattform behält 15%
 * 4. Status auf 'completed'
 */
async function cancelByCustomer(orderId, reason = 'Kunde hat storniert') {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Hole Auftrag
    const orderResult = await client.query(
      `SELECT id, price, contractor_id, pickup_date, pickup_time, status
       FROM orders WHERE id = $1`,
      [orderId]
    );
    
    if (orderResult.rows.length === 0) {
      throw new Error('Auftrag nicht gefunden');
    }
    
    const order = orderResult.rows[0];
    
    if (order.status === 'completed') {
      throw new Error('Auftrag bereits abgeschlossen');
    }
    
    // Berechne Stunden bis Abholung
    const hoursBeforePickup = calculateHoursUntilPickup(order.pickup_date, order.pickup_time);
    
    // Berechne Stornierungsgebühr laut AGB §7.1
    const cancellationFee = calculateCancellationFee(order.price, hoursBeforePickup);
    
    // Auftragnehmer-Entschädigung (85% der Gebühr, wenn Auftragnehmer zugewiesen)
    const contractorCompensation = order.contractor_id ? cancellationFee * 0.85 : 0;
    
    // Plattform behält 15%
    const platformProfit = cancellationFee - contractorCompensation;
    
    console.log('📊 Kunden-Stornierung:');
    console.log('   Auftragswert:', order.price);
    console.log('   Stunden bis Abholung:', hoursBeforePickup.toFixed(2));
    console.log('   Stornierungsgebühr:', cancellationFee);
    console.log('   AN-Entschädigung:', contractorCompensation);
    console.log('   Plattform-Gewinn:', platformProfit);
    
    // Update Auftrag
    await client.query(
      `UPDATE orders SET
        status = 'completed',
        cancellation_status = 'cancelled_by_customer',
        cancelled_by = 'customer',
        cancellation_timestamp = NOW(),
        cancellation_reason = $1,
        hours_before_pickup = $2,
        customer_cancellation_fee = $3,
        contractor_compensation = $4,
        platform_profit_from_cancellation = $5,
        contractor_penalty = 0,
        available_budget = 0
       WHERE id = $6`,
      [reason, hoursBeforePickup, cancellationFee, contractorCompensation, platformProfit, orderId]
    );
    
    await client.query('COMMIT');
    
    return {
      success: true,
      orderId,
      cancellationFee,
      contractorCompensation,
      platformProfit,
      hoursBeforePickup,
      message: `Auftrag wurde storniert. Gebühr: €${cancellationFee.toFixed(2)}`
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Fehler bei Kunden-Stornierung:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Preis für Neuvermittlung anpassen (nach Auftragnehmer-Stornierung)
 * 
 * Admin kann Preis erhöhen um Auftrag attraktiver zu machen
 */
async function adjustContractorPrice(orderId, newPrice) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Hole Auftrag
    const orderResult = await client.query(
      `SELECT id, price, available_budget, cancellation_status
       FROM orders WHERE id = $1`,
      [orderId]
    );
    
    if (orderResult.rows.length === 0) {
      throw new Error('Auftrag nicht gefunden');
    }
    
    const order = orderResult.rows[0];
    
    if (order.cancellation_status !== 'cancelled_by_contractor') {
      throw new Error('Nur nach Auftragnehmer-Stornierung möglich');
    }
    
    if (newPrice > order.available_budget) {
      throw new Error(`Neuer Preis (€${newPrice}) überschreitet Budget (€${order.available_budget})`);
    }
    
    // Berechne Plattform-Gewinn
    const platformProfit = order.available_budget - newPrice;
    
    console.log('💰 Preis-Anpassung:');
    console.log('   Verfügbares Budget:', order.available_budget);
    console.log('   Neuer AN-Preis:', newPrice);
    console.log('   Plattform-Gewinn:', platformProfit);
    console.log('   Kunde zahlt:', order.price, '(unverändert)');
    
    // Update Auftrag
    await client.query(
      `UPDATE orders SET
        adjusted_contractor_price = $1,
        platform_profit_from_cancellation = $2
       WHERE id = $3`,
      [newPrice, platformProfit, orderId]
    );
    
    await client.query('COMMIT');
    
    return {
      success: true,
      orderId,
      newPrice,
      platformProfit,
      customerPrice: order.price,
      message: `Preis angepasst auf €${newPrice}. Plattform-Gewinn: €${platformProfit.toFixed(2)}`
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Fehler bei Preis-Anpassung:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Berechne Vorschau der Stornierungsgebühr
 */
async function calculateCancellationPreview(orderId) {
  const orderResult = await pool.query(
    `SELECT price, pickup_date, pickup_time, contractor_id
     FROM orders WHERE id = $1`,
    [orderId]
  );
  
  if (orderResult.rows.length === 0) {
    throw new Error('Auftrag nicht gefunden');
  }
  
  const order = orderResult.rows[0];
  const hoursBeforePickup = calculateHoursUntilPickup(order.pickup_date, order.pickup_time);
  const cancellationFee = calculateCancellationFee(order.price, hoursBeforePickup);
  
  let feePercentage = 0;
  if (hoursBeforePickup < 2) feePercentage = 100;
  else if (hoursBeforePickup < 12) feePercentage = 75;
  else if (hoursBeforePickup < 24) feePercentage = 50;
  
  return {
    orderPrice: order.price,
    hoursBeforePickup: hoursBeforePickup.toFixed(2),
    cancellationFee,
    feePercentage,
    isFree: hoursBeforePickup >= 24
  };
}

module.exports = {
  cancelByContractor,
  cancelByCustomer,
  adjustContractorPrice,
  calculateCancellationPreview,
  calculateHoursUntilPickup,
  calculateCancellationFee
};
