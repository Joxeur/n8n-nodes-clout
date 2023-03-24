import {Input, Output} from '../model/models';
import {XeroRepository} from '../repository/xero.repository';
import {ProcessHelpers} from './process.helpers';
import {ProcessValidator} from './process.validator';

export class ProcessService {

	private xero: XeroRepository;

	constructor(xero: XeroRepository) {
		this.xero = xero;
	}

	public async process(input: Input, attachment: Buffer): Promise<Output> {
		if (!ProcessValidator.validate(input) || !attachment) {
			throw new Error("Invalid input.");
		}

		// Find Department
		const departments = await this.xero.getDepartments();
		const department = ProcessHelpers.findDepartment(departments, input.report.employee);
		if (!department) {
			throw new Error('No department found for ' + input.report.employee);
		}

		// Find contact
		const contact = await this.xero.getContactForFirma(input.report.firma);

		// Find items and convert them to line Items
		const lineItems = [];
		for (let reportEntryItem of input.report.items) {
			const item = await this.xero.getItemByCode(ProcessHelpers.buildCode(reportEntryItem));

			lineItems.push(ProcessHelpers.buildLineItem(item, department, input.report, reportEntryItem));
		}

		// Find invoice if one exists
		const invoices = await this.xero.getDraftInvoicesForContactID(contact.contactID!);

		// Create or update invoice
		let newInvoice;
		if (invoices.length === 0) {
			const invoice = ProcessHelpers.buildInvoice(contact, lineItems);
			newInvoice = await this.xero.createInvoice(invoice);
		} else {
			// Always take first one
			const invoice = ProcessHelpers.updateInvoice(invoices[0], lineItems);
			newInvoice = await this.xero.updateInvoice(invoice.invoiceID!, invoice);
		}

		// Add attachment
		const filename = ProcessHelpers.computeFileName(input.report);
		await this.xero.createInvoiceAttachment(newInvoice.invoiceID!, filename, attachment);

		return {
			invoiceId: newInvoice.invoiceID!
		};
	}

}
