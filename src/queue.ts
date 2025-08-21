import { EventEmitter } from 'events';

// Using EventEmitter to signal when a new job is added to the queue
const queueEmitter = new EventEmitter();
const webhookQueue: any[] = [];

export function enqueue(job: any) {
    webhookQueue.push(job);
    console.log("webhookQueue: ",webhookQueue)
    queueEmitter.emit('newJob');
}

export function dequeue() {
    return webhookQueue.shift();
}

export function onNewJob(callback: () => void) {
    queueEmitter.on('newJob', callback);
}