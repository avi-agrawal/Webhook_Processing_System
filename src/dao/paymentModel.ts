import { Database } from 'sqlite';

export async function processPaymentWebhook(db: Database, payment: any) {
    const { payment_id, order_id } = payment;

    //first checking payment id already exist or not
    let check_payment_query = `SELECT id FROM payments WHERE id = ?`;
    const existing_payment_id = await db.get(check_payment_query, payment_id);
    console.log("existing_payment_id: ", existing_payment_id)

    if (existing_payment_id) {
        console.log(`Duplicate webhook for payment_id: ${existing_payment_id}. Skipping update.`);
        return;
    }

    //check order id already exist or not
    const order = await db.get(`SELECT * FROM orders WHERE id = ?`, [payment.order_id]);
    if (!order) {
        console.error("Order not found:", payment.order_id);
        return;
    }

    // Insert payment
    let insert_payment_query = `INSERT INTO payments (id, order_id, amount, currency, status, payment_method, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    await db.run(
    insert_payment_query,
    [payment.payment_id, payment.order_id, payment.amount, payment.currency, "success", payment.payment_method]
    );

    //update order
    let update_order_query = `UPDATE orders SET payment_status = ?, order_status=?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    await db.run(
        update_order_query,
        ['completed', "confirmed", order_id]
    );
}