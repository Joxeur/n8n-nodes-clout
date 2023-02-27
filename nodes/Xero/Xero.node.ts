import type { IExecuteFunctions } from 'n8n-core';

import type {
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';

import { xeroApiRequest } from './GenericFunctions';

export class Xero implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Xero',
		name: 'xero',
		icon: 'file:xero.svg',
		group: ['output'],
		version: 1,
		subtitle: 'Get Tenant ID',
		description: 'Consume Xero API',
		defaults: {
			name: 'Xero',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'xeroAuthApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Tenant ID',
				name: 'tenantId',
				type: 'options',
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
				typeOptions: {
					loadOptionsMethod: 'getTenants',
				},
				default: '',
				required: true,
			},
		],
	};

	methods = {
		loadOptions: {
			// Get all the tenants to display them to user so that he can
			// select them easily
			async getTenants(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const returnData: INodePropertyOptions[] = [];
				const tenants = await xeroApiRequest.call(
					this,
					'GET',
					'',
					{},
					{},
					'https://api.xero.com/connections',
				);
				for (const tenant of tenants) {
					const tenantName = tenant.tenantName;
					const tenantId = tenant.tenantId;
					returnData.push({
						name: tenantName,
						value: tenantId,
					});
				}
				return returnData;
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const length = items.length;
		let responseData;
		for (let i = 0; i < length; i++) {
			try {
				responseData = {
					tenantId: this.getNodeParameter('tenantId', i) as string
				};

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData),
					{ itemData: { item: i } },
				);
				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as JsonObject).message } });
					continue;
				}
				throw error;
			}
		}
		return this.prepareOutputData(returnData);
	}
}
