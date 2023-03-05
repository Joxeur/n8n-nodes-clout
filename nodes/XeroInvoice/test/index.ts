import {NodeService} from '../service/node.service';
import * as fs from 'fs';
import {TokenProvider} from '../service/token.provider';

const access_token = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjFDQUY4RTY2NzcyRDZEQzAyOEQ2NzI2RkQwMjYxNTgxNTcwRUZDMTkiLCJ0eXAiOiJKV1QiLCJ4NXQiOiJISy1PWm5jdGJjQW8xbkp2MENZVmdWY09fQmsifQ.eyJuYmYiOjE2NzgwMDc1NDIsImV4cCI6MTY3ODAwOTM0MiwiaXNzIjoiaHR0cHM6Ly9pZGVudGl0eS54ZXJvLmNvbSIsImF1ZCI6Imh0dHBzOi8vaWRlbnRpdHkueGVyby5jb20vcmVzb3VyY2VzIiwiY2xpZW50X2lkIjoiODI1QUZGMTM5RTFCNEJBRUE1QTA2RDQ2Rjk5RjkyRjMiLCJzdWIiOiI1MzA1Zjg4NDVhYjE1ZTQ1OWM5MjY5NjM5NDU1Njc3YiIsImF1dGhfdGltZSI6MTY3ODAwNzQwMiwieGVyb191c2VyaWQiOiJkYTZkNDAwNS03NWNjLTRkMTMtYmQ1YS02OTE4N2Y1MDE1YTIiLCJnbG9iYWxfc2Vzc2lvbl9pZCI6IjQwYjMyMjY4ZTBlYzQyOThhZTU4M2RkNDYyNjcyNTJlIiwic2lkIjoiNDBiMzIyNjhlMGVjNDI5OGFlNTgzZGQ0NjI2NzI1MmUiLCJqdGkiOiI0QjgzMDVENUZDNzNCRTdBRDBGOTQ0NUNCM0NFQUM2NyIsImF1dGhlbnRpY2F0aW9uX2V2ZW50X2lkIjoiYTgxM2NmZWItNjc5MC00ZTk2LWExNGQtNmM3MWNhZDEwMWJlIiwic2NvcGUiOlsiYWNjb3VudGluZy5zZXR0aW5ncyIsImFjY291bnRpbmcuYXR0YWNobWVudHMiLCJhY2NvdW50aW5nLnRyYW5zYWN0aW9ucyIsImFjY291bnRpbmcuY29udGFjdHMiLCJvZmZsaW5lX2FjY2VzcyJdLCJhbXIiOlsic3NvIl19.HKndFuOV3O_Wexgfqam3RDSWdvuYLI4kUj7d4UfLWWe-3xVNUtsk3NrEM_zGSJ_YxN0a7LwkAqIXebCPIx0OtcSySgQUIG4_QIs_MQQ3XwtBnvIQHX5YHbpSA4FT-Ua_NTiwI0D1BaAlo9H24G4vYN7W_QpQN5-0konukZxqMU6nwOYWYiD2uCPTRxclXznGpc1o6X1IIonlCdoo_jxtbM7eE7F5gczGhI4zn8MnWgtOlkb-MfHAEmJvu_Hdmj7n9-tIxdO5yaP4mp9AoajFKb2OeEcupfvClkW6npKwBdjyNKtGAv3GOuNbm_8O9D5Y7n2CtmosKNBGR_c87oB_-Q';

const tokenProvider: TokenProvider = {
	getToken(): Promise<string> {
		return Promise.resolve(access_token);
	},
	async refresh(): Promise<string> {
		throw "Refresh token not handled";
	}
};

const nodeService = new NodeService(tokenProvider);

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
