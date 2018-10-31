const DEFAULT_RECONNECT_TIMEOUT = 1000;
const DEFAULT_CONSUMER_PROCESSING_ATTEMPTS = 5;

export class AmqpConnectionConfig {
	constructor(public url: string, public socketOptions?: any, public reconnectEnabled: boolean = true,
	            public reconnectTimeout: number = DEFAULT_RECONNECT_TIMEOUT) {
	}
}

export class QueueConfig {
	constructor(
		public name: string,
		public consume: boolean) {
	}
}

export class AmqpConsumerConfig {
	constructor(
		public processingAttempts: number = DEFAULT_CONSUMER_PROCESSING_ATTEMPTS,
		public queuesConfig: QueueConfig[]) {
	}
}

export class AmqpQueuePublisherConfig {
	constructor(
		public queueConfig: QueueConfig) {
	}
}
