import type { IExecuteFunctions } from 'n8n-core';

import type {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import {PDFExtract, PDFExtractOptions} from 'pdf.js-extract';

export class ReadPDF implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Read PDF',
		// eslint-disable-next-line n8n-nodes-base/node-class-description-name-miscased
		name: 'readPDFClout',
		icon: 'fa:file-pdf',
		group: ['input'],
		version: 1,
		description: 'Reads a PDF and extracts its content',
		defaults: {
			name: 'Read PDF',
			color: '#003355',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				description: 'Name of the binary property from which to read the PDF file',
			},
			{
				displayName: 'Password',
				name: 'password',
				type: 'string',
				default: '',
				required: false,
			}
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		const returnData: INodeExecutionData[] = [];
		const length = items.length;
		let item: INodeExecutionData;

		for (let itemIndex = 0; itemIndex < length; itemIndex++) {
			try {
				item = items[itemIndex];

				const password = this.getNodeParameter('password', itemIndex) as string;
				const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex) as string;

				if (item.binary === undefined) {
					item.binary = {};
				}

				const binaryData = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName) as Buffer;

				const options: PDFExtractOptions = {password}; /* see https://www.npmjs.com/package/pdf.js-extract */

				returnData.push({
					binary: item.binary,

					json: (await new PDFExtract().extractBuffer(binaryData, options)) as unknown as IDataObject,
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
						},
						pairedItem: {
							item: itemIndex,
						},
					});
					continue;
				}
				throw error;
			}
		}
		return this.prepareOutputData(returnData);
	}
}
