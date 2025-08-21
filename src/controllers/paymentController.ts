//imports
import {Database} from 'sqlite';
import { Request, Response } from 'express';
// import { processPaymentWebhook } from '../dao/paymentModel';
// import { enqueue } from '../queue';
import {producer} from "../utils/kafka"

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

        // //if no issue, send 200 to sender
        // res.status(200).send('Webhook received and queued for processing.');
        // // Asynchronous processing using a transaction
        // (async () => {

        //     let result = await processPaymentWebhook(db, req.body);
        //     console.log("after webhook process: ", result);

        //     if(result != "success") {
        //         console.error(`Failed to process webhook. Error:`);
        //     }
        // })();

        // Enqueue the job and return immediately
        // enqueue(req.body);
        

        try{
            // Ack-ing the webhook
            res.status(200)
            res.json({
                details: 'Webhook received and queued for processing.'
            });
            console.log('Webhook received and queued for processing.');
            
            //kafka
            await producer.connect();
            
            await producer.send({
                topic: 'payment-webhook',
                messages: [
                    {
                        key: payment.payment_id,
                        value: JSON.stringify(payment)
                    }
                ]
            });
            await producer.disconnect();

            console.log("Webhook sent to Kafka topic 'payment-webhook' for payment_id:", payment.payment_id);
        }
        catch(err){
            console.error("Error sending webhook to Kafka topic 'payment-webhook'.");
            res.status(500)
            .json({
                error: err
            });
            return;
        }
    }

    catch(err){
        console.error("Error creating order:", err);
        res.status(500);
        res.json({
            error: "Internal server error while creating order."
        });
    }
}