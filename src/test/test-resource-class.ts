import { createClient, createResource, HalProperty, HalResource, resetCache } from "../";

import * as nock from "nock";
import { test } from "tape-async";

import { ContactInfos } from "./model/contact-infos";
import { Cyclical, CyclicalList } from "./model/cyclical";
import { Person } from "./model/person";
import {ArrayResource, ArrayResourceItem} from './model/array-resource';

// mock list response
function initTests() {
  nock.cleanAll();
  resetCache();

  const person1 = {
    _embedded : {
        "best-friend" : {
          _links : {
            self : {
              href : "http://test.fr/person/2",
            },
          },
          name : "My bestfriend",
        },
        "father" : {
          _links : {
            self : {
              href : "http://test.fr/person/12",
            },
          },
          name : "My father",
        },
        "mother" : {
          _links : {
            self : {
              href : "http://test.fr/person/12",
            },
          },
          name : "My mother",
        },
        "my-friends" : [
            {
                _links : { self : { href : "http://test.fr/person/5" }},
                name : "Thomas",
            },
        ],
    },
    _links : {
      contactInfos : {
        href : "http://test.fr/person/2/contactInfos",
      },
      self : {
        href : "http://test.fr/person/1",
      },
    },
    name : "Project 1",
  };

  const contactInfos = {
    _links : {
      self : {
        href : "http://test.fr/person/2/contactInfos",
      },
    },
    phone : "xxxxxxxxxx",
  };

  const testNock = nock("http://test.fr/");

  testNock
    .get("/person/1")
    .reply(200, person1);
  testNock
      .get("/person/1")
      .reply(200, person1);

  testNock
    .get("/person/2/contactInfos")
    .reply(200, contactInfos);
  testNock
    .get("/persons")
    .reply(200, {
        _embedded : { persons : [JSON.parse(JSON.stringify(person1))] },
        _links : {self : {href : "http://test.fr/person"}},
    });
  testNock
    .get("/personsSimpleArray")
    .reply(200, [JSON.parse(JSON.stringify(person1)), {
      _links : {
        self : {
          href : "http://test.fr/person/13",
        },
      },
      name : null,
    }]);

  const cyclicals = {
    _embedded : {
      cyclicals : [
        {
          _links : {
            self : "http://test.fr/cyclicals/1",
          },
          property : "name",
        },
      ],
    },
    _links: {
      refresh : "http://test.fr/cyclicals/refresh",
      self : "http://test.fr/cyclicals",
    },
  };

  testNock
    .get("/cyclicals")
    .reply(200, cyclicals);

  testNock
    .get("/cyclicals/refresh")
    .reply(200, cyclicals);

  testNock
    .get("/cyclicals/refresh")
    .reply(200, cyclicals);

  const arrayResource = {
    _links: {
      self: 'http://test.fr/array',
    },
    items: [
      {id: 1, _links: {self: {href: 'http://test.fr/array/1'}}},
      {id: 2, _links: {self: {href: 'http://test.fr/array/2'}}},
    ],
  };

  testNock
    .get("/arrayResource")
    .reply(200, arrayResource);
}

test("can get single string prop", async (t) => {
  initTests();
  const client = createClient("http://test.fr/");
  const person = await client.fetch("/person/1", Person);
  t.equals(person.name, "Project 1");
  t.ok(person.bestFriend instanceof Person, "bestfriend is a person");
  t.ok(person.mother instanceof Person, "mother is a person");
  t.ok(person.father instanceof Person, "father is a person");
  t.equals(person.bestFriend.name, "My bestfriend");
  t.equals(person.contactInfos.phone, undefined);
  const contactInfos = await person.contactInfos.fetch();
  t.equals(person.contactInfos.phone, "xxxxxxxxxx");
  t.equals(person.myFriends.length, 1);
  t.ok(contactInfos instanceof ContactInfos);
  t.equals(contactInfos.phone, "xxxxxxxxxx");
  for (const friend of person.myFriends) {
    t.equals(friend.name, "Thomas");
  }

  person.name = "Toto";
  t.equals(person.name, "Toto");
});

test("can fetch Array of Person", async (t) => {
  initTests();
  const client = createClient("http://test.fr/");
  const persons = await client.fetchArray("/persons", Person);
  t.equals(persons.length, 1);
  t.ok(persons[0] instanceof Person, "items is a person");
  t.equals(persons[0].name, "Project 1");
});

test("fetch array who is not hal-resource throw exception", async (t) => {
  initTests();
  const client = createClient("http://test.fr/");
  try {
    await client.fetchArray("/person/1", Person);
    t.ko("no error throwed");
  } catch (e) {
    t.equals(e.message, "property _embedded.best-friend is not an array");
  }
});

test("fetch bad hal resource throw exception", async (t) => {
  initTests();
  const client = createClient("http://test.fr/");
  try {
    await client.fetchArray("/person/2/contactInfos", ContactInfos);
    t.ko("no error throwed");
  } catch (e) {
    t.equals(e.message, "unparsable array. it's neither an array nor an halResource");
  }
});

test("can fetch simple Array of Person", async (t) => {
  initTests();
  const client = createClient("http://test.fr/");
  const persons = await client.fetchArray("/personsSimpleArray", Person);
  t.equals(persons.length, 2);
  t.ok(persons[0] instanceof Person, "items is a person");
  t.equals(persons[0].name, "Project 1");
  t.equals(persons[1].name, null);
});

test("bad use of @HalProperty show error", async (t) => {
  try {
    class Test extends HalResource {
      @HalProperty(Person, Person)
      public test;
    }
    t.fail("Bad property must throw error");
  } catch (e) {
    t.equals(e.message, "Test.test @HalProperty parameters are 'name' and 'type', not reverse");
  }
});

test("@HalProperty must have type for array", async (t) => {
  try {
    class Test extends HalResource {
      @HalProperty()
      public test: Cyclical[];
    }
    t.fail("@HalProperty must have type for array");
  } catch (e) {
    t.equals(e.message, "Test.test for Array you need to specify a type on @HalProperty." +
                        "Example : @HalProperty(HalResource) or  @HalProperty(ClassOfArrayContent)");
  }
});

test("refresh from cache reload from cached object", async (t) => {
  initTests();
  const client = createClient("http://test.fr/");
  const person = await client.fetch("/person/1", Person);
  t.equals(person.name, "Project 1");
  person.name = "test";
  t.equals(person.name, "test");
  await client.fetch("/person/1", Person);
  t.equals(person.name, "Project 1");
});

test("refresh from cache d'ont reaload from cached object after resetCache", async (t) => {
  initTests();
  const client = createClient("http://test.fr/");
  const person = await client.fetch("/person/1", Person);
  t.equals(person.name, "Project 1");
  person.name = "test";
  t.equals(person.name, "test");
  resetCache();
  await client.fetch("/person/1", Person);
  t.equals(person.name, "test");
});

test("can set object property", async (t) => {
  initTests();
  const client = createClient("http://test.fr/");
  const person = await client.fetch("/person/1", Person);
  t.equals(person.name, "Project 1");
  person.name = "test";
  t.equals(person.name, "test");
  const contactInfos = createResource(client, ContactInfos, "/contacInfos/3");
  person.contactInfos = contactInfos;
  t.equals(person.contactInfos, contactInfos);
});

test("cyclical property have good class type", async (t) => {
  initTests();
  const client = createClient("http://test.fr/");
  let cyclicals = await client.fetch("/cyclicals", CyclicalList);
  t.ok(cyclicals instanceof CyclicalList, "cyclicals have type CyclicalList");
  t.ok(cyclicals.refresh instanceof CyclicalList, "cyclicals.refresh have type CyclicalList");
  t.ok(Array.isArray(cyclicals.cyclicals), "cyclicals is an array");
  t.equals(cyclicals.cyclicals[0].property, "name");
  cyclicals = await cyclicals.refresh.fetch();
  t.ok(cyclicals instanceof CyclicalList, "cyclicals have type CyclicalList");
  t.ok(cyclicals.refresh instanceof CyclicalList, "cyclicals.refresh have type CyclicalList");
  t.ok(Array.isArray(cyclicals.cyclicals), "cyclicals is an array");
  t.equals(cyclicals.cyclicals[0].property, "name");
  cyclicals = await cyclicals.refresh.fetch();
  t.ok(cyclicals instanceof CyclicalList, "cyclicals have type CyclicalList");
  t.ok(cyclicals.refresh instanceof CyclicalList, "cyclicals.refresh have type CyclicalList");
  t.ok(Array.isArray(cyclicals.cyclicals), "cyclicals is an array");
  t.equals(cyclicals.cyclicals[0].property, "name");
});

test('fetching resource with array contains valid typed resources', async (t) => {
  initTests();

  const client = createClient('http://test.fr');
  const resource: ArrayResource = await client.fetch('/arrayResource', ArrayResource);

  t.ok(resource instanceof ArrayResource, 'Result has the correct type');
  t.ok(Array.isArray(resource.items), 'Result content is array');
  t.ok(resource.items.length === 2, 'Correct count of array items');
  t.ok(resource.items[0] instanceof ArrayResourceItem, 'Array item has correct type');
  t.ok(resource.items[0].id === 1, 'Correct item returned.');
});