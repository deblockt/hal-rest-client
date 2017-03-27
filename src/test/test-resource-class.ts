import { createClient, createResource, HalProperty, HalResource, resetCache } from "../";

import * as nock from "nock";
import { test } from "tape-async";

import { ContactInfos } from "./model/contact-infos";
import { Person } from "./model/person";

// mock list response
function initTests() {
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
    .reply(200, [JSON.parse(JSON.stringify(person1))]);
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
  await person.contactInfos.fetch();
  t.equals(person.contactInfos.phone, "xxxxxxxxxx");
  t.equals(person.myFriends.length, 1);
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

test("can fetch simple Array of Person", async (t) => {
  initTests();
  const client = createClient("http://test.fr/");
  const persons = await client.fetchArray("/personsSimpleArray", Person);
  t.equals(persons.length, 1);
  t.ok(persons[0] instanceof Person, "items is a person");
  t.equals(persons[0].name, "Project 1");
});

test("bad use of @HalProperty show error", async (t) => {
  try {
    class Test extends HalResource {
      @HalProperty({errur : true})
      public test;
    }
    t.fail("Bad property must throw error");
  } catch (e) {
    t.equals(e.message, "Test.test Parameter of @HalProperty is unreadable. Read @HalProperty documentation.");
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
