import { HalProperty, HalResource } from "../../";

export class Location extends HalResource {
  @HalProperty()
  public address: string;
}
