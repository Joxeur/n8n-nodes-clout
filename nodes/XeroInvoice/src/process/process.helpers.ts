import {ReportEntry, ReportEntryItem} from '../model/models';
import {TrackingCategory} from 'xero-node/dist/gen/model/accounting/trackingCategory';
import {Contact, Invoice} from 'xero-node';
import {LineAmountTypes} from 'xero-node/dist/gen/model/accounting/lineAmountTypes';
import {LineItem} from 'xero-node/dist/gen/model/accounting/lineItem';
import {CurrencyCode} from 'xero-node/dist/gen/model/accounting/currencyCode';
import {Item} from 'xero-node/dist/gen/model/accounting/item';
import {LineItemTracking} from 'xero-node/dist/gen/model/accounting/lineItemTracking';
import * as _ from 'lodash';

export class ProcessHelpers {

	static buildCode(reportEntry: ReportEntryItem): string {
		return `${reportEntry.orderNr}-${reportEntry.position ?? 'pikett'}`;
	}

	static findDepartment(trackingCategory: TrackingCategory, employeeName: string): LineItemTracking | undefined {
		function matchName(optionName: string, employeeName: string) {
			const words = employeeName.split(/\s+/);
			for (let word of words) {
				if (word.toUpperCase() === optionName.toUpperCase()) {
					return true;
				}
			}
			return false;
		}

		for (let option of trackingCategory.options ?? []) {
			if (matchName(option.name ?? '', employeeName)) {
				return {
					name: trackingCategory.name,
					option: option.name,
					trackingCategoryID: trackingCategory.trackingCategoryID,
					trackingOptionID: option.trackingOptionID
				};
			}
		}
		return undefined;
	}

	static buildLineItem(item: Item, department: TrackingCategory, reportEntry: ReportEntry, reportEntryItem: ReportEntryItem): LineItem {
		return {
			"itemCode": item.code,
			"description": `${item.name} ${this.buildMonthRangeString(reportEntry)}`,
			"quantity": reportEntryItem.hoursWorked,
			"item": item,
			"taxType": item.salesDetails?.taxType,
			"tracking": [department]
		};
	}

	private static buildMonthRangeString(reportEntry: ReportEntry): string {
		return _.chain([
			this.extractMonthYear(reportEntry.dateFrom),
			this.extractMonthYear(reportEntry.dateTo)
		])
		.uniq()
		.compact()
		.value()
		.join('-');
	}

	private static extractMonthYear(date: string): string | undefined {
		const matches = date?.match(/\d{1,2}\.(\d{1,2}\.\d{2,4})/) ?? [];
		return matches?.[1];
	}

	static computeFileName(reportEntry: ReportEntry): string {
		const itemsName = reportEntry.items.map(i => i.position).join(',');

		return `${reportEntry.employee} ${this.buildMonthRangeString(reportEntry)} [${itemsName}].pdf`;
	}

	static updateInvoice(invoice: Invoice, lineItems: LineItem[]): Invoice {
		function isSameLineItem(currentLineItem: LineItem, lineItem: LineItem) {
			return currentLineItem.itemCode === lineItem.itemCode
				&& currentLineItem.description === lineItem.description;
		}

		function containsLineItem(lineItem: LineItem, lineItems: LineItem[]) {
			return lineItems.some(li => isSameLineItem(li, lineItem));
		}

		const newLineItems = [];

		// Add non matching old line items
		for (let lineItem of invoice.lineItems ?? []) {
			if (!containsLineItem(lineItem, lineItems)){
				newLineItems.push(lineItem);
			}
		}

		// Add new ones
		for (let lineItem of lineItems) {
			newLineItems.push(lineItem);
		}

		invoice.lineItems = newLineItems;

		return invoice;
	}

	static buildInvoiceRef(contact: Contact, employeeName: string): string {
		return _.compact([
			new Date().getFullYear(),
			contact.name?.replace(/[ \.\'']/g, '_'),
			employeeName.trim().replace(/\s+/g, '_')
		]).join('-');
	}

	static buildInvoice(contact: Contact, invoiceRef: string, lineItems: LineItem[]): Invoice {
		return {
			"type": Invoice.TypeEnum.ACCREC,
			"reference": invoiceRef,
			"prepayments": [],
			"overpayments": [],
			"sentToContact": false,
			"currencyRate": 1.0,
			"totalDiscount": 0.00,
			"isDiscounted": false,
			"hasAttachments": false,
			"hasErrors": false,
			"attachments": [],
			"contact": contact,
			"status": Invoice.StatusEnum.DRAFT,
			"lineAmountTypes": LineAmountTypes.Exclusive,
			"lineItems": lineItems,
			"currencyCode": CurrencyCode.CHF
		};
	}

}
