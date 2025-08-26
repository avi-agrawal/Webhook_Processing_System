# Webhook_Processing_System
High-performance Scalable Webhook Processing System

This document provides a comprehensive overview of the design, implementation, and performance analysis of a high-performance webhook processing system. The architecture is designed to handle thousands of payment events per minute, ensuring resilience, consistency, and maximum throughput.

***

### Architectural Decisions and Trade-offs

The core architectural decision was to adopt a **decoupled, asynchronous system** using a message queue. This pattern separates the act of receiving a webhook from the processing of its data, a critical choice for high-volume systems.

**Architectural Pattern: Server-Worker with Kafka**

* **Decision**: The system is split into two main components: a lightweight Express server and a dedicated worker process. These two communicate via **Kafka**, a robust distributed message broker.
* **Trade-offs**: This approach adds initial complexity compared to a monolithic design. However, this is a conscious trade-off for a system that must handle high load without a single point of failure.

***

### Performance Optimization

The primary optimization for throughput is the **decoupling of webhook reception from processing**.

* **Low-Latency Acknowledgment**: The Express server's sole responsibility is to receive the webhook payload and immediately publish it to a Kafka topic. This is a very fast, non-blocking I/O operation. The server can respond with a `200 OK` instantly, minimizing latency for the client and allowing it to handle a high volume of concurrent requests.
* **Asynchronous Processing**: The intensive database updates are handled by the worker process, which consumes messages from Kafka at its own pace. This prevents a slow database from becoming a bottleneck that would otherwise block the main server and lead to request timeouts.

***

### Reliability and Consistency Strategies

The system is built to be robust, ensuring data integrity and preventing lost events.

* **Idempotency**: The webhook processor checks for duplicate events by querying the database for a `payment_id` that is already marked as `success`. This prevents processing a webhook more than once and avoids unintended side effects.
* **Atomic Operations**: All database updates for a single event (e.g., updating both the `payments` and `orders` tables) are wrapped in a **database transaction**. This guarantees that both operations either succeed or fail together, ensuring a consistent state.
* **Guaranteed Delivery**: Kafka's persistence model ensures messages are not lost, even if a consumer fails. The worker process uses **manual offset commits**, which means it only commits a message's offset after it has been fully and successfully processed. If the worker crashes mid-process, the message will be re-delivered upon restart.
* **Exponential Backoff**: If a database operation fails, the worker attempts to retry the operation with an exponentially increasing delay. This prevents a stampede of retries from overwhelming a temporarily struggling database.

***

### Instructions to Run and Test the System

#### Prerequisites
* Node.js (v18 or higher)
* Docker and Docker Compose
* A running Kafka broker instance
* sqlite3 command-line tool (for direct database inspection)

#### Step 1: Clone the Repository and Install Dependencies
Navigate to your project's root directory and install the required packages.
```bash
git clone <repository_url>
cd <project_directory>

npm install
```

#### Step 2: Start the Kafka Cluster and Database
Start the Kafka broker, ZooKeeper, and a simple UI (KafkaDrop) using Docker Compose. A `docker-compose.yml` file is provided for this purpose.
```bash
docker-compose up -d
```

You can monitor the Kafka cluster's status by navigating to the Kafdrop web UI at :
`http://localhost:9000`


#### Step 3: Start the Server and Worker
Open two separate terminal windows. When you run the server for the first time, the `db.sqlite` database file will be created.

##### Terminal 1 (Start the Worker):
```bash
npm run start
```

##### Terminal 2 (Start the Server):
```bash
npm run worker
```

#### Step 4: Test the System
Use `curl` to simulate webhook events.

1. Create a test order:
```bash
curl --location 'localhost:8080/api/orders/v1' \
--header 'Content-Type: application/json' \
--data '{
    "id": "1234",
    "user_id": "avi_123",
    "items": ["pen"],
    "total_amount": 500
}'
```

2. Send a `payment.success` webhook:

```bash
curl --location 'http://localhost:8080/api/webhooks/payment/v1' \
--header 'Content-Type: application/json' \
--data '{
  "event_type": "payment.success",
  "payment_id": "pay_1234",
  "order_id": "1234",
  "amount": 500,
  "currency": "INR",
  "user_id": "avi_123",
  "timestamp": "2025-08-25T11:00:00Z"
}'
```

You'll get an immediate `200 OK` from the server. The processing will be handled by the worker in the background, which will update the database.


#### Step 5: Inspect the Database
If you have the sqlite3 command-line tool installed, you can inspect the database directly to confirm the records were updated.

```bash

# Start sqlite3 db CLI
sqlite3

# Open the database db.sqlite file
.open db.sqlite

# Check tables
.tables

# Run SQL queries
SELECT * FROM orders;
SELECT * FROM payments;

# Exit the sqlite3 prompt
.exit
```

***

### Performance Analysis: Bottlenecks and Scaling Approaches

#### Potential Bottlenecks

* **Database Contention**: The SQLite database can be a bottleneck. For a high-concurrency production environment, a database like PostgreSQL would be better suited to handle parallel transactions.

* **Worker Throughput**: A single worker process might not be able to keep up with the rate of incoming messages, causing the Kafka topic to back up.

#### Scaling Approaches

* **Database Scaling**: To handle higher loads, the SQLite database should be replaced with a scalable, high-concurrency database like PostgreSQL or a distributed database.

* **Worker Scaling**: The worker processes can be scaled horizontally. By running multiple instances of `worker.ts` as part of the same consumer group, the workload is automatically distributed by Kafka, increasing the system's processing capacity.

* **Topic Partitioning**: For extremely high-volume scenarios, the Kafka topic can be partitioned to allow for even greater parallelism.
