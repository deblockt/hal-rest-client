import { createClient, createResource, HalProperty, HalResource, resetCache } from "../";

import * as nock from "nock";
import { test } from "tape-async";

// mock list response
function initTests() {
  nock.cleanAll();
  resetCache();

  const noSelfResource = {
    _links: {
      other: {
        href: "http://test.fr/other"
      },
    },
    name: "test",
  };

  const withSubResourceWithoutSelf = {
    _embedded: {
      commessa: [
        {
          _links: {
            self: {
                href: "http://localhost:8180/registrazioni/data/commessa/24"
            },
          },
          descrizione: "GIRARDI ELDA",
          lavorazioni: [
            {
              _links: {
                commessa: {
                  href: "http://test.fr/testResource"
                },
                lavorazione: {
                  href: "http://test.fr/testResource2"
                },
              },
            },
          ],
        },
      ],
    },
    _links: {
      self: {
        href: "http://test.fr/registrazioni/data/commessa{?page,size,sort}",
        templated: true,
      },
    },
  };

  const testNock = nock("http://test.fr/");

  testNock
    .get("/testResource")
    .reply(200, noSelfResource);

  testNock
    .get("/withSubResourceWithoutSelf")
    .reply(200, withSubResourceWithoutSelf);
}

test("can fetch resource withouth self link", async (t) => {
  initTests();
  const client = createClient("http://test.fr/");

  const resource = await client.fetchResource("/testResource");

  t.equals(resource.uri, undefined);
  t.equals(resource.prop("name"), "test");
});

test("can call fetch without error on an resource", async (t) => {
  initTests();
  const client = createClient("http://test.fr/");

  const resource = await client.fetchResource("/testResource");

  const fetched = await resource.fetch(true);
  t.equals(fetched, resource);
});

test("can fetch entity with subresource", async (t) => {
  initTests();
  const client = createClient("http://test.fr/");
  const resource = await client.fetchResource("/withSubResourceWithoutSelf");

  const subResourceWithoutSelf = resource.prop("commessa")[0].prop("lavorazioni")[0];

  t.equals(subResourceWithoutSelf.uri, undefined);

  const commessa = await subResourceWithoutSelf.prop("commessa").fetch();
  t.equals(commessa.prop("name"), "test");
});