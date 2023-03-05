import {TokenSetParameters} from 'openid-client';
import {BrandingTheme} from 'xero-node/dist/gen/model/accounting/brandingTheme';
import {Input, Output, XeroSecurityConfig} from './models';
import {ProcessService} from './process.service';
import {XeroRepository} from './xero.repository';

export class NodeService {

	private xeroRepository: XeroRepository;
	private processService: ProcessService;

	constructor(config: XeroSecurityConfig, tokenSet: TokenSetParameters, tenant?: string) {
		this.xeroRepository = new XeroRepository(config, tokenSet, tenant);
		this.processService = new ProcessService(this.xeroRepository);
	}

	public setTenant(tenant: string): void {
		this.xeroRepository.setTenant(tenant);
	}

	public async getTenants(): Promise<any[]> {
		return this.safeAsync(async () => {
			return await this.xeroRepository.getTenants() || [];
		}, []);
	}

	public async getBrandingThemes(): Promise<BrandingTheme[]> {
		return this.safeAsync(async () => {
			return await this.xeroRepository.getBrandingThemes();
		}, []);
	}

	public async process(input: Input, attachment: Buffer): Promise<Output | undefined> {
		return this.safeAsync(async () => {
			return await this.processService.process(input, attachment);
		}, undefined);
	}

	private async safeAsync<T>(callback: () => Promise<T>, defaultValue: T): Promise<T> {
		try {
			return await callback();
		} catch (e: any) {
			console.error("Error during execution", e);
		}
		return defaultValue;
	}

}
