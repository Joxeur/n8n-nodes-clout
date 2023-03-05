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

export class XeroConfig implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Xero Config',
		name: 'xeroClout',
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
				noDataExpression: true,
				typeOptions: {
					loadOptionsMethod: 'getTenants',
				},
				default: '',
				required: true,
			},
			{
				displayName: 'Set Branding Theme',
				name: 'setBrandingTheme',
				type: 'boolean',
				default: false,
				noDataExpression: true
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
				displayOptions: {
					show: {
						setBrandingTheme: [true],
					},
				},
				default: '',
				required: false,
			},
			{
				displayName: 'Set Tax Rate',
				name: 'setTaxRate',
				type: 'boolean',
				default: false,
				noDataExpression: true
			},
			{
				displayName: 'Tax Rate',
				name: 'taxRate',
				type: 'options',
				noDataExpression: true,
				typeOptions: {
					loadOptionsDependsOn: ['tenantId'],
					loadOptionsMethod: 'getTaxRates',
				},
				displayOptions: {
					show: {
						setTaxRate: [true],
					},
				},
				default: '',
				required: false,
			},
			{
				displayName: 'Set Account Code',
				name: 'setAccountCode',
				type: 'boolean',
				default: false,
				noDataExpression: true
			},
			{
				displayName: 'Account Code',
				name: 'accountCode',
				type: 'options',
				noDataExpression: true,
				typeOptions: {
					loadOptionsDependsOn: ['tenantId'],
					loadOptionsMethod: 'getAccountCodes',
				},
				displayOptions: {
					show: {
						setAccountCode: [true],
					},
				},
				default: '',
				required: false,
			},
			{
				displayName: 'Set Currency',
				name: 'setCurrency',
				type: 'boolean',
				default: false,
				noDataExpression: true
			},
			{
				displayName: 'Account Code',
				name: 'currency',
				type: 'options',
				noDataExpression: true,
				typeOptions: {
					loadOptionsDependsOn: ['tenantId'],
					loadOptionsMethod: 'getCurrencies',
				},
				displayOptions: {
					show: {
						setCurrency: [true],
					},
				},
				default: '',
				required: false,
			}
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
			async getBrandingThemes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const tenantId = this.getCurrentNodeParameter('tenantId');
				const returnData: INodePropertyOptions[] = [];
				const { BrandingThemes: themes } = await xeroApiRequest.call(
					this,
					'GET',
					'/BrandingThemes',
					{tenantId},
				);
				for (const theme of themes) {
					returnData.push({
						name: theme.Name,
						value: theme.BrandingThemeID,
					});
				}
				return returnData;
			},
			async getTaxRates(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const tenantId = this.getCurrentNodeParameter('tenantId');
				const returnData: INodePropertyOptions[] = [];
				const { TaxRates: taxRates } = await xeroApiRequest.call(
					this,
					'GET',
					'/TaxRates',
					{tenantId},
				);
				for (const taxRate of taxRates) {
					returnData.push({
						name: `${taxRate.Name} (${taxRate.TaxType})`,
						value: taxRate.TaxType,
					});
				}
				return returnData;
			},
			async getAccountCodes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const tenantId = this.getCurrentNodeParameter('tenantId');
				const returnData: INodePropertyOptions[] = [];
				const { Accounts: accounts } = await xeroApiRequest.call(this, 'GET', '/Accounts', {
					tenantId,
				});
				for (const account of accounts) {
					returnData.push({
						name: `${account.Name} (${account.Code})`,
						value: account.Code,
					});
				}
				return returnData;
			},
			async getCurrencies(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const tenantId = this.getCurrentNodeParameter('tenantId');
				const returnData: INodePropertyOptions[] = [];
				const { Currencies: currencies } = await xeroApiRequest.call(this, 'GET', '/Currencies', {
					tenantId,
				});
				for (const currency of currencies) {
					returnData.push({
						name: currency.Description,
						value: currency.Code,
					});
				}
				return returnData;
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
				responseData = {
					tenantId: this.getNodeParameter('tenantId', i) as string,
					brandingTheme: this.getNodeParameter('brandingTheme', i, '') as string,
					taxRate: this.getNodeParameter('taxRate', i, '') as string,
					accountCode: this.getNodeParameter('accountCode', i, '') as string,
					currency: this.getNodeParameter('currency', i, '') as string,
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
