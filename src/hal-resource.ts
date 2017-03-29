import { IHalResource, IHalResourceConstructor } from "./hal-resource-interface";
import { HalRestClient } from "./hal-rest-client";

export class HalResource implements IHalResource {
    public links = {};
    public props = {};
    public isLoaded = false;

    constructor(private restClient: HalRestClient, protected _uri ?: string) {
    }

    public fetch(force: boolean = false): Promise<this> {
      if (this.isLoaded && !force) {
        return new Promise((resolve) => resolve(this));
      } else {
        return this.restClient.fetch(this.uri, this.constructor as IHalResourceConstructor<this>, this);
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
