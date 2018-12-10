import { createResource } from "./hal-factory";
import { HalResource } from "./hal-resource";
import { IHalResource, IHalResourceConstructor } from "./hal-resource-interface";
import { HalRestClient } from "./hal-rest-client";
import { URI } from "./uri";

export class JSONParser {

  constructor(private halRestClient: HalRestClient) {}

  /**
   * convert a json to an halResource
   */
  public jsonToResource<T extends IHalResource>(
    json: any,
    c: IHalResourceConstructor<T>,
    resource?: T,
    fetchedURI?: string,
  ): T {
    if (!("_links" in json)) {
        throw new Error("object is not hal resource " + JSON.stringify(json));
    }

    if (!resource) {
      let uri;
      if (json._links.self) {
        uri = "string" === typeof json._links.self ? json._links.self : json._links.self.href;
      }
      resource = createResource(this.halRestClient, c, uri);
    }

    // get translation between hal-service-name and name on ts class
    const halToTs = Reflect.getMetadata("halClient:halToTs", c.prototype) || {};

    const processLink = (link, linkKey) => {
      const href = this.extractURI(link);
      const type = Reflect.getMetadata("halClient:specificType", c.prototype, linkKey) || HalResource;
      const linkResource = createResource(this.halRestClient, type, href);
      for (const propKey of Object.keys(link)) {
        linkResource.prop(propKey, link[propKey]);
      }
      return linkResource;
    };

    for (const key in json) {
      if ("_links" === key) {
        const links = json._links;
        for (const linkKey in json._links) {
          if ("self" !== linkKey) {
            if (json._links.hasOwnProperty(linkKey)) {
              const propKey = halToTs[linkKey] || linkKey;
              const link = links[linkKey];
              const result = Array.isArray(link)
                ? link.map((item) => processLink(item, linkKey))
                : processLink(link, linkKey);
              resource.link(propKey, result);
            }
          }
        }
        if (links.self) {
          resource.uri = this.extractURI(links.self, fetchedURI);
        }
      } else if ("_embedded" === key) {
        const embedded = json._embedded;
        for (const prop of Object.keys(embedded)) {
          const propKey = halToTs[prop] || prop;
          resource.prop(propKey, this.parseJson(embedded[prop], c, propKey));
        }
      } else {
        const propKey = halToTs[key] || key;
        resource.prop(propKey, this.parseJson(json[key], c, propKey));
      }
    }

    resource.isLoaded = true;
    resource.onInitEnded();

    return resource;
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
      return json.map((item) => this.parseJson(item, clazz, key));
    } else if (typeof json === "object" && json._links !== undefined) {
      const type = Reflect.getMetadata("halClient:specificType", clazz.prototype, key) || HalResource;
      return this.jsonToResource(json, type);
    } else {
      return json;
    }
  }

  private extractURI(link: string|{href ?: string, templated ?: boolean}, fetchedURI?: string): URI {
    if (typeof link === "string") {
      return new URI(link, false, fetchedURI);
    } else {
      const uri = link.href;
      const templated = link.templated || false;
      return new URI(uri, templated, fetchedURI);
    }
  }
}
