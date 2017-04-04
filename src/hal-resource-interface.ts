import { HalRestClient } from "./hal-rest-client";

export interface IHalResourceConstructor<T extends IHalResource> {
  new (restClient: HalRestClient, uri ?: string): T;
}

export interface IHalResource {
  isLoaded: boolean;
  uri: string;

  fetch(force: boolean): Promise<this>;

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
