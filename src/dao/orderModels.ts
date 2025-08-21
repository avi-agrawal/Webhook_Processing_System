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
}