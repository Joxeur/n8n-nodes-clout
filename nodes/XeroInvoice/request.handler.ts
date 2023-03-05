import {OptionsWithUri} from 'request';
import {RequestPromiseOptions} from 'request-promise-native';

export interface RequestHandler {

	perform(requestOptions: OptionsWithUri | RequestPromiseOptions): Promise<any>;
	buildError(error: any): Error;

}
