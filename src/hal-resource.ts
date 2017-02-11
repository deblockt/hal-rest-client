import { HalRestClient } from './hal-rest-client';

export class HalResource {
    links : Object = {};
    props : Object = {};
    isLoaded : boolean = false;

    constructor(private restClient : HalRestClient, protected _uri ?: string) {
    }

    fetch(force : boolean = false): Promise<HalResource> {
      if (this.isLoaded && !force) {
        return new Promise((resolve) => resolve(this));
      } else {
        return this.restClient.fetch(this.uri, this);
      }
    }

    prop(name : string): any {
        if (this.props[name]) {
          return this.props[name];
        } else if (this.links[name]) {
          return this.link(name);
        }
    }

    set uri(uri : string) {
      this._uri = uri;
    }

    get uri() {
      return this._uri;
    }

    link(name : string): HalResource {
      return this.links[name];
    }
}
