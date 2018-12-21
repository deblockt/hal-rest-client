import { createClient, createResource, HalProperty, HalResource, resetCache } from "../";

import * as nock from "nock";
import { test } from "tape-async";

import { Contacts } from "./model/contacts";

// mock list response
function initTests() {
  resetCache();
  nock.cleanAll();

  const testNock = nock("http://test.fr/");

  testNock
    .delete("/person/1")
    .reply(204);

  testNock
    .delete("/person/2")
    .reply(200, {success : "ok"});

  testNock
    .delete("/person/2/contacts")
    .reply(200, {
      _links : {
        self : {
          href : "http://test.fr/person/2/contacts",
        },
      },
      phone : "xxxxxxxxxx",
    });
}

test("can delete simple person", async (t) => {
  initTests();

  const result = await createClient().delete("http://test.fr/person/1");
  t.equals(result.status, 204);
});

test("can delete person usin HalResource", async (t) => {
  initTests();
  const client = createClient();

  const resource = createResource(client, HalResource, "http://test.fr/person/1");
  const result = await client.delete(resource);

  t.equals(result.status, 204);
});

test("delete return server json response", async (t) => {
  initTests();
  const client = createClient();

  const resource = createResource(client, HalResource, "http://test.fr/person/2");
  const result = await client.delete(resource);

  t.equals(result.success, "ok");
});

test("delete read halResource json response", async (t) => {
  initTests();
  const client = createClient();

  const resource = createResource(client, HalResource, "http://test.fr/person/2/contacts");
  const result = await client.delete(resource);

  t.equals(result.prop("phone"), "xxxxxxxxxx");
  t.equals(result.uri.uri, "http://test.fr/person/2/contacts");
});

test("delete read model class json response", async (t) => {
  initTests();
  const client = createClient();

  const resource = createResource(client, Contacts, "http://test.fr/person/2/contacts");
  const result = await resource.delete();

  t.ok(result instanceof Contacts, "result is a contacts");
  t.equals(result.phone, "xxxxxxxxxx");
  t.equals(result.uri.uri, "http://test.fr/person/2/contacts");
});
