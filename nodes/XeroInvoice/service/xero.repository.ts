import {BrandingTheme} from 'xero-node/dist/gen/model/accounting/brandingTheme';
import {Contact, Invoice} from 'xero-node';
import {TrackingCategory} from 'xero-node/dist/gen/model/accounting/trackingCategory';
import {Item} from 'xero-node/dist/gen/model/accounting/item';
import {Attachment} from 'xero-node/dist/gen/model/accounting/attachment';
import {RequestHandler} from '../request.handler';
import {XeroClient} from './xero.client';

export interface Tenant {
	tenantId: string;
	tenantName: string;
}

export class XeroRepository {

	private _tenant?: string;
	private xeroClient: XeroClient;

	constructor(requestHandler: RequestHandler, tenant?: string) {
		this._tenant = tenant;
		this.xeroClient = new XeroClient(requestHandler);
	}

	public setTenant(tenant: string): void {
		this._tenant = tenant;
	}

	public async getTenants(): Promise<Tenant[]> {
		const result = await this.xeroClient.xeroApiRequest('GET', 'https://api.xero.com/connections');

		return result.body;
	}

	public async getBrandingThemes(): Promise<BrandingTheme[]> {
		this.checkTenant();

		const result = await this.xeroClient.xeroApiRequest('GET', 'BrandingThemes', this._tenant);

		return result.body.brandingThemes ?? [];
	}

	public async getDepartments(): Promise<TrackingCategory> {
		this.checkTenant();

		const result = await this.xeroClient.xeroApiRequest('GET', 'TrackingCategories', this._tenant, {}, {where: `Name="Department" && Status="ACTIVE"`});

		return this.getExactlyOne(result.body.trackingCategories ?? []);
	}

	public async getItemByCode(code: string): Promise<Item> {
		this.checkTenant();

		const result = await this.xeroClient.xeroApiRequest('GET', 'Items', this._tenant, {}, {where: `code="${code}"`});

		return this.getExactlyOne(result.body.items ?? []);
	}

	public async getContactForFirma(firma: string): Promise<Contact> {
		this.checkTenant();

		const result = await this.xeroClient.xeroApiRequest(
			'GET',
			'Contacts',
			this._tenant,
			{},
			{where: `Name.ToUpper().Contains("${firma.toUpperCase()}")`}
		);

		return this.getExactlyOne(result.body.contacts ?? []);
	}

	public async getDraftInvoicesForContactID(contactId: string): Promise<Invoice[]> {
		this.checkTenant();

		const result = await this.xeroClient.xeroApiRequest(
			'GET',
			'Invoices',
			this._tenant,
			{},
			{ContactIDs: contactId, Statuses: 'Draft'}
		);

		return result.body.invoices ?? [];
	}

	public async updateInvoice(invoiceId: string, invoice: Invoice): Promise<Invoice> {
		this.checkTenant();

		const result = await this.xeroClient.xeroApiRequest(
			'POST', `Invoices/${invoiceId}`, this._tenant, invoice
		);

		return this.getExactlyOne(result.body.invoices ?? []);
	}

	public async createInvoice(invoice: Invoice): Promise<Invoice> {
		this.checkTenant();

		const result = await this.xeroClient.xeroApiRequest(
			'PUT', `Invoices`, this._tenant, invoice
		);

		return this.getExactlyOne(result.body.invoices ?? []);
	}

	public async createInvoiceAttachment(invoiceId: string, fileName: string, body: Buffer, includeOnline: boolean): Promise<Attachment[]> {
		this.checkTenant();

		const result = await this.xeroClient.xeroApiRequest(
			'POST',
			`Invoices/${invoiceId}/Attachments/${encodeURIComponent(fileName)}`,
			this._tenant,
			body,
			{includeOnline},
			{'Content-Type': 'application/octet-stream'}
		);

		return result.body.attachments ?? [];
	}

	private checkTenant(): void {
		if (!this._tenant) {
			throw new Error('Tenant id is required and was not provided!');
		}
	}

	private getExactlyOne<T>(items: T[], itemName?: string): T {
		if (!items || items.length === 0) {
			throw new Error(`No ${itemName ?? 'element'} has been found`);
		}
		if (items?.length > 1) {
			throw new Error(`More than one ${itemName ?? 'element'} has been found`);
		}
		return items[0];
	}
}
