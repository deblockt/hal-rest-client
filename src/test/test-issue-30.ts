import { test } from "tape-async";

import { createClient, HalResource, resetCache } from "../";

import * as nock from "nock";

// mock list response
function initTests() {
  nock.cleanAll();
  resetCache();
  const projectsList1 = [{
    _embedded: {
      Done: {
          count: 1,
      },
    },
    _links: {
      self: {
        href: "http://test.fr/projects/1",
      },
    },
  }];

  const projectsList2 = [{
    _embedded: {
      Testing: {
          count: 1,
      },
    },
    _links: {
      self: {
        href: "http://test.fr/projects/1",
      },
    },
  }];

  const testNock = nock("http://test.fr/");

  testNock
    .get("/projects")
    .reply(200, projectsList1);

  testNock
    .get("/projects")
    .reply(200, projectsList2);
}

test("list are refresh when call fetchArray", async (t) => {
  initTests();
  const projects = await createClient().fetchArray("http://test.fr/projects", HalResource);

  const done = projects[0].prop("Done");
  t.equals(done.count, 1);

  const projects2 = await createClient().fetchArray("http://test.fr/projects", HalResource);
  const done2 = projects2[0].prop("Done");
  const testing = projects2[0].prop("Testing");
  t.equals(done2, undefined);
  t.equals(testing.count, 1);
});
