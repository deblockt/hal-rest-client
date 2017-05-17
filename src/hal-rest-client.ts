import Axios from "axios";
import { AxiosResponse, AxiosInstance, AxiosRequestConfig, AxiosInterceptorManager } from "axios";

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
  private axios: AxiosInstance;
  private jsonPaser;

  constructor(private baseURL ?: string, options: AxiosRequestConfig = {}) {
    const config = options;
    config.baseURL = baseURL;
    this.axios = Axios.create(config);
    this.setJsonParser(new JSONParser(this));
  }

  /**
   * fetch an URI on HalResource
   *
   * @param resourceURI : The uri to fetch
   */
  public fetchResource(resourceURI: string): Promise<HalResource> {
    return this.fetch(resourceURI, HalResource);
  }

  /**
   * fetch an array by URI. Rest result can be a simple array of hal resouce, or han hal resource who have a
   * property who is array of resource on _embedded.
   *
   * @param resourceURI : the uri of resource to fetch
   * @param c : model class to map result (array items). if you don't write your model, use HalResource class
   */
  public fetchArray<T extends IHalResource>(resourceURI: string, c: IHalResourceConstructor<T>): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.axios.get(resourceURI).then((value) => {
        let array;
        if (!Array.isArray(value.data)) {
          if ("_embedded" in value.data) {
            const embedded = value.data._embedded;
            array = embedded[Object.keys(embedded)[0]];
            if (!Array.isArray(array)) {
              reject(new Error("property _embedded." + Object.keys(embedded)[0] + " is not an array"));
            }
          } else {
            reject(new Error("unparsable array. it's neither an array nor an halResource"));
          }
        } else {
          array = value.data;
        }
        resolve(array.map((item) => this.jsonPaser.jsonToResource(item, c)));
      }).catch(reject);
    });
  }

  /**
   * call an URI to fetch a resource
   *
   * @param resourceURI : the uri of resource to fetch
   * @param c : the class to use to fetch. If you don't want to write you model, use HalResource or @{see fetchResource}
   * @param resource : don't use. internal only
   */
  public fetch<T extends IHalResource>(resourceURI: string, c: IHalResourceConstructor<T>,  resource ?: T): Promise<T> {
    return new Promise((resolve, reject) => {
      this.axios.get(resourceURI).then((value) => {
        resolve(this.jsonPaser.jsonToResource(value.data, c, resource));
      }).catch(reject);
    });
  }

  /**
   * Delete object support
   *
   * according server, return can be :
   *   - the request
   *   - an halResource returned by server
   *   - a json object return by server
   *
   * @param resource : The resource to delete
   */
  public delete(resource: IHalResource|string): Promise<any> {
    let uri;
    let type;
    if (typeof resource === "string") {
      uri = resource;
      type = HalResource;
    } else {
      uri = resource.uri;
      type = resource.constructor;
    }

    return new Promise((resolve, reject) => {
      this.axios.delete(uri).then((value) => {
        this.resolveUnknowTypeReturn(resolve, value, type);
      }).catch(reject);
    });
  }

  /**
   * run put or patch request
   * @param url : resource url to update
   * @param json : request body send
   * @param full : true or false. true send put, false send patch. Default patch
   * @param type: if hal service return entity, type can be used to map return to an entity model
   */
  public update(
    url: string,
    data: object,
    full: boolean = false,
    type: IHalResourceConstructor<any> = HalResource,
  ): Promise<any> {
    const method = full ? "put" : "patch";

    return new Promise((resolve, reject) => {
      this.axios.request({data, method, url}).then((value) => {
        this.resolveUnknowTypeReturn(resolve, value, type);
      }).catch(reject);
    });
  }

  /**
   * run post request
   * @param uri {string} resource uri to update
   * @param json {object} request body send
   * @param type {IHalResourceConstructor} if hal service return entity, type can be used to map return to an entity model
   */
  public create(uri: string, json: object, type: IHalResourceConstructor<any> = HalResource): Promise<any> {
    return new Promise((resolve, reject) => {
      this.axios.post(uri, json).then((value) => {
        this.resolveUnknowTypeReturn(resolve, value, type);
      }).catch(reject);
    });
  }

  /**
   * add header configuration
   * @param header {string} the header name
   * @param value {string} the header value
   *
   * @return {HalRestClient} thiss
   */
  public addHeader(header: string, value: string): HalRestClient {
    this.config.headers.common[header] = value;
    return this;
  }

  /**
   * Get axios config for customization
   *
   * @return {AxiosRequestConfig}
   */
  public get config() {
    return this.axios.defaults;
  }

  /**
   * get axions config interceptor
   * @return {AxiosInterceptorManager}
   */
  public get interceptors() {
    return this.axios.interceptors;
  }

  /**
   * set the json parser
   * @param {JSONParser} the new json parser
   */
  public setJsonParser(parser: JSONParser) {
    this.jsonPaser = parser;
  }

  /**
   * resolve a service return (delete/patch/put/post)
   *
   * @param resolve : callback function
   * @param value : the returned value
   */
  private resolveUnknowTypeReturn(
    resolve: (data?) => void,
    value: AxiosResponse,
    type ?: IHalResourceConstructor<any>,
  ) {
    if (value.data) {
      if ("_links" in value.data) {
        resolve(this.jsonPaser.jsonToResource(value.data, type));
      } else {
        resolve(value.data);
      }
    } else {
      resolve(value);
    }
  }
}
