//imports
import {Database} from 'sqlite';
import { Request, Response } from 'express';
import { createOrder, getOrder } from '../dao/orderModels';

/**
 * Function to create a new order
 * @param req 
 * @param res 
 */
export const createOrderController = (db : Database) => async(req : Request, res: Response) => {
    console.log("Received a request to create an order:", req.body);
    try{
        const order = req.body;

        //validate
        if(!order.id || !order.user_id || !order.items || !order.total_amount){
            res.status(400);
            res.json("Missing required fields in the request body.");
            console.log("Error: Missing required fields in the request body.");
            return;
        }

        //check order id already exist or not
        await getOrder(db, order);

        //if no issue, create the order
        await createOrder(db, order);

        res.status(201)
        res.json({
            details: "Order created successfully."
        });
        console.log("Order created successfully with order id:", order.id);
    }

    catch(err){
        console.error("Error creating order:", err);
        res.status(500);
        res.json({
            error: "Internal server error while creating order."
        });
    }
}