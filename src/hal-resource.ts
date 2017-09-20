import { DefaultSerializer, IJSONSerializer } from "./hal-json-serializer";
import { IHalResource, IHalResourceConstructor } from "./hal-resource-interface";
import { HalRestClient } from "./hal-rest-client";
import { URI } from "./uri";

export class HalResource implements IHalResource {
    public readonly links = {};
    public readonly props = {};
    public isLoaded = false;

    protected restClient: HalRestClient;

    private readonly settedProps = [];
    private readonly settedLinks = [];
    private initEnded = false;

    constructor(restClient: HalRestClient|HalResource, protected _uri ?: URI) {
      if (restClient instanceof HalRestClient) {
        this.restClient = restClient;
      } else {
        this.restClient = restClient.restClient;
        this.links = restClient.links;
        this.props = restClient.props;
        this.settedLinks = restClient.settedLinks;
        this.settedProps = restClient.settedProps;
        this._uri = restClient._uri;
      }
    }

    public fetch(forceOrParams ?: boolean|object): Promise<this> {
      if ((this.isLoaded && !forceOrParams) || this.uri === undefined) {
        return new Promise((resolve) => resolve(this));
      } else {
        return this.restClient.fetch(
          this.uri.fill(forceOrParams as object),
          this.constructor as IHalResourceConstructor<this>,
          this,
        );
      }
    }

    /**
     * to clear value use null not undefined
     */
    public prop(name: string, value ?: any): any {
      if (value !== void 0) {
        if (this.links[name]) {
          this.link(name, value);
        } else {
          this.props[name] = value;
          if (this.initEnded) {
            this.settedProps.push(name);
          }
        }
        return this;
      } else {
        if (this.props[name] !== undefined) {
          return this.props[name];
        } else if (this.links[name]) {
          return this.link(name);
        }
      }
    }

    set uri(uri: URI) {
      this._uri = uri;
    }

    get uri(): URI {
      return this._uri;
    }
    /**
     * to clear value use null not undefined
     */
    public link(name: string, value ?: IHalResource): HalResource {
      if (value !== void 0) {
        this.links[name] = value;
        if (this.initEnded) {
          this.settedLinks.push(name);
        }
        return this;
      } else {
        return this.links[name];
      }
    }

    /**
     * delete the resource
     * according server, return can be :
     *   - the request
     *   - an halResource returned by server
     *   - a json object return by server
     */
    public delete(): Promise<any> {
      return this.restClient.delete(this);
    }

    public onInitEnded() {
      this.initEnded = true;
    }

    /**
     * update the resource
     *
     * @param serializer : object used to serialize the prop and link value
     */
    public update(serializer ?: IJSONSerializer): Promise<any> {
      const json = this.serialize(this.settedProps, this.settedLinks, serializer);
      return this.restClient.update(this.uri.realURI, json, false, this.constructor as IHalResourceConstructor<this>);
    }

    /**
     * save the resource
     */
    public create(serializer ?: IJSONSerializer): Promise<any> {
      const json = this.serialize(Object.keys(this.props), Object.keys(this.links), serializer);
      return this.restClient.create(this.uri.realURI, json, this.constructor as IHalResourceConstructor<this>);
    }

    /**
     * get the service prop name corresponding to ts attribute name
     */
    protected tsProptoHalProd(prop: string) {
      const tsToHal = Reflect.getMetadata("halClient:tsToHal", this.constructor.prototype) || {};
      return tsToHal[prop] || prop;
    }

    /**
     * serialize this object to json
     */
    private serialize(props: string[], links: string[], serializer: IJSONSerializer = new DefaultSerializer()): object {
      const json = {};

      for (const prop of props) {
        const jsonKey = this.tsProptoHalProd(prop) ;
        if (this.props[prop] !== undefined && this.props[prop] !== null && this.props[prop].onInitEnded !== undefined) {
          json[jsonKey] = serializer.parseResource(this.props[prop]);
        } else {
          json[jsonKey] = serializer.parseProp(this.props[prop]);
        }
      }

      for (const link of links) {
        const jsonKey = this.tsProptoHalProd(link);
        json[jsonKey] = serializer.parseResource(this.links[link]);
      }

      return json;
    }
}
