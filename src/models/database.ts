import sqlite3 from 'sqlite3';
import {open} from 'sqlite';

export async function setupDatabase(){
    console.log("Setting up database...");
    const db= await open({
        filename: './db.sqlite',
        driver: sqlite3.Database
    });

    // Orders table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS orders (
            id VARCHAR PRIMARY KEY,
            user_id VARCHAR NOT NULL,
            items JSON,
            total_amount INTEGER,
            payment_status VARCHAR DEFAULT 'pending',
            order_status VARCHAR DEFAULT 'created',
            created_at TIMESTAMP,
            updated_at TIMESTAMP
        );
    `);

    // Paymnet Table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS payments (
            id VARCHAR PRIMARY KEY,
            order_id VARCHAR NOT NULL,
            amount INTEGER,
            currency VARCHAR DEFAULT 'USD',
            status VARCHAR DEFAULT 'pending',
            payment_method VARCHAR,
            created_at TIMESTAMP,
            updated_at TIMESTAMP,
            FOREIGN KEY (order_id) REFERENCES orders(id)
            
        );
    `);

    console.log("Database schema initialized successfully.");
    return db;

}