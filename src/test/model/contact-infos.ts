import { HalProperty, HalResource } from "../../";

export class ContactInfos extends HalResource {
  @HalProperty()
  public phone: string;
}
