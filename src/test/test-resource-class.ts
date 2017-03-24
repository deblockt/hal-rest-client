import { HalResource } from '../hal-resource';
import { HalProperty } from '../hal-decorator';
import { HalArray } from '../hal-array';

import { createClient, createResource } from '../hal-factory';

import { test } from 'tape-async';
import * as nock from 'nock';

class ContactInfos extends HalResource {
  @HalProperty()
  public phone: string;
}

class Person extends HalResource {
  @HalProperty()
  public name;

  @HalProperty({name : 'my-friends', type : Person})
  public myFriends: Array<Person>;

  @HalProperty({type : Person})
  public mother: any;

  @HalProperty(Person)
  public father: any;

  @HalProperty()
  public contactInfos : ContactInfos;

  @HalProperty("best-friend")
  public bestFriend: Person;
}

// mock list response
function initTests() {
  var person1 = {
    "name" : "Project 1",
    "_embedded" : {
        "my-friends" : [
            {
                "_links" : { "self" : { "href" : "http://test.fr/person/5" }},
                "name" : "Thomas"
            }
        ],
        "best-friend" : {
          "name" : "My bestfriend",
          "_links" : {
            "self" : {
              "href" : "http://test.fr/person/2"
            }
          }
        },
        "mother" : {
          "name" : "My mother",
          "_links" : {
            "self" : {
              "href" : "http://test.fr/person/12"
            }
          }
        },
        "father" : {
          "name" : "My father",
          "_links" : {
            "self" : {
              "href" : "http://test.fr/person/12"
            }
          }
        }
    },
    "_links" : {
      "self" : {
        "href" : "http://test.fr/person/1"
      },
      "contactInfos" : {
        "href" : "http://test.fr/person/2/contactInfos"
      }
    }
  };

  var contactInfos = {
    "phone" : "xxxxxxxxxx",
    "_links" : {
      "self" : {
        "href" : "http://test.fr/person/2/contactInfos"
      },
    }
  };

  var testNock = nock('http://test.fr/');

  testNock
    .get('/person/1')
    .reply(200, person1);
  testNock
    .get('/person/2/contactInfos')
    .reply(200, contactInfos);
}

test('can get single string prop', async function(t) {
  initTests();
  let client = createClient('http://test.fr/');
  let person = await client.fetch('/person/1', Person);
  t.equals(person.name, 'Project 1');
  t.ok(person.bestFriend instanceof Person, 'bestfriend is a person');
  t.ok(person.mother instanceof Person, 'mother is a person');
  t.ok(person.father instanceof Person, 'father is a person');
  t.equals(person.bestFriend.name, 'My bestfriend');
  t.equals(person.contactInfos.phone, undefined);
  await person.contactInfos.fetch();
  t.equals(person.contactInfos.phone, "xxxxxxxxxx");
  t.equals(person.myFriends.length, 1);
  for (let friend of person.myFriends) {
    t.equals(friend.name, "Thomas");
  }

  person.name = "Toto";
  t.equals(person.name, "Toto");
});

test('bad use of @HalProperty show error', async function(t) {
  try {
    class Test extends HalResource {
      @HalProperty({errur : true})
      public test;
    }
    t.fail('Bad property must throw error');
  } catch (e) {
    t.equals(e.message, "Test.test Parameter of @HalProperty is unreadable. read @HalProperty documentation.");
  }
});
