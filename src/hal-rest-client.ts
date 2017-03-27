import Axios from "axios";
import "reflect-metadata";

import { createResource } from "./hal-factory";
import { HalResource } from "./hal-resource";
import { IHalResource, IHalResourceConstructor} from "./hal-resource-interface";

/**
 * base to rest client
 *
 * can fetch resource :
 * ``` ts
 * let resource = await new HalRestClient().fetch('http://foo.bar/resource');
 *
 * // can access properties with
 * resource.prop('my_prop')
 *
 * // can get _links with
 * var linkResource = resource.link('my_link')
 *
 * // can fetch link
 * await linkResource.fetch();
 * ```
 */
export class HalRestClient {
  private axios;

  constructor(private baseURL ?: string, headers: object = {}) {
    this.axios = Axios.create({baseURL, headers});
  }

  public fetchResource(resourceURI: string): Promise<HalResource> {
    return this.fetch(resourceURI, HalResource);
  }

  public fetchArray<T extends IHalResource>(resourceURI: string, c: IHalResourceConstructor<T>): Promise<T[]> {
    // TODO use HalArray instead of this shit
    return new Promise((resolve, reject) => {
      this.axios.get(resourceURI).then((value) => {
        if (Array.isArray(value.data)) {
          const array = [];
          for (const item of value.data) {
            array.push(this.jsonToResource(item, c));
          }
          resolve(array);
        } else {
          const halResource = this.jsonToResource(value.data, c);
          const array = [];
          const source = halResource.prop(Object.keys(halResource.props)[0]);
          for (const item of source) {
            const resource = createResource(item.uri, c);
            resource.props = item.props;
            resource.links = item.links;
            resource.isLoaded = item.isLoaded;
            array.push(resource);
          }
          resolve(array);
        }
      }).catch(reject);
    });
  }

  public fetch<T extends IHalResource>(resourceURI: string, c: IHalResourceConstructor<T>,  resource ?: T): Promise<T> {
    return new Promise((resolve, reject) => {
      this.axios.get(resourceURI).then((value) => {
        resolve(this.jsonToResource(value.data, c, resource));
      }).catch(reject);
    });
  }

  /**
   * add header for each request of ths rest-client
   * @param name : header name
   * @param value : header value
   *
   * @return this
   */
  public addHeader(name: string, value: string): HalRestClient {
    this.axios.defaults.headers.common[name] = value;
    return this;
  }

  /**
   * parse a json to object
   */
  private parseJson(json, clazz ?: {prototype: any}, key ?: string): any {
    // if there are _links prop object is a resource
    if (null === json) {
      return null;
    } else if (Array.isArray(json)) {
      const type = Reflect.getMetadata("halClient:specificType", clazz.prototype, key) || HalResource;
      return json.map((item) => this.jsonToResource(item, type));
    } else if (typeof json === "object" && json._links !== undefined) {
      const type = Reflect.getMetadata("halClient:specificType", clazz.prototype, key) || HalResource;
      return this.jsonToResource(json, type);
    } else {
      return json;
    }
  }

  /**
   * convert a json to an halResource
   */
  private jsonToResource<T extends IHalResource>(
    json: any,
    c: IHalResourceConstructor<T>,
    resource?: T,
  ): T {
    if (!("_links" in json)) {
        throw new Error("object is not hal resource");
    }

    if (!resource) {
      const uri = "string" === typeof json._links.self ? json._links.self : json._links.self.href;
      resource = createResource(this, c, uri);
    }

    // get transflation between hal-service-name and name on ts class
    const halToTs = Reflect.getMetadata("halClient:halToTs", c.prototype) || {};

    for (const key in json) {
      if ("_links" === key) {
        const links = json._links;
        resource.links =  Object.keys(links)
                            .filter((item) => item !== "self")
                            .reduce((prev, currentKey) => {
                              if ("string" === typeof links[currentKey]) {
                                links[currentKey] = {href : links[currentKey]};
                              }
                              const type =  Reflect.getMetadata("halClient:specificType", c.prototype, currentKey)
                                            || HalResource;
                              const propKey = halToTs[currentKey] || currentKey;
                              prev[propKey] = createResource(this, type, links[currentKey].href);
                              return prev;
                            }, {});

        resource.uri = "string" === typeof links.self ? links.self : links.self.href;
      } else if ("_embedded" === key) {
        const embedded = json._embedded;
        for (const prop of Object.keys(embedded)) {
          const propKey = halToTs[prop] || prop;
          resource.props[propKey] = this.parseJson(embedded[prop], c, propKey);
        }
      } else {
        const propKey = halToTs[key] || key;
        resource.props[propKey] = this.parseJson(json[key], c, propKey);
      }
    }

    resource.isLoaded = true;
    return resource;
  }
}
