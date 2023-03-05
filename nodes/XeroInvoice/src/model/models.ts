export interface Input {
	brandingTheme: string,
	report: ReportEntry
}

export interface ReportEntryItem {
	"orderNr": string,
	"position"?: string,
	"hoursWorked": number
}

export interface ReportEntry {
	"dateFrom": string,
	"dateTo": string,
	"employee": string,
	"firma": string,
	"items": ReportEntryItem[]
}

export interface Output {
	invoiceId: string
}

export interface Tenant {
	tenantName: string;
	tenantId: string;
}
