import {NodeService} from './service/node.service';
import {INodeExecutionData, INodePropertyOptions, NodeOperationError} from 'n8n-workflow';
import {IExecuteFunctions} from 'n8n-core';
import {OptionsWithUri} from 'request';
import {Tenant} from './service/models';

const AUTH_EXPIRATION_MARGIN = 30; // In seconds

export class NodeUtils {

	private static extractExp(access_token: string): number | undefined {
		const tokenBody = access_token.split('.')?.[1];
		if (tokenBody) {
			const tokenData = JSON.parse(new Buffer(tokenBody, 'base64').toString('ascii'));
			return tokenData.exp as number;
		}
		return undefined;
	}

	private static getToken(context: IExecuteFunctions): string | undefined {
		const credentials = await context.getCredentials('xeroAuthApi') as any;

		return credentials.oauthTokenData.access_token;
	}

	static async getTenants(context: IExecuteFunctions): Promise<Tenant[]> {
		const options: OptionsWithUri = {
			headers: {'Content-Type': 'application/json'},
			method: 'GET',
			uri: 'https://api.xero.com/connections',
			json: true,
		};
		const result = await context.helpers.requestOAuth2.call(context, 'xeroAuthApi', options);

		return result;
	}

	static async buildNodeService(context: IExecuteFunctions, tenantId: string): Promise<NodeService> {
		let access_token = this.getToken(context);

		// Refresh token if expired
		// Note: this is not very robust has the token may be only valid for a few ms, but n8n doesn't allow to force a refresh token
		if (!access_token || this.extractExp(access_token) ?? 0 < new Date().getTime()) {
			// Refresh token (Execute any request to let n8n do its stuff)
			await this.getTenants(context);

			access_token = this.getToken(context)!;
		}

		return new NodeService(access_token, tenantId);
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
