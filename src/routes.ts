import { Router } from 'express';
import { createOrderController } from "./controllers/orderController"
import { paymentController } from "./controllers/paymentController"
import { Database } from 'sqlite';


export function getRoutes(db: Database) {
    const router = Router();
    router.post('/orders/v1', createOrderController(db));
    router.post('/webhooks/payment/v1', paymentController(db));
    return router;
}