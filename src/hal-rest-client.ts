import Axios from 'axios';
import 'reflect-metadata';

import { HalResource } from './hal-resource';
import { IHalResource, IHalResourceConstructor} from './hal-resource-interface';
import { createResource } from './hal-factory';

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

  constructor(private baseUrl ?: string, headers : Object = {}) {
    this.axios = Axios.create({baseURL : baseUrl, headers : headers});
  }

  fetchResource(resourceURI : string) : Promise<HalResource> {
    return this.fetch(resourceURI, HalResource);
  }

  fetchArray<T extends IHalResource>(resourceURI : string, c : IHalResourceConstructor<T>) : Promise<Array<T>> {
    // TODO use HalArray instead of this shit
    return this.fetchResource(resourceURI).then((halResource) => {
      var array = [];
      var source = halResource.prop(Object.keys(halResource.props)[0]);
      for (let item of source) {
        var resource = createResource(item.uri, c);
        resource.props = item.props;
        resource.links = item.links;
        resource.isLoaded = item.isLoaded;
        array.push(resource);
      }
      return array;
    });
  }

  fetch<T extends IHalResource>(resourceURI : string, c : IHalResourceConstructor<T>,  resource ?: T): Promise<T> {
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
  addHeader(name : string, value : string): HalRestClient {
    this.axios.defaults.headers.common[name] = value;
    return this;
  }

  /**
   * parse a json to object
   */
  private parseJson(json, clazz ?: {prototype : any}, key ?: string): any {
    // if there are _links prop object is a resource
    if (Array.isArray(json)) {
      var type = Reflect.getMetadata("halClient:specificType", clazz.prototype, key) || HalResource;
      return json.map((item) => this.jsonToResource(item, type));
    } else if (typeof json == 'object' && json['_links'] != undefined) {
      var type = Reflect.getMetadata("halClient:specificType", clazz.prototype, key) || HalResource;
      return this.jsonToResource(json, type);
    } else {
      return json;
    }
  }


  /**
   * convert a json to an halResource
   */
  private jsonToResource<T extends IHalResource>(json : any, c: IHalResourceConstructor<T>, resource : T = createResource(this, c)) : T {
    if (!('_links' in json)) {
        throw new Error('object is not hal resource');
    }

    // get transflation between hal-service-name and name on ts class
    var halToTs = Reflect.getMetadata("halClient:halToTs", c.prototype) || {};

    for (var key in json) {
      if ('_links' == key) {
        var links = json['_links'];
        resource.links =  Object.keys(links)
                            .filter((item) => item != 'self')
                            .reduce((prev, key) => {
                              var type = Reflect.getMetadata("halClient:specificType", c.prototype, key) || HalResource;
                              var propKey = halToTs[key] || key;
                              prev[propKey] = createResource(this, type, links[key]['href']);
                              return prev;
                            }, {});
        resource.uri = links['self']['href'];
      } else if ('_embedded' == key) {
        var embedded = json['_embedded'];
        for (var prop in embedded) {
          var propKey = halToTs[prop] || prop;
          resource.props[propKey] = this.parseJson(embedded[prop], c, propKey);
        }
      } else {
        var propKey = halToTs[key] || key;
        resource.props[propKey] = this.parseJson(json[key], c, propKey);
      }
    }

    resource.isLoaded = true;
    return resource;
  }
}
