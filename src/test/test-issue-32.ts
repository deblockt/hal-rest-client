import { test } from "tape-async";

import { createClient, HalResource, resetCache } from "../";

import * as nock from "nock";

// mock list response
function initTests() {
  nock.cleanAll();
  resetCache();
  const project1 = {
    _links: {
      related: [
        { href: "http://test.fr/projects/1" },
        { href: "http://test.fr/projects/2" },
        { href: "http://test.fr/projects/3" },
      ],
      self: {
        href: "http://test.fr/projects/1",
      },
    },
    test: "test",
  };

  const project2 = {
    _links: {
      self: {
        href: "http://test.fr/projects/2",
      },
    },
  };

  const testNock = nock("http://test.fr/");

  testNock
    .get("/projects/1")
    .reply(200, project1);

  testNock
    .get("/projects/2")
    .reply(200, project2);
}

test("list of links are resources", async (t) => {
  initTests();
  const project = await createClient().fetch("http://test.fr/projects/1", HalResource);
  const related = project.link("related");
  t.equals(Array.isArray(related), true);
  t.equals(related.every((item) => item instanceof HalResource), true);
});

test("list links can be fetched", async (t) => {
  initTests();
  const project = await createClient().fetch("http://test.fr/projects/1", HalResource);
  const related = project.link("related");
  await related[0].fetch();
  t.equals(related[0].prop("test"), "test");
});
