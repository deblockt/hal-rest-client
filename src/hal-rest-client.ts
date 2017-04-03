import Axios from "axios";
import "reflect-metadata";

import { createResource } from "./hal-factory";
import { JSONParser } from "./hal-json-parser";
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
  private jsonPaser;

  constructor(private baseURL ?: string, headers: object = {}) {
    this.axios = Axios.create({baseURL, headers});
    this.setJsonParser(new JSONParser(this));
  }

  /**
   * fetch an URI on HalResource
   *
   * @resourceURI : The uri to fetch
   */
  public fetchResource(resourceURI: string): Promise<HalResource> {
    return this.fetch(resourceURI, HalResource);
  }

  /**
   * fetch an array by URI. Rest result can be a simple array of hal resouce, or han hal resource who have a
   * property who is array of resource on _embedded.
   *
   * @resourceURI : the uri of resource to fetch
   * @c : model class to map result (array items). if you don't write your model, use HalResource class
   */
  public fetchArray<T extends IHalResource>(resourceURI: string, c: IHalResourceConstructor<T>): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.axios.get(resourceURI).then((value) => {
        if (Array.isArray(value.data)) {
          resolve(value.data.map((item) => this.jsonPaser.jsonToResource(item, c)));
        } else {
          const halResource = this.jsonPaser.jsonToResource(value.data, c);
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

  /**
   * call an URI to fetch a resource
   *
   * @resourceURI : the uri of resource to fetch
   * @c : the class to use to fetch. If you don't want to write you model, use HalResource or @{see fetchResource}
   * @resource : don't use. internal only
   */
  public fetch<T extends IHalResource>(resourceURI: string, c: IHalResourceConstructor<T>,  resource ?: T): Promise<T> {
    return new Promise((resolve, reject) => {
      this.axios.get(resourceURI).then((value) => {
        resolve(this.jsonPaser.jsonToResource(value.data, c, resource));
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
   * set the json parser
   */
  public setJsonParser(parser: JSONParser) {
    this.jsonPaser = parser;
  }
}
