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

test("can update person using HalResource", async (t) => {
  initTests();
  const client = createClient();

  const resource = await client.fetchResource("http://test.fr/person/1");
  resource.prop("name", "test");
  resource.prop("best-friend", await client.fetchResource("http://test.fr/person/12"));

  const scope = nock(basePath)
    .intercept("/person/1", "PATCH", {"name": "test", "best-friend" : "http://test.fr/person/12"})
    .reply(200);

  try {
    const result = await resource.update();
    t.equals(result.status, 200);
  } catch (e) {
    t.fail(e.message);
  }

  scope.done();
});

test("can update link using HalResource", async (t) => {
  initTests();
  const client = createClient();

  const resource = await client.fetchResource("http://test.fr/person/1");
  resource.prop("name", "test");
  await resource.prop("contactInfos").fetch();
  resource.prop("contactInfos").prop("phone", "06XX1245XX");

  const scope = nock(basePath)
    .intercept("/person/1", "PATCH", {name: "test"})
    .reply(200);
  scope
    .intercept("/person/2/contactInfos", "PATCH", {phone: "06XX1245XX"})
    .reply(200);

  try {
    const [result, result2] = await Promise.all([resource.update(), resource.prop("contactInfos").update()]);
    t.equals(result.status, 200);
    t.equals(result2.status, 200);
  } catch (e) {
    t.fail(e.message);
  }

  scope.done();
});

test("can update new link of a HalResource", async (t) => {
  initTests();
  const client = createClient("http://test.fr");

  const resource = await client.fetchResource("/person/1");
  resource.prop("name", "new name");
  resource.prop("project", await client.fetchResource("/project/5"));

  const scope = nock(basePath)
    .intercept("/person/1", "PATCH", {name: "new name", project : "http://test.fr/project/5"})
    .reply(200);

  try {
    const result = await resource.update();
    t.equals(result.status, 200);
  } catch (e) {
    t.fail(e.message);
  }

  scope.done();
});

test("can update undefined prop and link", async (t) => {
  initTests();
  const client = createClient("http://test.fr");

  const resource = await client.fetchResource("/person/1");
  resource.prop("name", null);
  resource.prop("project", null);

  const scope = nock(basePath)
    .intercept("/person/1", "PATCH", {name: undefined, project : undefined})
    .reply(200);

  try {
    const result = await resource.update();
    t.equals(result.status, 200);
  } catch (e) {
    t.fail(e.message);
  }

  scope.done();
});

test("can update with custom serializer", async (t) => {
  initTests();
  const client = createClient("http://test.fr");

  const resource = await client.fetchResource("/person/1");
  resource.prop("name", "test");
  resource.prop("project", await client.fetchResource("/project/5"));

  const scope = nock(basePath)
    .intercept("/person/1", "PATCH", {name: "serializer.test", project : "serializer2.http://test.fr/project/5"})
    .reply(200);

  try {
    const result = await resource.update({
      parseProp : (value) => "serializer." + value,
      parseResource : (value) => "serializer2." + value.uri,
    });
    t.equals(result.status, 200);
  } catch (e) {
    t.fail(e.message);
  }

  scope.done();
});
