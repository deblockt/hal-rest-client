import { IHalResource } from "./hal-resource-interface";
import { HalRestClient } from "./hal-rest-client";

export class HalResource implements IHalResource {
    public links = {};
    public props = {};
    public isLoaded = false;

    constructor(private restClient: HalRestClient, protected _uri ?: string) {
    }

    public fetch(force: boolean = false): Promise<HalResource> {
      if (this.isLoaded && !force) {
        return new Promise((resolve) => resolve(this));
      } else {
        return this.restClient.fetch(this.uri, HalResource, this);
      }
    }

    public prop(name: string): any {
      if (this.props[name]) {
        return this.props[name];
      } else if (this.links[name]) {
        return this.link(name);
      }
    }

    set uri(uri: string) {
      this._uri = uri;
    }

    get uri(): string {
      return this._uri;
    }

    public link(name: string): HalResource {
      return this.links[name];
    }
}
