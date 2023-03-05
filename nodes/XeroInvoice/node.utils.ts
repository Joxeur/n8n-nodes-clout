import {TokenSetParameters} from 'openid-client';
import {NodeService} from './service/node.service';
import {
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	JsonObject,
	NodeApiError,
	NodeOperationError
} from 'n8n-workflow';
import {IExecuteFunctions} from 'n8n-core';
import {XeroSecurityConfig} from './service/models';
import {RequestHandler} from './request.handler';
import {OptionsWithUri} from 'request';
import {RequestPromiseOptions} from 'request-promise-native';
import {IExecuteFunctions as IExecuteFunctionsBase} from 'n8n-workflow/dist/Interfaces';

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

	static buildNodeService(context: IExecuteFunctionsBase | ILoadOptionsFunctions, tenantId?: string): NodeService {
		const requestHandler: RequestHandler = {
			perform(options: OptionsWithUri | RequestPromiseOptions): Promise<any> {
				return context.helpers.requestOAuth2.call(context, 'xeroAuthApi', options);
			},
			buildError(error: any): Error {
				return new NodeApiError(context.getNode(), error as JsonObject);;
			}
		}

		return new NodeService(requestHandler, tenantId);
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
