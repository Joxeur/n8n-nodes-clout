import {TokenSetParameters} from 'openid-client';
import {NodeService} from './service/node.service';
import {INodeExecutionData, INodePropertyOptions, NodeOperationError} from 'n8n-workflow';
import {IExecuteFunctions} from 'n8n-core';
import {XeroSecurityConfig} from './service/models';

export class NodeUtils {

	static toXeroTokenSet(credentials: any): TokenSetParameters {
		return {
			access_token: credentials.oauthTokenData.access_token,
			token_type: credentials.oauthTokenData.token_type,
			refresh_token: credentials.oauthTokenData.refresh_token,
			scope: credentials.oauthTokenData.scope
		}
	}

	static toXeroConfig(credentials: any): XeroSecurityConfig {
		return {
			clientId: credentials.clientId,
			clientSecret: credentials.clientSecret,
			grantType: credentials.grantType,
			scopes: credentials.scope.split(/\s+/)
		};
	}

	static async buildXeroService(credentials: any, tenantId?: string): Promise<NodeService> {
		const xeroConfig = NodeUtils.toXeroConfig(credentials);
		const xeroTokenSet = NodeUtils.toXeroTokenSet(credentials);

		return new NodeService(xeroConfig, xeroTokenSet, tenantId);
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
