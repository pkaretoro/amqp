import 'jest';
import * as fs from 'fs';
import * as path from 'path';
import {AmqpConnection} from "../src/connection";
import {AmqpConnectionConfig} from "../src/config";

describe("AMQP Connection integration test", () => {
	
	const configFilePath = path.resolve(__dirname, 'config-test.json');
	const configContent = fs.readFileSync(configFilePath).toString();
	const config = JSON.parse(configContent);
	
	test('Should create AMQP connection and close it successfully', async () => {
		//Given
		const amqpConnectionConfig = new AmqpConnectionConfig(config.url);
		const connectionName = 'TestConn';
		
		const amqpConnection = new AmqpConnection(amqpConnectionConfig, connectionName);
		
		//When
		await amqpConnection.connect();
		await amqpConnection.close();
	});
	
});
