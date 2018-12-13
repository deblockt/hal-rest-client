import { HalProperty, HalResource } from "../../";

import { Contacts } from "./contacts";
import { Location } from "./location";

export class Person extends HalResource {
  @HalProperty()
  public name;

  @HalProperty("my-friends", Person)
  public myFriends: Person[];

  @HalProperty(Person)
  public mother: any;

  @HalProperty(Person)
  public father: any;

  @HalProperty()
  public contacts: Contacts;

  @HalProperty("best-friend")
  public bestFriend: Person;

  @HalProperty(Location)
  public home: Location;

  @HalProperty("place-of-employment", Location)
  public work: Location;
}
