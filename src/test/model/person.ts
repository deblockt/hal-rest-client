import { HalProperty, HalResource } from "../../";

import { ContactInfos } from "./contact-infos";

export class Person extends HalResource {
  @HalProperty()
  public name;

  @HalProperty({name : "my-friends", type : Person})
  public myFriends: Person[];

  @HalProperty({type : Person})
  public mother: any;

  @HalProperty(Person)
  public father: any;

  @HalProperty()
  public contactInfos: ContactInfos;

  @HalProperty("best-friend")
  public bestFriend: Person;
}
