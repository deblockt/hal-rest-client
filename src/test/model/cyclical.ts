import { HalProperty, HalResource } from "../../";

export class Cyclical extends HalResource {
  @HalProperty()
  public property: string;

}

export class CyclicalList extends HalResource {
  @HalProperty(Cyclical)
  public cyclicals: Cyclical[];

  @HalProperty()
  public refresh: CyclicalList;
}
