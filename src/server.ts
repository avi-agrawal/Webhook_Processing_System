//imports
import express from 'express';
import bodyParser from 'body-parser';
import { Database } from 'sqlite';
import { setupDatabase } from './models/database'
import { getRoutes } from './routes';

export const app = express();

let db: Database;
app.use(bodyParser.json());

//constants
const PORT = 8080;

// controllers
import { createOrderController } from "./controllers/orderController"


// routes
app.get("/", (req, res) => {
    console.log("Received a GET request on /");
    res.status(200).send("Webhook Processor server is running.....")
})


setupDatabase().then(database => {
        db = database;
        app.use('/api', getRoutes(db))
        console.log("Database setup completed successfully.");
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.log("Failed to setup database:", err);
    });