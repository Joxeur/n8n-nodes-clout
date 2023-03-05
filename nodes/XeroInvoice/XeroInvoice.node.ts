import type { IExecuteFunctions } from 'n8n-core';

import type {
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import {NodeUtils} from './node.utils';
import {ReportEntry} from './src/model/models';

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
		outputs: ['main', 'main'],
		outputNames: ['data', 'error'],
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
				const tenants = await NodeUtils.getTenants(this);

				return NodeUtils.toPropertyOptions(tenants, (tenant) => tenant.tenantName, (tenant) => tenant.tenantId);
			},
			async getBrandingThemes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const tenantId = this.getCurrentNodeParameter('tenantId') as string;

				if (!tenantId) {
					return [];
				}

				const xeroService = await NodeUtils.buildNodeService(this, tenantId);

				const themes = await xeroService.getBrandingThemes();

				return NodeUtils.toPropertyOptions(themes, (theme) => theme.name!, (theme) => theme.brandingThemeID!);
			}
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[][] = [[], []];
		const length = items.length;
		let responseData;
		for (let i = 0; i < length; i++) {
			try {
				const tenantId = this.getNodeParameter('tenantId', i) as string;
				const dataPropertyName = this.getNodeParameter('dataPropertyName', i) as string;
				const brandingTheme = this.getNodeParameter('brandingTheme', i) as string;

				const xeroService = await NodeUtils.buildNodeService(this, tenantId);

				const report = items[i].json as unknown as ReportEntry;
				responseData = {
					...(await xeroService.process({brandingTheme, report}, await NodeUtils.getBuffer.call(this, items[i], i, dataPropertyName)))
				};

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData),
					{ itemData: { item: i } },
				);
				returnData[0].push(...executionData);
			} catch (error) {
				returnData[1].push({ json: { error: (error as JsonObject).message } });
				console.error("Unhandled error: ", error);
			}
		}
		return returnData;
	}
}
