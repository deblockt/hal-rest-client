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
   */
  prop(name: string, value ?: any): any;

  /**
   * get or set a link
   */
  link(name: string, value ?: IHalResource): IHalResource;
}
