import {NodeService} from './service/node.service';
import {ILoadOptionsFunctions, INodeExecutionData, INodePropertyOptions, NodeOperationError} from 'n8n-workflow';
import {IExecuteFunctions} from 'n8n-core';
import {OptionsWithUri} from 'request';
import {Tenant} from './service/models';
import {TokenProvider} from './service/token.provider';

export class NodeUtils {

	private static async getToken(context: IExecuteFunctions | ILoadOptionsFunctions): Promise<string> {
		const credentials = await context.getCredentials('xeroAuthApi') as any;

		return credentials.oauthTokenData.access_token;
	}

	static async getTenants(context: IExecuteFunctions | ILoadOptionsFunctions): Promise<Tenant[]> {
		const options: OptionsWithUri = {
			headers: {'Content-Type': 'application/json'},
			method: 'GET',
			uri: 'https://api.xero.com/connections',
			json: true,
		};
		const result = await context.helpers.requestOAuth2.call(context, 'xeroAuthApi', options);
		return result;
	}

	static buildNodeService(context: IExecuteFunctions | ILoadOptionsFunctions, tenantId: string): NodeService {
		const tokenProvider: TokenProvider = {
			async getToken(): Promise<string> {
				return await NodeUtils.getToken(context);
			},
			async refresh(): Promise<string> {
				await NodeUtils.getTenants(context);
				return await NodeUtils.getToken(context);
			}
		};

		return new NodeService(tokenProvider, tenantId);
	}

	static toPropertyOptions<T>(items: T[], keyMap: (t: T) => string, valueMap: (t: T) => string | number): INodePropertyOptions[] {
		const returnData: INodePropertyOptions[] = [];
		for (const item of items) {
			returnData.push({
				name: keyMap(item),
				value: valueMap(item),
			});
		}
		return returnData;
	}

	static async getBuffer(this: IExecuteFunctions, item: INodeExecutionData, itemIndex: number, dataPropertyName: string): Promise<Buffer> {
		if (item.binary === undefined) {
			throw new NodeOperationError(
				this.getNode(),
				'No binary data set. So file can not be written!',
				{ itemIndex },
			);
		}
		const itemBinaryData = item.binary[dataPropertyName];
		if (itemBinaryData === undefined) {
			throw new NodeOperationError(
				this.getNode(),
				`The binary property "${dataPropertyName}" does not exist. So no file can be written!`,
				{ itemIndex },
			);
		}

		// return Buffer.from(itemBinaryData.data, BINARY_ENCODING);
		return await this.helpers.getBinaryDataBuffer(itemIndex, dataPropertyName);
	}

}

