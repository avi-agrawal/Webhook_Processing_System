import {Kafka} from 'kafkajs';

const kafka = new Kafka({
    clientId: 'webhook-processing-system',
    brokers: ['localhost:9092'] 
});

const producer = kafka.producer();
const consumer = kafka.consumer({
    groupId: 'webhook-processing-group'
})

export {
    producer,
    consumer
}