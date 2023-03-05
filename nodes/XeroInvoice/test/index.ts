import {NodeService} from '../service/node.service';
import {XeroSecurityConfig} from '../service/models';
import {TokenSetParameters} from 'openid-client';
import * as fs from 'fs';

const config: XeroSecurityConfig = {
	clientId: 'A6875CBB13DB42A68F721EDCC9510DA0',
	clientSecret: 'bKhwMdYhz1TNwqInHekrn663qIMztfn9Vhu0Fhyei5E8PgyL',
	grantType: 'authorizationCode',
	scopes: 'offline_access accounting.transactions accounting.settings accounting.contacts accounting.attachments'.split(/\s+/)
};

const tokenSet: TokenSetParameters =  {
	access_token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjFDQUY4RTY2NzcyRDZEQzAyOEQ2NzI2RkQwMjYxNTgxNTcwRUZDMTkiLCJ0eXAiOiJKV1QiLCJ4NXQiOiJISy1PWm5jdGJjQW8xbkp2MENZVmdWY09fQmsifQ.eyJuYmYiOjE2Nzc5NDY1OTgsImV4cCI6MTY3Nzk0ODM5OCwiaXNzIjoiaHR0cHM6Ly9pZGVudGl0eS54ZXJvLmNvbSIsImF1ZCI6Imh0dHBzOi8vaWRlbnRpdHkueGVyby5jb20vcmVzb3VyY2VzIiwiY2xpZW50X2lkIjoiQTY4NzVDQkIxM0RCNDJBNjhGNzIxRURDQzk1MTBEQTAiLCJzdWIiOiI1MzA1Zjg4NDVhYjE1ZTQ1OWM5MjY5NjM5NDU1Njc3YiIsImF1dGhfdGltZSI6MTY3Nzk0MDA5MSwieGVyb191c2VyaWQiOiJkYTZkNDAwNS03NWNjLTRkMTMtYmQ1YS02OTE4N2Y1MDE1YTIiLCJnbG9iYWxfc2Vzc2lvbl9pZCI6IjEyODVjZDNlMTA2NDRjNzk4MTZhMWE2ZDViNTg5MWM1Iiwic2lkIjoiMTI4NWNkM2UxMDY0NGM3OTgxNmExYTZkNWI1ODkxYzUiLCJqdGkiOiJDMkVBNTEyNTVBOUJDNkY4RjI0Q0M3QkI4QUEyQUI1OSIsImF1dGhlbnRpY2F0aW9uX2V2ZW50X2lkIjoiZjIzOGIyNWYtMDQ3MS00M2ZlLWIzNjctMzJiZTc1NDZjNzNjIiwic2NvcGUiOlsiYWNjb3VudGluZy5zZXR0aW5ncyIsImFjY291bnRpbmcuYXR0YWNobWVudHMiLCJhY2NvdW50aW5nLnRyYW5zYWN0aW9ucyIsImFjY291bnRpbmcuY29udGFjdHMiLCJvZmZsaW5lX2FjY2VzcyJdLCJhbXIiOlsicHdkIl19.xttXcqCA2T2_5NjLeJCYd_41Jjecq6CGYAQqQdwEHIsNngkl1icE24NYg1QrOyeYlBRtBj4CEFDR7f3uVA5kJHTdZlTahyas2diqMkH06nytg-CYr2b3Xms0s1voc63f9ZUXTWQGcUy1a8OPYm0Y7IQ9QbKo_EdosXfx7PJPa7v3F-_HlhrbvF_1KFKU_33VF5YeF8J3sjt9igdKvLDviROAxIefTy6jcV5PVzjCpRsGicQmzNGyHRYawIWS49FB8H2KYHFwMxMPz41oQp1wArQs_4o5z8wybAV9T90rGStF081qlYKEwruaU2h_DOIdsXuVdmoijQTdGsGY11b7ZQ',
	token_type: 'Bearer',
	refresh_token: '9gyZK0CtPwRS7xI9kQ-GkqmUami-Oq3M1zGxgPdtqFg',
	scope: 'accounting.transactions accounting.settings accounting.contacts accounting.attachments offline_access'
};

const nodeService = new NodeService(config, tokenSet);

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
