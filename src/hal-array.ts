import { IHalResource } from './hal-resource-interface';
import { HalRestClient } from './hal-rest-client';

export class HalArray<T extends IHalResource> extends Array<T> implements IHalResource {
    links : Object = {};
    props : Object = {};
    isLoaded : boolean = false;

    constructor(private restClient : HalRestClient, private _uri ?: string) {
        super();
    }

    fetch(force : boolean): Promise<IHalResource> {
        return null;
    }

    prop(name : string): any {
        return null;
    }

    link(name : string): IHalResource {
        return null;
    }

    set uri(uri : string) {
      this._uri = uri;
    }

    get uri():string {
      return this._uri;
    }
}
