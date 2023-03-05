import {XeroSecurityConfig} from './models';
import {TokenSetParameters} from 'openid-client';
import {BrandingTheme} from 'xero-node/dist/gen/model/accounting/brandingTheme';
import {Contact, Invoice, XeroClient} from 'xero-node';
import {TrackingCategory} from 'xero-node/dist/gen/model/accounting/trackingCategory';
import {Item} from 'xero-node/dist/gen/model/accounting/item';
import {Attachment} from 'xero-node/dist/gen/model/accounting/attachment';
const { Readable } = require('stream');

const TOKEN_EXPIRE_MARGIN_IN_SEC: number = 30;

export class XeroRepository {

	private _tenant?: string;
	private _xero: XeroClient;

	constructor(config: XeroSecurityConfig, tokenSet: TokenSetParameters, tenant?: string) {
		this._xero = new XeroClient(config);
		this._tenant = tenant;

		this._xero.setTokenSet(tokenSet);
	}

	public setTenant(tenant: string): void {
		this._tenant = tenant;
	}

	public async getXeroClient(): Promise<XeroClient> {
		await this._xero.initialize();

		const tokenSet = this._xero.readTokenSet();

		if (!tokenSet.expires_at || tokenSet.expires_at < (new Date().getTime() / 1000) + TOKEN_EXPIRE_MARGIN_IN_SEC) {
			const newTokenSet = await this._xero.refreshToken();
			console.log("newTokenSet", newTokenSet);
		}

		return this._xero;
	}

	public async getTenants(): Promise<any[]> {
		const xeroClient = await this.getXeroClient();
		const result = await xeroClient.updateTenants(false) || [];
		return result;
	}

	public async getBrandingThemes(): Promise<BrandingTheme[]> {
		this.checkTenant();

		const xeroClient = await this.getXeroClient();

		const result = await xeroClient.accountingApi.getBrandingThemes(this._tenant!);

		return result.body.brandingThemes ?? [];
	}

	public async getDepartments(): Promise<TrackingCategory> {
		this.checkTenant();

		const xeroClient = await this.getXeroClient();

		const result = await xeroClient.accountingApi.getTrackingCategories(this._tenant!, `Name="Department" && Status="ACTIVE"`);

		return this.getExactlyOne(result.body.trackingCategories ?? []);
	}

	public async getItemByCode(code: string): Promise<Item> {
		this.checkTenant();

		const xeroClient = await this.getXeroClient();

		const result = await xeroClient.accountingApi.getItems(this._tenant!, undefined, `code="${code}"`);

		return this.getExactlyOne(result.body.items ?? []);
	}

	public async getContactForFirma(firma: string): Promise<Contact> {
		this.checkTenant();

		const xeroClient = await this.getXeroClient();

		const result = await xeroClient.accountingApi.getContacts(this._tenant!, undefined, `Name.ToUpper().Contains("${firma.toUpperCase()}")`);

		return this.getExactlyOne(result.body.contacts ?? []);
	}

	public async getDraftInvoicesForContactID(contactId: string): Promise<Invoice[]> {
		this.checkTenant();

		const xeroClient = await this.getXeroClient();

		const result = await xeroClient.accountingApi.getInvoices(this._tenant!, undefined, undefined, undefined, undefined, undefined, [contactId], ['Draft']);

		return result.body.invoices ?? [];
	}

	public async updateInvoice(invoiceId: string, invoice: Invoice): Promise<Invoice> {
		this.checkTenant();

		const xeroClient = await this.getXeroClient();

		const result = await xeroClient.accountingApi.updateInvoice(this._tenant!, invoiceId, {invoices: [invoice]});

		return this.getExactlyOne(result.body.invoices ?? []);
	}

	public async createInvoice(invoice: Invoice): Promise<Invoice> {
		this.checkTenant();

		const xeroClient = await this.getXeroClient();

		const result = await xeroClient.accountingApi.createInvoices(this._tenant!, {invoices: [invoice]});

		return this.getExactlyOne(result.body.invoices ?? []);
	}

	public async createInvoiceAttachment(invoiceId: string, fileName: string, body: Buffer): Promise<Attachment[]> {
		this.checkTenant();

		const xeroClient = await this.getXeroClient();

		const result = await xeroClient.accountingApi.createInvoiceAttachmentByFileName(this._tenant!, invoiceId, fileName, Readable.from(body), true);

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
