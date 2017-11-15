import { createClient, createResource, HalProperty, HalResource, resetCache } from "../";

import * as nock from "nock";
import { test } from "tape-async";

// mock list response
function initTests() {
  nock.cleanAll();
  resetCache();

  const resource = {
    _links: {
      other: {
        href: "http://test.fr/other",
        type: "application/json",
      },
      self: {
        href : "http://test.fr/testResource",
      },
    },
    name: "test",
  };

  const other = {
    _links: {
      self: {
        href : "http://test.fr/other",
      },
    },
    name: "other",
  };

  const testNock = nock("http://test.fr/");

  testNock
    .get("/testResource")
    .reply(200, resource);

  testNock
    .get("/other")
    .reply(200, other);
}

test("can get link prop", async (t) => {
  initTests();
  const client = createClient("http://test.fr/");

  const resource = await client.fetchResource("/testResource");

  t.equals(resource.link("other").prop("type"), "application/json");
});

test("can get link prop after fetch done", async (t) => {
  initTests();
  const client = createClient("http://test.fr/");

  const resource = await client.fetchResource("/testResource");
  const link = await resource.link("other").fetch();

  t.equals(link.prop("type"), "application/json");
  t.equals(link.prop("name"), "other");
});
