import {IDataObject} from 'n8n-workflow';
import {OptionsWithUri} from 'request';
import {RequestHandler} from '../request.handler';

export class XeroClient {

	constructor(private requestHandler: RequestHandler) {
	}

	public async xeroApiRequest(
		method: 'GET' | 'POST' | 'PUT' | 'DELETE',
		resource: string,
		tenantId?: string,
		body: any = {},
		qs: IDataObject = {},
		headers: IDataObject = {},
	): Promise<any> {
		const options: OptionsWithUri = {
			headers: {
				'Content-Type': 'application/json',
			},
			method,
			body,
			qs,
			uri: resource.indexOf('http') === 0 ? resource : `https://api.xero.com/api.xro/2.0/${resource}`,
			json: true,
		};
		try {
			if (tenantId) {
				options.headers = { ...options.headers, 'Xero-tenant-id': tenantId };
			}
			if (Object.keys(headers).length !== 0) {
				options.headers = Object.assign({}, options.headers, headers);
			}
			if (Object.keys(body).length === 0) {
				delete options.body;
			}
			return this.requestHandler.perform(options);
		} catch (error) {
			throw this.requestHandler.buildError(error);
		}
	}
}
