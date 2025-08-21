//imports
import {Database} from 'sqlite';
import { Request, Response } from 'express';
import { processPaymentWebhook } from '../dao/paymentModel';

/**
 * Function to create a new order
 * @param req 
 * @param res 
 */
export const paymentController = (db : Database) => async(req : Request, res: Response) => {
    console.log("Received a webhook for payment:", req.body);
    try{
        const payment = req.body;

        //validate
        if(!payment.event_type || !payment.payment_id || !payment.order_id || !payment.amount || !payment.user_id){
            res.status(400);
            res.json("Missing required fields in the request body.");
            console.log("Error: Missing required fields in the request body.");
            return;
        }

        if(payment.event_type !== "payment.success"){
            console.log("Webhook received, but event type is not success");
            return res.status(200).send("Webhook received, but event type is not success");
        }

        //if no issue, create the order
        res.status(200).send('Webhook received and queued for processing.');
        // Asynchronous processing using a transaction
        (async () => {
            try {
                await db.run('BEGIN TRANSACTION;');
                await processPaymentWebhook(db, req.body);
                await db.run('COMMIT;');
                console.log(`Successfully processed webhook.`);
            } 
            catch (error) {
                await db.run('ROLLBACK;');
                console.error(`Failed to process webhook. Error:`, error);
            }
        })();
    }

    catch(err){
        console.error("Error creating order:", err);
        res.status(500);
        res.json({
            error: "Internal server error while creating order."
        });
    }
}