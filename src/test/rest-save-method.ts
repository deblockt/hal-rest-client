import { createClient, createResource, HalProperty, HalResource, resetCache } from "../";

import * as nock from "nock";
import { test } from "tape-async";

import { ContactInfos } from "./model/contact-infos";

let testNock;
const basePath = "http://test.fr/";

// mock list response
function initTests() {
  resetCache();
  nock.cleanAll();
  const newBestFriend = {
    _links : {
      self : {
        href : "http://test.fr/person/12",
      },
    },
    name : "New bestfriend",
  };

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
    },
    _links : {
      contactInfos : {
        href : "http://test.fr/person/2/contactInfos",
      },
      project: {
        href: "http://test.fr/project/4",
      },
      self : {
        href : "http://test.fr/person/1",
      },
    },
    name : "Person 1",
  };

  const project5 = {
    _links : {
      self : {
        href : "http://test.fr/project/5",
      },
    },
    name : "Project 5",
  };

  const contactInfos = {
    _links : {
      self : {
        href : "http://test.fr/person/2/contactInfos",
      },
    },
    phone : "xxxxxxxxxx",
  };

  testNock = nock(basePath);

  testNock
    .get("/person/1")
    .reply(200, person1);

  testNock
    .get("/person/12")
    .reply(200, newBestFriend);

  testNock
    .get("/person/2/contactInfos")
    .reply(200, contactInfos);

  testNock
    .get("/project/5")
    .reply(200, project5);
}

test("can save person using rest-client", async (t) => {
  initTests();
  const client = createClient();

  const scope = nock(basePath)
    .post("/persons", { name: "ThoMas" })
    .reply(200, {name : "Thomas", _links: { self : { url : "http://test.fr/persons/2" } } });

  try {
    const resource = await client.save("http://test.fr/persons", { name: "ThoMas" });
    t.equals(resource.prop("name"), "Thomas");
  } catch (e) {
    t.fail(e.message);
  }
  scope.done();
});

test("can save person using HalResource", async (t) => {
  initTests();
  const client = createClient();

  let resource = createResource(client, HalResource, "http://test.fr/persons");
  resource.prop("name", "ThoMas");

  const scope = nock(basePath)
    .post("/persons", { name: "ThoMas" })
    .reply(200, {name : "Thomas", _links: { self : { url : "http://test.fr/persons/2" } } });

  try {
    resource = await resource.save();
    t.equals(resource.prop("name"), "Thomas");
  } catch (e) {
    t.fail(e.message);
  }
  scope.done();
});
