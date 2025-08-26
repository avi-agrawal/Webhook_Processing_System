import { setupDatabase } from './models/database';
import { processPaymentWebhook } from './dao/paymentModel';
import {consumer} from "./utils/kafka"
import { resolve } from 'path';

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
            if(!message.value){
                console.warn(`Received a message with no value on topic ${topic}, partition ${partition}. Skipping...`);
                return;
            }
            let payment;
            try {
                // console.log("message: ", message);
                payment = JSON.parse(message.value.toString());
                console.info("Processing message from Kafka for payment:" ,payment);

                //retry processing the job
                const maxRetry = 5;
                let retryCount = 0;
                let processed = false;

                while(retryCount < maxRetry && !processed){
                    try{
                        const result = await processPaymentWebhook(db, payment);
                        if(result=== 'success'){
                            processed = true;
                            console.log(`Job processed successfully for payment_id: ${payment.payment_id}`);
                        }
                    }
                    catch(err){
                        retryCount++;
                        console.error(`Error processing job for payment_id: ${payment.payment_id}. Retry attempt ${retryCount}. Error:`, err);
                        if(retryCount < maxRetry){
                            //wait for some time before retrying
                            // Exponential backoff
                            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000)); 
                        }
                    }
                }

                if(processed){
                    //manually commiting the offset
                    await consumer.commitOffsets([
                        { topic, partition, offset: (Number(message.offset) + 1).toString() }
                    ]);
                }
                else{
                    console.error(`Failed to process message for payment_id: ${payment.payment_id} after ${maxRetry} retries. It will not be re-processed.`);
                }

            } 
            catch (error) {
                console.error("Error processing Kafka message. Message will be re-processed. Error:", error);
            }
        },

        autoCommit: false
    });

    console.info('Kafka consumer is running and listening for messages...');
}

startWorker().catch(err => {
    console.error('Worker failed to start:', err);
});