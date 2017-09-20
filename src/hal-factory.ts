import { AxiosRequestConfig } from "axios";
import { HalResource } from "./hal-resource";
import { IHalResource, IHalResourceConstructor} from "./hal-resource-interface";
import { HalRestClient } from "./hal-rest-client";
import { URI } from "./uri";

let clients: {[k: string]: HalRestClient} = {};
let resources: {[k: string]: any} = {};

/**
 * create hal rest client
 * if a client with same base already exists, same client is returned
 *
 */
export function createClient(basename ?: string, options: AxiosRequestConfig = {}): HalRestClient {
    if (!basename) {
        return new HalRestClient();
    }

    if (!(basename in clients)) {
        clients[basename] = new HalRestClient(basename, options);
    }

    return clients[basename];
}

/**
 * create HalResource for uri
 */
export function createResource<T extends IHalResource>(
  client: HalRestClient,
  c: IHalResourceConstructor<T>,
  uri?: string|URI,
): T {
    if (!uri) {
        return new c(client);
    }

    if (typeof uri === "object" && uri.templated) {
        return new c(client, uri);
    }

    const stringURI = typeof uri === "string" ? uri : uri.uri;
    const objectURI = typeof uri === "string" ? new URI(uri, false, uri) : uri;

    if (!(stringURI in resources)) {
        resources[stringURI] = new c(client, objectURI);
    }

    const resource = resources[stringURI];
    if (resource instanceof c) {
      return resource;
    }
    return new c(resource);
}

/**
 * reset cache for client or resource
 */
export function resetCache() {
    clients = {};
    resources = {};
}
