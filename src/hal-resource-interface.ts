import { HalRestClient } from "./hal-rest-client";
import { URI } from "./uri";

export interface IHalResourceConstructor<T extends IHalResource> {
  new (restClient: HalRestClient, uri ?: URI): T;
}

export interface IHalResource {
  isLoaded: boolean;
  uri: URI;

  /**
   * fetch the current resource
   *
   * @param forceOrParams: if uri is a templated link you can use object to set template parameters
   *                        in this case fetch is already done
   *                       if uri is non a template link you can use true to force fetch to be done (refersh resource)
   */
  fetch(forceOrParams: boolean|object): Promise<this>;

  /**
   * fetch an array of the current resource
   *
   * Unlike #fetch(boolean|object) this method needs #uri to be set. So it's not possible to fetch a resource in
   * advance.
   *
   * @param {object} params: If the uri is a template link, you can set the parameters.
   * @param {IHalResourceConstructor<this>} resource: An optional resource to create the array items of.
   * @returns {Promise<this[]>} Will return an array of resources.
   */
  fetchArray(params?: object, resource?: IHalResourceConstructor<this>): Promise<this[]>;

  /**
   * get or set a prop or a link.
   * if name is a link. link function is used
   * @param name : the prop/link name
   * @param value : the value to set. Use null to clear value not undefined
   */
  prop(name: string, value ?: any): any;

  /**
   * get or set a link.
   * @param name : the link name
   * @param value : the new resource. If you want reset a link use null and not undefined
   */
  link(name: string, value ?: IHalResource): IHalResource;

  /**
   * function called when object is populated
   */
  onInitEnded();
}
