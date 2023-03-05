import {NodeService} from '../src/node.service';
import * as fs from 'fs';
import {TokenProvider} from '../src/repository/token.provider';

const access_token = 'TO_DEFINE';

const tokenProvider: TokenProvider = {
	getToken(): Promise<string> {
		return Promise.resolve(access_token);
	},
	async refresh(): Promise<string> {
		throw "Refreshing token is not handled";
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
