import * as _ from 'lodash';
import * as amqp from 'amqplib';
import {Channel, Connection} from 'amqplib';
import * as os from 'os';
import {EventEmitter} from 'events';

import * as appInfo from '../package.json';
import {AmqpConnectionConfig} from "./config";

const DEFAULT_CLIENT_PROPERTIES = {
	applicationName: (<any>appInfo).name,
	hostname: os.hostname(),
	product: (<any>appInfo).description,
	version: (<any>appInfo).version
};

export class AmqpConnection extends EventEmitter {
	private connectionString: string;
	private socketOptions: any;
	private reconnectEnabled: boolean;
	private reconnectTimeout: number;
	private name: string;
	private connection: Connection;
	private channel: Channel;
	
	constructor(config: AmqpConnectionConfig, name: string = '') {
		super();
		this.connectionString = config.url;
		this.socketOptions = {
			clientProperties: _.extend(DEFAULT_CLIENT_PROPERTIES, config.socketOptions)
		};
		this.reconnectEnabled = config.reconnectEnabled;
		this.reconnectTimeout = config.reconnectTimeout;
		this.name = name;
		this.connection = null;
		this.channel = null;
		
		this.connect = this.connect.bind(this);
		this.close = this.close.bind(this);
		this.getChannel = this.getChannel.bind(this);
	}
	
	async connect() {
		try {
			// open connection
			this.connection = await amqp.connect(this.connectionString, this.socketOptions);
			console.info(`[${this.name}] Connection to RabbitMQ is created [${this.connectionString}]`);
			
			// create channel
			await this.createChannel();
			
			console.info(`[${this.name}] Connection is ready`);
			this.emit('ready');
			
			this.connection.on('close', async () => {
				if (this.reconnectEnabled) {
					await this.reconnect();
					console.warn(`[${this.name}] Successful reconnected`);
				} else {
					console.warn('Reconnect is disabled by config');
				}
			});
			
			this.connection.on('error', async (err) => {
				console.error(`[${this.name}] Connection error`, err);
			});
		} catch (err) {
			console.error(`[${this.name}] Creating connection to Rabbit MQ error`, err);
			await this.reconnect();
		}
	}
	
	/**
	 * Creates new channel
	 */
	private async createChannel() {
		console.info('Creaing channel to RabbitMQ...');
		this.channel = await this.connection.createChannel();
		
		this.channel.on('close', async () => {
			console.info('Channel was closed.');
		});
		
		this.channel.on('error', (err) => {
			console.error('Channel on error', err);
		});
		
		console.info('Channel to RabbitMQ is created');
	}
	
	private async reconnect() {
		console.info(`Try to reconnect to Rabbit MQ in ${this.reconnectTimeout} ms`);
		await new Promise((resolve) => {
			setTimeout(resolve, this.reconnectTimeout);
		});
		await this.connect();
	}
	
	async close() {
		if (!this.connection) {
			return;
		}
		
		await this.connection.close();
		console.info(`[${this.name}] Connection was closed`);
	}
	
	getChannel() {
		return this.channel;
	}
}
