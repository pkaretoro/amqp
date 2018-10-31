import 'jest';
import * as fs from 'fs';
import * as path from 'path';
import {AmqpConnection} from "../src/connection";
import {AmqpConnectionConfig, AmqpConsumerConfig, AmqpQueuePublisherConfig, QueueConfig} from "../src/config";
import {AmqpConsumer} from "../src/consumer";
import {AmqpQueuePublisher} from "../src/queue-publisher";

describe("AMQP Publisher-Consumer integration test", () => {
	
	const configFilePath = path.resolve(__dirname, 'config-test.json');
	const configContent = fs.readFileSync(configFilePath).toString();
	const config = JSON.parse(configContent);
	
	test('Should publish message to queue and consume it successfully', async () => {
		//Given
		let consumerAmqpConnection;
		let publisherAmqpConnection;
		const message = {
			content: 'test-content'
		};
		const consumedMessage = await new Promise(async (resolve) => {
			//definning message processor
			const amqpMessageProcessor = async (message) => {
				console.debug(`amqpMessageProcessor: ${JSON.stringify({message})}`);
				return resolve(message);
			};
			
			const amqpConnectionConfig = new AmqpConnectionConfig(config.url, {}, false);
			
			//create a consumer
			const consumerConnectionName = 'Consumer-Conn';
			consumerAmqpConnection = new AmqpConnection(amqpConnectionConfig, consumerConnectionName);
			const consumerConfig = config.consumers[0];
			const queuesConfig = consumerConfig.queues.map((queueData) => {
				return new QueueConfig(queueData.name, queueData.consume)
			});
			const amqpConsumerConfig = new AmqpConsumerConfig(consumerConfig.processingAttempts, queuesConfig);
			const consumer = new AmqpConsumer(consumerAmqpConnection, amqpConsumerConfig, amqpMessageProcessor);
			
			//create a publisher
			const publisherConnectionName = 'Publisher-Conn';
			publisherAmqpConnection = new AmqpConnection(amqpConnectionConfig, publisherConnectionName);
			const amqpQueuePublisherConfig = new AmqpQueuePublisherConfig(queuesConfig[0]);
			const publisher = new AmqpQueuePublisher(publisherAmqpConnection, amqpQueuePublisherConfig);
			
			//connect ro AMQP
			await consumerAmqpConnection.connect();
			await publisherAmqpConnection.connect();
			
			
			//When
			//start consuming messages
			await consumer.startConsume();
			//publish message
			await publisher.publish(message);
		});
		//Then
		expect(consumedMessage).toStrictEqual(message);
		
		//wait for a while the message will be acked
		await new Promise((resolve) => setTimeout(resolve, 100));
		//closing connections
		await consumerAmqpConnection.close();
		await publisherAmqpConnection.close();
	});
	
});
