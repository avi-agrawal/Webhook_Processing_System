import { setupDatabase } from './models/database';
import { processPaymentWebhook } from './dao/paymentModel';
// import { dequeue, onNewJob } from './queue';
import {consumer} from "./utils/kafka"

async function startWorker() {
    const db = await setupDatabase();
    console.log('Worker process started. Connecting to Kafka...');

    await consumer.connect();
    await consumer.subscribe({
        topic: 'payment-webhook',
        fromBeginning: false
    })

    await consumer.run({
        eachMessage: async ({topic, partition, message}) => {
            try {
                console.log("message: ", message);
                const payment = JSON.parse(message.toString());
                console.info("Processing message from Kafka for payment_id:" ,payment);

                const result = await processPaymentWebhook(db, payment.value);
                if (result != "success") {
                    console.error(`Failed to process job for payment_id: ${payment.key}. Error: ${result}`);
                }

            } catch (error) {
                console.error("Error processing Kafka message. Error:", error);
            }
        }
    });

    console.info('Kafka consumer is running and listening for messages.');
}

startWorker().catch(err => {
    console.error('Worker failed to start:', err);
});