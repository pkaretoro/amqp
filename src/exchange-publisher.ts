import {AmqpConnection} from "./connection";

export class AmqpExchangePublisher {
	private connection: AmqpConnection;
	
	constructor(amqpConnection: AmqpConnection) {
		this.connection = amqpConnection;
	}
	
	async publish(message: any) {
		//todo implement
	}
}
