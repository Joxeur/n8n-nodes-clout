import request = require('request');

import {NodeService} from '../service/node.service';
import * as fs from 'fs';
import {RequestHandler} from '../request.handler';
import {OptionsWithUri} from 'request';
import {RequestPromiseOptions} from 'request-promise-native';

const accessToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjFDQUY4RTY2NzcyRDZEQzAyOEQ2NzI2RkQwMjYxNTgxNTcwRUZDMTkiLCJ0eXAiOiJKV1QiLCJ4NXQiOiJISy1PWm5jdGJjQW8xbkp2MENZVmdWY09fQmsifQ.eyJuYmYiOjE2NzgwMTM1NjUsImV4cCI6MTY3ODAxNTM2NSwiaXNzIjoiaHR0cHM6Ly9pZGVudGl0eS54ZXJvLmNvbSIsImF1ZCI6Imh0dHBzOi8vaWRlbnRpdHkueGVyby5jb20vcmVzb3VyY2VzIiwiY2xpZW50X2lkIjoiRUUwQzhGMkRFRDAzNDMzQTlEREE0NkVDMDcyQTA2REUiLCJzdWIiOiI1MzA1Zjg4NDVhYjE1ZTQ1OWM5MjY5NjM5NDU1Njc3YiIsImF1dGhfdGltZSI6MTY3ODAxMzU2NCwieGVyb191c2VyaWQiOiJkYTZkNDAwNS03NWNjLTRkMTMtYmQ1YS02OTE4N2Y1MDE1YTIiLCJnbG9iYWxfc2Vzc2lvbl9pZCI6IjQwYjMyMjY4ZTBlYzQyOThhZTU4M2RkNDYyNjcyNTJlIiwic2lkIjoiNDBiMzIyNjhlMGVjNDI5OGFlNTgzZGQ0NjI2NzI1MmUiLCJqdGkiOiIyREZCNzc1OThDMERGNzlDNkRENDgzNzJFMTI3NUM1RiIsImF1dGhlbnRpY2F0aW9uX2V2ZW50X2lkIjoiNjgzMmZlM2YtMjhmMi00ZWRlLWFkYzQtOWM0ZGNiODBlNTFjIiwic2NvcGUiOlsiZW1haWwiLCJwcm9maWxlIiwib3BlbmlkIiwiYWNjb3VudGluZy5yZXBvcnRzLnJlYWQiLCJmaWxlcyIsInBheXJvbGwuZW1wbG95ZWVzIiwicGF5cm9sbC5wYXlydW5zIiwicGF5cm9sbC5wYXlzbGlwIiwicGF5cm9sbC50aW1lc2hlZXRzIiwicHJvamVjdHMiLCJhY2NvdW50aW5nLnNldHRpbmdzIiwiYWNjb3VudGluZy5hdHRhY2htZW50cyIsImFjY291bnRpbmcudHJhbnNhY3Rpb25zIiwiYWNjb3VudGluZy5qb3VybmFscy5yZWFkIiwiYXNzZXRzIiwiYWNjb3VudGluZy5jb250YWN0cyIsInBheXJvbGwuc2V0dGluZ3MiLCJmaW5hbmNlLmNhc2h2YWxpZGF0aW9uLnJlYWQiLCJhY2NvdW50aW5nLmJ1ZGdldHMucmVhZCIsImFjY291bnRpbmcucmVwb3J0cy50ZW5uaW5ldHluaW5lLnJlYWQiLCJmaW5hbmNlLnN0YXRlbWVudHMucmVhZCIsImZpbmFuY2UuYWNjb3VudGluZ2FjdGl2aXR5LnJlYWQiLCJmaW5hbmNlLmJhbmtzdGF0ZW1lbnRzcGx1cy5yZWFkIiwib2ZmbGluZV9hY2Nlc3MiXSwiYW1yIjpbInNzbyJdfQ.gAvQi-yFSDc-x2MQKDOBd_CJ7Yjw5YskTQJeLPLrAQYy1I6mwhvXo4fvNcIX9Lv2LwhAOCTo8db1Z7R2hiwit3bEuTDmoDE0iG-mFkx0bUT7rtluUzpzUSH3YCguppPcez0AUF97GcxCscr7AQCJbZVtPc9_-atJIh-xzEfYu_9mpSN6cDGRKcrBj5NjWSEx7kyunEYueNDkuKshagSso0moTYgLhq8QmIQdTFhiRSifNklVnGt5kHhx9kwq_lG2pn9N5IRWC9NPVaeGT2KoxnD3_VG1SJoMfNJI4pC1EdpYUx2rW4SPUik1hTbQOtTOSYL_DtbtuihTxGpc9Q6GSg';

const requestHandler: RequestHandler = {
	perform(requestOptions: OptionsWithUri | RequestPromiseOptions): Promise<any> {
		requestOptions.headers = {...requestOptions.headers, 'Authorization': `Bearer ${accessToken}`};

		return new Promise<any>((resolve, reject) => {
			request(requestOptions as any, (error: any, response: any, body: any) => {
				if (error) {
					reject(error);
				} else {
					if (response.statusCode && response.statusCode >= 200 && response.statusCode <= 299) {
						resolve({ response: response, body: body });
					} else {
						reject({ response: response, body: body });
					}
				}
			});
		});
	},
	buildError(error: any): Error {
		return error;
	}
}

const nodeService = new NodeService(requestHandler);

(async () => {
	const tenants = await nodeService.getTenants();
	console.log("Tenants: ", tenants);

	const tenant = tenants.filter(t => t.tenantName.indexOf('Test') !== -1)[0];

	nodeService.setTenant(tenant.tenantId);

	const brandingThemes = await nodeService.getBrandingThemes();
	console.log("BrandingThemes: ", await nodeService.getBrandingThemes());

	const brandingTheme = brandingThemes[0];

	const report = {
		brandingTheme: brandingTheme.brandingThemeID!,
		report: {
			"dateFrom": "13.02.2023",
			"dateTo": "20.02.2023",
			"employee": "Lauber Jonas",
			"firma": "Akros AG",
			"items": [{
				"orderNr": "4549881732",
				"position": "pikett",
				"hoursWorked": 112
			}]
		}
	};

	const output = await nodeService.process(report, fs.readFileSync('C:\\devsbb\\eaio\\nodejs18\\node_modules\\n8n\\data\\2023.02_PabloMolinaFebruar.pdf'));

	console.log("output: ", output);
})()
