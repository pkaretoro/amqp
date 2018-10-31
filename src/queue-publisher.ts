import {AmqpConnection} from "./connection";
import {AmqpQueuePublisherConfig} from "./config";

export class AmqpQueuePublisher {
	private connection: AmqpConnection;
	private queuePublisherConfig: AmqpQueuePublisherConfig;
	
	constructor(amqpConnection: AmqpConnection, queueData: AmqpQueuePublisherConfig) {
		this.connection = amqpConnection;
		this.queuePublisherConfig = queueData;
	}
	
	async publish(message: any) {
		const preparedMessage = JSON.stringify(message);
		const channelOptions = {
			contentType: 'text/plain',
			contentEncoding: 'utf-8',
			deliveryMode: 2, //message should be stored to disk
			timestamp: Date.now()
		};
		console.debug(`Start publish message to queue [${this.queuePublisherConfig.queueConfig.name}] --- message [${preparedMessage}]`);
		this.connection.getChannel().sendToQueue(this.queuePublisherConfig.queueConfig.name, new Buffer(preparedMessage), channelOptions);
	}
}
