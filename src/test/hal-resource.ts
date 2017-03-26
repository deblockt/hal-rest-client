import { test } from "tape-async";

import { createClient } from "../hal-factory";
import { resetCache } from "../hal-factory";
import { HalResource } from "../hal-resource";
import { HalRestClient } from "../hal-rest-client";

import * as nock from "nock";

// mock list response
function initTests() {
  resetCache();
  const project1 = {
    _embedded : {
        test : {
          _links : {
            self : {
              href : "http://test.fr/test/1",
            },
          },
          name : "test 1",
        },
    },
    _links : {
      project : {
        href : "http://test.fr/projects/1",
      },
      self : {
        href : "http://test.fr/projects/1",
      },
      subResource : {
        href : "http://test.fr/projects/1/subResource",
      },
    },
    name : "Project 1",
    prop2 : undefined,
    prop3 : undefined,
  };

  const subResource =  {
    _links : {
      self : {
        href : "http://test.fr/projects/1",
      },
    },
    prop1 : "value 1",
  };

  const testNock = nock("http://test.fr/");
  const testNockHeader = nock("http://test.fr/", {
    reqheaders: {
        authorization: "Basic Auth",
    },
  });

  testNock
    .get("/projects")
    .reply(200, {
    _embedded : {
      projects : [ JSON.parse(JSON.stringify(project1)), {
        _links : {
          customer : {
            href : "http://test.fr/projects/2/customer",
          },
          project : {
            href : "http://test.fr/projects/2",
          },
          self : {
            href : "http://test.fr/projects/2",
          },
          versions : {
            href : "http://test.fr/projects/2/versions",
          },
        },
        name : "Project 2",
      }],
    },
    _links : {
      profile : {
        href : "http://test.fr/profile/projects",
      },
      self : {
        href : "http://test.fr/projects",
      },
    },
    page : {
      number : 0,
      size : 20,
      totalElements : 2,
      totalPages : 1,
    },
  });

  project1.prop2 = {key : "value"};
  project1.prop3 = "value3";

  testNock
    .get("/projects/1")
    .reply(200, project1);

  testNock
    .get("/projects/1/subResource")
    .reply(200, subResource);

  testNock
    .get("/project/non-hal")
    .reply(200, {"non-hal" : true});

  testNockHeader
    .get("/me")
    .reply(200, {
      _links : {
          name : "Thomas",
          self: { href : "/me" },
      },
    });

}

test("fetch contains list", async (t) => {
  initTests();
  const value = await createClient().fetch("http://test.fr/projects", HalResource);
  t.equals(value.uri, "http://test.fr/projects");
  t.equals(value.prop("projects").length, 2);
  t.equals(value.prop("projects")[0].prop("name"), "Project 1");
  t.equals(value.prop("projects")[0].uri, "http://test.fr/projects/1");
  t.equals(value.prop("projects")[1].prop("name"), "Project 2");
  t.equals(value.prop("projects")[1].uri, "http://test.fr/projects/2");
});
/*
test("fetch into halArray list", async (t) => {
  initTests();
  let value = await new HalRestClient().fetch("http://test.fr/projects", HalArray);
  console.log(value);
  t.equals(value.uri, "http://test.fr/projects");
  t.equals(value.prop("projects").length, 2);
  t.equals(value.prop("projects")[0].prop("name"), "Project 1");
  t.equals(value.prop("projects")[0].uri, "http://test.fr/projects/1");
  t.equals(value.prop("projects")[1].prop("name"), "Project 2");
  t.equals(value.prop("projects")[1].uri, "http://test.fr/projects/2");
});

test("can iterate over hal-array", async (t) => {
  initTests();
  let value = await new HalRestClient().fetch("http://test.fr/projects", HalArray);

  let i = 0;
  for (let item of value) {
    if (i == 0) {
      t.equals(item.prop("name"), "Project 1");
      t.equals(item.uri, "http://test.fr/projects/1");
    } else if (i == 1) {
      t.equals(item.prop("name"), "Project 2");
      t.equals(item.uri, "http://test.fr/projects/2");
    }
    i++;
  }

  t.equals(i, 2, "halArray have two projects");
});
*/

test("list item are resources", async (t) => {
  initTests();
  const value = await createClient().fetch("http://test.fr/projects", HalResource);
  const project = value.prop("projects")[0];
  t.equal(typeof project.fetch, "function");
});

test("resource fetch don\"t reload if already fetched", async (t) => {
  initTests();
  const value = await createClient().fetch("http://test.fr/projects", HalResource);
  const project = value.prop("projects")[0];
  t.equals(project.prop("prop2"), undefined);
  await project.fetch();
  t.equals(project.prop("prop2"), undefined);
});

test("resource fetch can be forced", async (t) => {
  initTests();
  const value = await createClient().fetch("http://test.fr/projects", HalResource);
  const project = value.prop("projects")[0];
  t.equals(project.prop("prop2"), undefined);
  await project.fetch(true);
  t.equals(project.prop("prop3"), "value3");
  t.deepEqual(project.prop("prop2"), {key : "value"});
});

test("can init Resource by URL", async (t) => {
  initTests();
  const project = new HalResource(createClient(), "http://test.fr/projects/1");
  t.equals(project.prop("name"), undefined);
  await project.fetch();
  t.equals(project.prop("name"), "Project 1");
});

test("can follow links using link function", async (t) => {
  initTests();
  const project = await createClient().fetch("http://test.fr/projects/1", HalResource);
  const subResource = project.link("subResource");
  t.equals(subResource.prop("prop1"), undefined);
  await subResource.fetch();
  t.equals(subResource.prop("prop1"), "value 1");
});

test("can follow links using prop function", async (t) => {
  initTests();
  const project = await createClient().fetch("http://test.fr/projects/1", HalResource);
  const subResource = project.prop("subResource");
  t.equals(subResource.prop("prop1"), undefined);
  await subResource.fetch();
  t.equals(subResource.prop("prop1"), "value 1");
});

test("can get embedded hal-resource", async (t) => {
  initTests();
  const project = await createClient().fetch("http://test.fr/projects/1", HalResource);
  const testResource = project.prop("test");
  t.equals(testResource.prop("name"), "test 1");
});

test("can use baseUrl to load resources two slash", async (t) => {
  initTests();
  const project = await createClient("http://test.fr/").fetch("/projects/1", HalResource);
  t.equals(project.prop("name"), "Project 1");
});

test("can use baseUrl to load resources one slash", async (t) => {
  initTests();
  const project2 = await createClient("http://test.fr").fetch("/projects/1", HalResource);
  t.equals(project2.prop("name"), "Project 1");
});

test("loader with header on constructor", async (t) => {
  initTests();
  const client = createClient("http://test.fr/", {authorization : "Basic Auth"});
  const project2 = await client.fetch("http://test.fr/me", HalResource);
  t.equals(project2.prop("name"), "Thomas");
});

test("loader with header with addHeader method", async (t) => {
  initTests();
  const project2 = await createClient("http://test.fr/")
    .addHeader("authorization", "Basic Auth")
    .fetchResource("http://test.fr/me");
  t.equals(project2.prop("name"), "Thomas");
});

test("fetch non hal object throw exception", async (t) => {
  initTests();
  try {
    await createClient("http://test.fr/")
      .fetchResource("/project/non-hal");
    t.ko("Exception must be throw");
  } catch (e) {
    t.ok("throwed exception");
  }
});
