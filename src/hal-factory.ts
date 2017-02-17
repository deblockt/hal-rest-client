import { HalRestClient } from './hal-rest-client';
import { HalResource } from './hal-resource';

let clients : {[k: string]: HalRestClient} = {};
let resources : {[k: string]:  HalResource} = {};

/**
 * create hal rest client
 * if a client with same base already exists, same client is returned
 *
 */
export function createClient(basename : string, headers : Object = {}): HalRestClient {
	if (!(basename in clients)) {
		clients[basename] = new HalRestClient(basename, headers);
	}
	
	return clients[basename];		
}

/**
 * create HalResource for uri
 */
export function createResource(client : HalRestClient, uri ?: string): HalResource {
	if (!uri) {
		return new HalResource(client);
	}
	
	if (!(uri in resources)) {
		resources[uri] = new HalResource(client, uri);
	}
	
	return resources[uri];
}

/**
 * reset cache for client or resource 
 * @param uri : basename of client or uri of resource
 */
export function resetCache(uri ?: string) {
	if (uri) {
		clients[uri] = undefined;
		resources[uri] = undefined;
	} else {		
		clients = {};
		resources = {};
	}
}