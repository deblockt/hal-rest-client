import { HalProperty, HalResource } from "../../";

export class Cyclical extends HalResource {
  @HalProperty()
  property: string;

}

export class CyclicalList extends HalResource {
  @HalProperty(Cyclical)
  cyclicals: Cyclical[];

  @HalProperty()
  refresh: CyclicalList;
}
