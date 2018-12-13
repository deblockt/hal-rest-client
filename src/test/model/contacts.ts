import { HalProperty, HalResource } from "../../";

export class Contacts extends HalResource {
  @HalProperty()
  public phone: string;
}
