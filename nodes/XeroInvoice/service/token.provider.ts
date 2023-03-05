
export interface TokenProvider {
	getToken():  Promise<string>;
	refresh(): Promise<string>;
}
