import { Database } from 'sqlite';

export async function createOrder(db: Database, order: any) {

    let insertQuery = `
        INSERT INTO orders (id, user_id, items, total_amount, created_at, updated_at) 
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    await db.run(
        insertQuery,
        [
            order.id, 
            order.user_id, 
            JSON.stringify(order.items), 
            order.total_amount
        ]
    );
};

export async function getOrder(db: Database, order: any) {
    //check order id already exist or not
    const order_id = await db.get(`SELECT * FROM orders WHERE id = ?`, [order.id]);
    if (order_id) {
        console.error("Order_id already exist:", order.id);
        throw new Error("Order ID already exists");
    }
}
