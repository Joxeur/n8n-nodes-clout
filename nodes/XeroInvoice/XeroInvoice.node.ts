import type { IExecuteFunctions } from 'n8n-core';

/*import {
	LoggerProxy as Logger
} from 'n8n-workflow';*/

import type {
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import {NodeUtils} from './node.utils';
import {ReportEntry} from './service/models';

export class XeroInvoice implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Xero Invoice',
		name: 'xeroInvoiceClout',
		icon: 'file:xero.svg',
		group: ['output'],
		version: 1,
		subtitle: 'Create or update an invoice',
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
				noDataExpression: true,
				typeOptions: {
					loadOptionsMethod: 'getTenants',
				},
				default: '',
				required: true,
			},
			{
				displayName: 'Branding Theme',
				name: 'brandingTheme',
				type: 'options',
				noDataExpression: true,
				typeOptions: {
					loadOptionsDependsOn: ['tenantId'],
					loadOptionsMethod: 'getBrandingThemes',
				},
				default: '',
				required: false,
			},
			{
				displayName: 'Property Name',
				name: 'dataPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				description: 'Name of the binary property of the attachment',
			},
		],
	};

	methods = {
		loadOptions: {
			// Get all the tenants to display them to user so that he can
			// select them easily
			async getTenants(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('xeroAuthApi');

				console.log("getTenants", credentials);

				const xeroService = await NodeUtils.buildXeroService(credentials);

				const tenants = await xeroService.getTenants();

				console.log("tenants", tenants);

				return NodeUtils.toPropertyOptions(tenants, (tenant) => tenant.tenantName, (tenant) => tenant.tenantId);
			},
			async getBrandingThemes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const tenantId = this.getCurrentNodeParameter('tenantId') as string;

				if (!tenantId) {
					return [];
				}

				const credentials = await this.getCredentials('xeroAuthApi');

				const xeroService = await NodeUtils.buildXeroService(credentials, tenantId);

				const themes = await xeroService.getBrandingThemes();

				return NodeUtils.toPropertyOptions(themes, (theme) => theme.name!, (theme) => theme.brandingThemeID!);
			}
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const length = items.length;
		let responseData;
		for (let i = 0; i < length; i++) {
			try {
				const tenantId = this.getNodeParameter('tenantId', i) as string;
				const dataPropertyName = this.getNodeParameter('dataPropertyName', i) as string;
				const brandingTheme = this.getNodeParameter('brandingTheme', i) as string;

				const credentials = await this.getCredentials('xeroAuthApi', i);

				const xeroService = await NodeUtils.buildXeroService(credentials, tenantId);

				const report = items[i].json as unknown as ReportEntry;
				responseData = {
					...(await xeroService.process({brandingTheme, report}, await NodeUtils.getBuffer.call(this, items[i], i, dataPropertyName)))
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