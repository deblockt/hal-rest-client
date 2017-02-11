import Axios from 'axios';
import { HalResource } from './hal-resource';

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

  constructor(private baseUrl ?: string) {
  }

  private getUrl(resourceURI: string): string {
    if (!resourceURI.startsWith('http')) {
      if (resourceURI.startsWith('/') && this.baseUrl.endsWith('/')) {
        resourceURI = this.baseUrl + resourceURI.substr(1);
      } else {
        resourceURI = this.baseUrl + resourceURI;
      }
    }
    return resourceURI;
  }

  fetch(resourceURI : string, resource ?: HalResource): Promise<HalResource> {
    resourceURI = this.getUrl(resourceURI);
    return new Promise((resolve, reject) => {
      Axios.create().get(resourceURI).then((value) => {
        resolve(this.jsonToResource(value.data, resource));
      }).catch(reject);
    });
  }

  private jsonToResource(json : any, resource : HalResource = new HalResource(this)) : any {
    // if there are _links prop object is a resource
    if (Array.isArray(json)) {
      return json.map((item) => this.jsonToResource(item));
    } else if (typeof json == 'object' && json['_links'] != undefined) {
      for (var key in json) {
        if ('_links' == key) {
          var links = json['_links'];
          resource.links =  Object.keys(links)
                              .filter((item) => item != 'self')
                              .reduce((prev, key) => {prev[key] = new HalResource(this, links[key]['href']); return prev}, {});
          resource.uri = links['self']['href'];
        } else if ('_embedded' == key) {
          var embedded = json['_embedded'];
          for (var prop in embedded) {
            resource.props[prop] = this.jsonToResource(embedded[prop]);
          }
        } else {
          resource.props[key] = this.jsonToResource(json[key]);
        }
      }

      resource.isLoaded = true;
      return resource;
    } else {
      return json;
    }
  }
}
