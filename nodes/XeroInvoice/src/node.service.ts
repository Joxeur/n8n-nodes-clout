import {BrandingTheme} from 'xero-node/dist/gen/model/accounting/brandingTheme';
import {Input, Output} from './model/models';
import {ProcessService} from './process/process.service';
import {XeroRepository} from './repository/xero.repository';
import {TokenProvider} from './repository/token.provider';

export class NodeService {

	private xeroRepository: XeroRepository;
	private processService: ProcessService;

	constructor(tokenProvider: TokenProvider, tenant?: string) {
		this.xeroRepository = new XeroRepository(tokenProvider, tenant);
		this.processService = new ProcessService(this.xeroRepository);
	}

	public setTenant(tenant: string): void {
		this.xeroRepository.setTenant(tenant);
	}

	public async getTenants(): Promise<any[]> {
		return await this.xeroRepository.getTenants() || [];
	}

	public async getBrandingThemes(): Promise<BrandingTheme[]> {
		return await this.xeroRepository.getBrandingThemes() || [];
	}

	public async process(input: Input, attachment: Buffer): Promise<Output> {
		return await this.processService.process(input, attachment);
	}

}
