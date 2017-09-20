import { createClient, createResource, HalProperty, HalResource, resetCache } from "../";

import * as nock from "nock";
import { test } from "tape-async";

// mock list response
function initTests() {
  nock.cleanAll();
  resetCache();

  const templatedSelf = {
    _embedded: {
        data: [
            {
                _links: {
                    href: "/data/test",
                },
                name: "test",
            },
        ],
    },
    _links: {
      find: {
        href: "data{?q}",
        templated: true,
      },
      findById: {
        href: "data{/id}",
        templated: true,
      },
      self: {
        href: "http://test.fr/data{?page,size,sort}",
        template: true,
      },
    },
  };

  const findResult = {
    _embedded: {
        data: [
            {
                _links: {
                    href: "/data/test",
                },
                name: "test",
            },
        ],
    },
    _links: {
      self: {
        href: "http://test.fr/q=test",
      },
    },
  };

  const byIdResult = {
    _links: {
      self: {
        href: "http://test.fr/data/demo",
      },
    },
    test: "demo",
  };

  const testNock = nock("http://test.fr/");

  testNock
    .get("/data?page=1")
    .reply(200, templatedSelf);

  testNock
    .get("/data/demo")
    .reply(200, byIdResult);

  testNock
    .delete("/data?page=1")
    .reply(200, "deleteOK");

  testNock
    .get("/data?q=test")
    .reply(200, findResult);
}

test("can fetch resource with self templated link", async (t) => {
  initTests();
  const client = createClient("http://test.fr/");

  const resource = await client.fetchResource("/data?page=1");

  t.equals(resource.uri.uri, "http://test.fr/data{?page,size,sort}");
  t.equals(resource.uri.realURI, "http://test.fr/data?page=1");
  t.equals(resource.prop("data").length, 1);
});

test("can fetch link using parameters", async (t) => {
    initTests();
    const client = createClient("http://test.fr/");

    const resource = await client.fetchResource("/data?page=1");
    const findLink = resource.link("find");

    t.equals(findLink.uri.templated, true);
    t.equals(findLink.uri.realURI, "");
    const findedResource = await findLink.fetch({q: "test"});

    t.equals(findedResource.prop("data")[0].prop("name"), "test");
    t.equals(findedResource.uri.realURI, "http://test.fr/data?q=test");
});

test("can use path parameter", async (t) => {
  initTests();
  const client = createClient("http://test.fr/");

  const resource = await client.fetchResource("/data?page=1");
  const fetched = await resource.link("findById").fetch({id: "demo"});

  t.equals(fetched.prop("test"), "demo");
});