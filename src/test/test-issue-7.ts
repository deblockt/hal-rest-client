import { createClient, createResource, HalProperty, HalResource, resetCache } from "../";

import * as nock from "nock";
import { test } from "tape-async";

class DashboardInfo extends HalResource {
  @HalProperty()
  public name;

  public getHalRestClientInfo() {
    return this.restClient.config.baseURL;
  }
}

// mock list response
function initTests() {
  nock.cleanAll();
  resetCache();

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
    .get("/dashboard")
    .reply(200, dashBoardInfo);
}

test("HalResource restClient is protected", async (t) => {
  initTests();
  const client = createClient("http://test.fr/");
  const dashboard = await client.fetch("/dashboard", DashboardInfo);

  t.equals(dashboard.getHalRestClientInfo(), "http://test.fr/");
});
