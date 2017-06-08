import { createClient, createResource, HalProperty, HalResource, resetCache } from "../";

import * as nock from "nock";
import { test } from "tape-async";

class DashboardInfo extends HalResource {
  @HalProperty()
  public name;
}

// mock list response
function initTests() {
  nock.cleanAll();
  resetCache();

  const json = {
    _links: {
      dashboardInfos: {
        href: "http://test.fr/dashboard",
        type: "application/hal+json",
      },
      self: {
        href: "http://test.fr/spa",
        type: "application/hal+json",
      },
    },
  };

  const dashBoardInfo = {
    _links: {
      self: {
        href: "http://test.fr/dashboard",
        type: "application/hal+json",
      },
    },
    name: "test",
  };

  const testNock = nock("http://test.fr/");

  testNock
    .get("/spa")
    .reply(200, json);

  testNock
    .get("/dashboard")
    .reply(200, dashBoardInfo);
}

test("can fetch specific class after fetch HalResource", async (t) => {
  initTests();
  const client = createClient("http://test.fr/");
  const fetched = await client.fetch("/spa", HalResource);
  const dashboard = await client.fetch("/dashboard", DashboardInfo);

  t.ok(dashboard instanceof DashboardInfo);
  t.equals(dashboard.name, "test");

  fetched.link("dashboardInfos").prop("name", "updated");
  t.equals(dashboard.name, "updated");
});
