import { test } from 'tape-async';
import { HalRestClient } from '../hal-rest-client';
import { HalResource } from '../hal-resource';
import { resetCache } from '../hal-factory';
import * as nock from 'nock';

// mock list response
function initTests() {
  resetCache();
  var project1 = {
    "name" : "Project 1",
    "_links" : {
      "self" : {
        "href" : "http://test.fr/projects/1"
      },
      "project" : {
        "href" : "http://test.fr/projects/1"
      },
      "subResource" : {
        "href" : "http://test.fr/projects/1/subResource"
      }
    }
  };

  var subResource =  {
    "prop1" : "value 1",
    "_links" : {
      "self" : {
        "href" : "http://test.fr/projects/1"
      }
    }
  };

  var testNock = nock('http://test.fr/');
  var testNockHeader = nock('http://test.fr/', {
    reqheaders: {
        'authorization': 'Basic Auth'
    }
  });

  testNock
    .get('/projects')
    .reply(200, {
    "_embedded" : {
      "projects" : [ JSON.parse(JSON.stringify(project1)), {
        "name" : "Project 2",
        "_links" : {
          "self" : {
            "href" : "http://test.fr/projects/2"
          },
          "project" : {
            "href" : "http://test.fr/projects/2"
          },
          "customer" : {
            "href" : "http://test.fr/projects/2/customer"
          },
          "versions" : {
            "href" : "http://test.fr/projects/2/versions"
          }
        }
      } ]
    },
    "_links" : {
      "self" : {
        "href" : "http://test.fr/projects"
      },
      "profile" : {
        "href" : "http://test.fr/profile/projects"
      }
    },
    "page" : {
      "size" : 20,
      "totalElements" : 2,
      "totalPages" : 1,
      "number" : 0
    }
  });

  project1['prop2'] = {'key' : 'value'};
  project1['prop3'] = 'value3';

  testNock
    .get('/projects/1')
    .reply(200, project1);

  testNock
    .get('/projects/1/subResource')
    .reply(200, subResource);

  testNockHeader
    .get('/me')
    .reply(200, {'name' : 'Thomas', '_links' : { 'self' : {'href' : '/me'}}});
}


test('fetch contains list', async (t) => {
  initTests();
  let value = await new HalRestClient().fetch('http://test.fr/projects');
  t.equals(value.uri, 'http://test.fr/projects');
  t.equals(value.prop('projects').length, 2);
  t.equals(value.prop('projects')[0].prop('name'), 'Project 1');
  t.equals(value.prop('projects')[0].uri, 'http://test.fr/projects/1');
  t.equals(value.prop('projects')[1].prop('name'), 'Project 2');
  t.equals(value.prop('projects')[1].uri, 'http://test.fr/projects/2');
});


test('list item are resources', async (t) => {
  initTests();
  let value = await new HalRestClient().fetch('http://test.fr/projects');
  let project = value.prop('projects')[0];
  t.equal(typeof project.fetch, 'function');
});


test('resource fetch don\'t reload if already fetched', async (t) => {
  initTests();
  let value = await new HalRestClient().fetch('http://test.fr/projects');
  let project = value.prop('projects')[0];
  t.equals(project.prop('prop2'), undefined);
  await project.fetch();
  t.equals(project.prop('prop2'), undefined);
});


test('resource fetch can be forced', async (t) => {
  initTests();
  let value = await new HalRestClient().fetch('http://test.fr/projects');
  let project = value.prop('projects')[0];
  t.equals(project.prop('prop2'), undefined);
  await project.fetch(true);
  t.equals(project.prop('prop3'), 'value3');
  t.deepEqual(project.prop('prop2'), {'key' : 'value'});
});

test('can init Resource by URL', async (t) => {
  initTests();
  var project = new HalResource(new HalRestClient(), 'http://test.fr/projects/1');
  t.equals(project.prop('name'), undefined);
  await project.fetch();
  t.equals(project.prop('name'), 'Project 1');
});


test('can follow links using link function', async (t) => {
  initTests();
  let project = await new HalRestClient().fetch('http://test.fr/projects/1');
  let subResource = project.link('subResource');
  t.equals(subResource.prop('prop1'), undefined);
  await subResource.fetch();
  t.equals(subResource.prop('prop1'), 'value 1');
});


test('can follow links using prop function', async (t) => {
  initTests();
  let project = await new HalRestClient().fetch('http://test.fr/projects/1');
  let subResource = project.prop('subResource');
  t.equals(subResource.prop('prop1'), undefined);
  await subResource.fetch();
  t.equals(subResource.prop('prop1'), 'value 1');
});


test('can use baseUrl to load resources two slash', async (t) => {
  initTests();
  let project = await new HalRestClient('http://test.fr/').fetch('/projects/1');
  t.equals(project.prop('name'), 'Project 1');
});


test('can use baseUrl to load resources one slash', async (t) => {
  initTests();
  let project2 = await new HalRestClient('http://test.fr').fetch('/projects/1');
  t.equals(project2.prop('name'), 'Project 1');
});


test('loader with header on constructor', async (t) => {
  initTests();
  let project2 = await new HalRestClient('http://test.fr/', {'authorization': 'Basic Auth'}).fetch('http://test.fr/me');
  t.equals(project2.prop('name'), 'Thomas');
});


test('loader with header with addHeader method', async (t) => {
  initTests();
  let project2 = await new HalRestClient('http://test.fr/')
    .addHeader('authorization', 'Basic Auth')
    .fetch('http://test.fr/me');
  t.equals(project2.prop('name'), 'Thomas');
});
