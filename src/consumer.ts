import * as _ from 'lodash';
import {AmqpConnection} from "./connection";
import {Channel} from "amqplib";
import {AmqpConsumerConfig} from "./config";

export class AmqpConsumer {
	private connection: AmqpConnection;
	private consumerConfig: AmqpConsumerConfig;
	private channel: Channel;
	private processor: any;
	
	constructor(amqpConnection: AmqpConnection, queueData: AmqpConsumerConfig, processor: any) {
		this.connection = amqpConnection;
		this.consumerConfig = queueData;
		this.processor = processor;
		this.channel = this.connection.getChannel();
		this.connection.on('ready', () => {
			this.channel = this.connection.getChannel();
		});
		this.startConsume = this.startConsume.bind(this);
		this.consume = this.consume.bind(this);
		this.process = this.process.bind(this);
	}
	
	async startConsume() {
		this.connection.on('ready', async () => {
			console.info('Reconnect event occurred: start re-listening queue again.');
			await this.consumeFromQueues(this.processor);
		});
		return await this.consumeFromQueues(this.processor);
	}
	
	/**
	 * Starts consuming messages and process them with given processor
	 *
	 * @param processor
	 * @returns {Promise<[any]>}
	 */
	private async consumeFromQueues (processor) {
		return Promise.all(_.map(this.consumerConfig.queuesConfig, async (queueData) => {
			if (!queueData.consume) {
				return;
			}
			
			console.info(`Start to consume ${queueData.name} queue`);
			return await this.channel.consume(queueData.name, this.consume);
		}));
	}
	
	private async consume (msg) {
		// Clients supporting consumer cancel notification will always be informed when a queue is deleted or becomes unavailable
		// If the consumer is cancelled by RabbitMQ, the message callback will be invoked with null
		// http://www.squaremobius.net/amqp.node/channel_api.html#channel_consume
		if (msg === null) {
			return;
		}
		
		let parsedContent;
		try {
			console.debug(`Consumer received message: ${msg.content.toString()}`);
			parsedContent = JSON.parse(msg.content);
		} catch (e) {
			console.error(`Error message parsing: ${e.message}`);
			// send message to backout queue
			return this.channel.nack(msg, false, false);
		}
		return await this.process(msg, parsedContent);
	}
	
	/**
	 * Processes a received message
	 *
	 * @param msg
	 * @param content
	 * @returns {Promise<*>}
	 */
	private async process(msg, content) {
		try {
			await this.processor(content);
			return await this.channel.ack(msg);
		} catch (err) {
			console.error('msg processing error', msg, err);
			return msg.fields.deliveryTag < this.consumerConfig.processingAttempts
				// send message back to queue
				? this.channel.nack(msg)
				// send message to backout queue
				: this.channel.nack(msg, false, false);
		}
	}
	
}
