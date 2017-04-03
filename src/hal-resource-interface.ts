import { HalRestClient } from "./hal-rest-client";

export interface IHalResourceConstructor<T extends IHalResource> {
  new (restClient: HalRestClient, uri ?: string): T;
}

export interface IHalResource {
  links: object;
  isLoaded: boolean;
  uri: string;

  fetch(force: boolean): Promise<IHalResource>;

  /**
   * get or set a prop or a link.
   * if name is a link. link function is used
   */
  prop(name: string, value ?: string): any;

  /**
   * get or set a link
   */
  link(name: string, value ?: string): IHalResource;
}
