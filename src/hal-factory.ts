import { HalResource } from "./hal-resource";
import { IHalResource, IHalResourceConstructor} from "./hal-resource-interface";
import { HalRestClient } from "./hal-rest-client";

let clients: {[k: string]: HalRestClient} = {};
let resources: {[k: string]: any} = {};

/**
 * create hal rest client
 * if a client with same base already exists, same client is returned
 *
 */
export function createClient(basename ?: string, headers: object = {}): HalRestClient {
    if (!basename) {
        return new HalRestClient();
    }

    if (!(basename in clients)) {
        clients[basename] = new HalRestClient(basename, headers);
    }

    return clients[basename];
}

/**
 * create HalResource for uri
 */
export function createResource<T extends IHalResource>(
  client: HalRestClient,
  c: IHalResourceConstructor<T>,
  uri?: string,
): T {
    if (!uri) {
        return new c(client);
    }

    if (!(uri in resources)) {
        resources[uri] = new c(client, uri);
    }

    return resources[uri];
}

/**
 * reset cache for client or resource
 */
export function resetCache() {
    clients = {};
    resources = {};
}
