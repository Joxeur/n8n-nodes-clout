import {BrandingTheme} from 'xero-node/dist/gen/model/accounting/brandingTheme';
import {Contact, Invoice, XeroClient} from 'xero-node';
import {TrackingCategory} from 'xero-node/dist/gen/model/accounting/trackingCategory';
import {Item} from 'xero-node/dist/gen/model/accounting/item';
import {Attachment} from 'xero-node/dist/gen/model/accounting/attachment';
import {TokenProvider} from './token.provider';
const { Readable } = require('stream');

export class XeroRepository {

	private _tenant?: string;
	private xeroClient: XeroClient;

	constructor(private tokenProvider: TokenProvider, tenant?: string) {
		this.xeroClient = new XeroClient({clientId: '', clientSecret: ''});
		this._tenant = tenant;
	}

	private setToken(access_token: string): void {
		this.xeroClient.setTokenSet({access_token});
	}

	public setTenant(tenant: string): void {
		this._tenant = tenant;
	}

	public async getTenants(): Promise<any[]> {
		return this.handleToken(async () => {
			return await this.xeroClient.updateTenants(false) || [];
		});
	}

	public async getBrandingThemes(): Promise<BrandingTheme[]> {
		this.checkTenant();

		return this.handleToken(async () => {
			const result = await this.xeroClient.accountingApi.getBrandingThemes(this._tenant!);

			return result.body.brandingThemes ?? [];
		});
	}

	public async getDepartments(): Promise<TrackingCategory> {
		this.checkTenant();

		return this.handleToken(async () => {
			const result = await this.xeroClient.accountingApi.getTrackingCategories(this._tenant!, `Name="Department" && Status="ACTIVE"`);

			return this.getExactlyOne(result.body.trackingCategories ?? [], 'Department');
		});
	}

	public async getItemByCode(code: string): Promise<Item> {
		this.checkTenant();

		return this.handleToken(async () => {
			const result = await this.xeroClient.accountingApi.getItems(this._tenant!, undefined, `code="${code}"`);

			return this.getExactlyOne(result.body.items ?? [], 'Item', {code});
		});
	}

	public async getContactForFirma(firma: string): Promise<Contact> {
		this.checkTenant();

		return this.handleToken(async () => {
			const result = await this.xeroClient.accountingApi.getContacts(this._tenant!, undefined, `Name.ToUpper().Contains("${firma.toUpperCase()}")`);

			return this.getExactlyOne(result.body.contacts ?? [], 'Contact', {firma});
		});
	}

	public async getDraftInvoicesForContactID(contactId: string, ref: string): Promise<Invoice[]> {
		this.checkTenant();

		return this.handleToken(async () => {
			const result = await this.xeroClient.accountingApi.getInvoices(this._tenant!, undefined, `Reference.ToUpper().Equals("${ref.toUpperCase()}")`, undefined, undefined, undefined, [contactId], ['Draft']);

			return result.body.invoices ?? [];
		});
	}

	public async updateInvoice(invoiceId: string, invoice: Invoice): Promise<Invoice> {
		this.checkTenant();

		return this.handleToken(async () => {
			const result = await this.xeroClient.accountingApi.updateInvoice(this._tenant!, invoiceId, {invoices: [invoice]});

			return this.getExactlyOne(result.body.invoices ?? [], 'Invoice', {invoiceId});
		});
	}

	public async createInvoice(invoice: Invoice): Promise<Invoice> {
		this.checkTenant();

		return this.handleToken(async () => {
			const result = await this.xeroClient.accountingApi.createInvoices(this._tenant!, {invoices: [invoice]});

			return this.getExactlyOne(result.body.invoices ?? [], 'Invoice');
		});
	}

	public async createInvoiceAttachment(invoiceId: string, fileName: string, body: Buffer): Promise<Attachment[]> {
		this.checkTenant();

		return this.handleToken(async () => {
			const result = await this.xeroClient.accountingApi.createInvoiceAttachmentByFileName(this._tenant!, invoiceId, fileName, Readable.from(body), true);

			return result.body.attachments ?? [];
		});
	}

	private checkTenant(): void {
		if (!this._tenant) {
			throw new Error('Tenant id is required and was not provided!');
		}
	}

	private getExactlyOne<T>(items: T[], itemName?: string, context?: any): T {
		if (!items || items.length === 0) {
			throw new Error(`No ${itemName ?? 'element'} has been found. ${context ? JSON.stringify(context) : ''}`);
		}
		if (items?.length > 1) {
			throw new Error(`More than one ${itemName ?? 'element'} has been found. ${context ? JSON.stringify(context) : ''}`);
		}
		return items[0];
	}

	private async handleToken<T>(callback: () => Promise<T>): Promise<T> {
		return await this.handleTokenRecursive(callback, 1);
	}

	private async handleTokenRecursive<T>(callback: () => Promise<T>, retry: number): Promise<T> {
		this.setToken(await this.tokenProvider.getToken());

		try {
			return await callback();
		} catch (e: any) {
			if (e?.response?.statusCode === 401 && retry !== 0) {
				console.log("Refreshing token");
				this.setToken(await this.tokenProvider.refresh());
				return await this.handleTokenRecursive(callback, retry - 1);
			}

			console.log("Error", e);

			throw e;
		}
	}
}
