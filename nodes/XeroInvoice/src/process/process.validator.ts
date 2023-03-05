import {Input} from '../model/models';

export class ProcessValidator {

	static validate(input: Input): boolean {
		return !!input.brandingTheme
			&& !!input.report
			&& !!input.report.firma
			&& !!input.report.dateFrom
			&& !!input.report.dateTo
			&& !!input.report.employee
			&& !!input.report.items?.length
			&& !!input.report.items.every(item =>
				!!item.orderNr
					&& !!item.hoursWorked
			);
	}

}
