# hal-rest-client

[![Build Status](https://travis-ci.org/deblockt/hal-rest-client.svg?branch=master)](https://travis-ci.org/deblockt/hal-rest-client)
[![Coverage Status](https://coveralls.io/repos/github/deblockt/hal-rest-client/badge.svg)](https://coveralls.io/github/deblockt/hal-rest-client)
[![Known Vulnerabilities](https://snyk.io/test/npm/hal-rest-client/badge.svg)](https://snyk.io/test/npm/hal-rest-client)

[![NPM](https://nodei.co/npm/hal-rest-client.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/hal-rest-client/)


hal-rest-client library to help you work with Hypertext Application Language (HAL) on Typescript. It's work fine with browser or nodejs app.

It can map rest service return to Typescript object for simply access link or property.

## Install

Using npm :

```
npm install hal-rest-client
```

### From O.2

Warning : `uri` property of HalResource are now `URI` type. Si if you use this property you must now use 
```ts
halResource.uri.fetchedURI // get the uri used to fetch resource
halResource.uri.uri // get the uri provided from server
halResource.uri.fill({params: "test"}) // fill the templated uri with given parameters
```

## how to use

The library provide two access method :
1. use generic object `HalResource` to map service return
2. map service return on typescript object `model`

### Generic Usage : using `HalResource`

#### Read object

To have access to your service, you need to create an hal-rest-client instance .

``` ts
import { createClient } from "hal-rest-client";

const client = createClient();
// or
const client = createClient("http://exemple.com/api");
```

to get a resource, you can use fetchResource method.

``` ts
const resource = await client.fetchResource("http://exemple.com/api/resources/5")
or
const resource = await client.fetchResource("/resources/5");
```
> fetchResource return a promise. you can use `then` and `catch` to get result. Otherwise you can use `await` see [this article](https://blog.mariusschulz.com/2016/12/09/typescript-2-1-async-await-for-es3-es5)

you can get resource property, embedded property or link using `prop` method.
``` ts
const name = resource.prop("name");
const resourceURI = resource.uri;
```
for a link, on `link` service return
```ts
const linkValue = resource.prop("link_name");
// or
const linkValue = resource.link("link_name");
```
> link attribute type is `HalResource`

#### Follow a link

links are made to be followed. So you can simply fetch a link using `fetch` method.
``` ts
const linkValue = resource.link("link_name");
await linkValue.fetch();
const name = linkValue.prop("name");
```
> link return an empty `HalResource`, just `uri` is setted. `fetch` populate the HalResource.

#### Follow a templated link

If you link is templated, you can set parameter to fetch to compute fetch URL.
```ts
// link "link_name" is a templated link like this 
// /bookings{?projection}
const linkValue = resource.link("link_name");
const bookings = await linkValue.fetch(); // fetch /bookings
const bookingsWithName = await linkValue.fetch({projection : "name"}); // fetch /bookings?projection=name
// link "link_infos" is like this 
// /infos{/path*}
const linkValue = resource.link("link_infos");
const infos = await linkValue.fetch(); // fetch /infos
const infosForFoo = await linkValue.fetch({path: "foo"});
```


#### Update a resource

Resource can be updated, an save with a PATCH query.

``` ts
resource.prop("name", "new value");
await resource.update()
```
> update return a promise. use `await` to wait end of update.

To set a link, you can use `prop` or `link` function. the new value for a link must be an `HalResource` populated or not.
``` ts
// init an HalResource called newResource
resource.prop("link_name", newResource);
await resource.update();
```
> on the request send to server, only the uri is sent not all the object.

#### Create a resource

To create a resource, you must use method `create` on your client.

``` ts
await client.create("/resources", { name: "Thomas" });
```
If your server return the new created object as body, you can do this :
``` ts
const resource = await client.create("/resources", { name: "Thomas" });
```
> Resource is an HalResource if server return a resource or just json if a simple json is returned


### With model usage

hal-rest-client can use model class to fetch HAL rest result.
Model class is a definition of service return.

#### Create a model class

for this exemple, we create a Resource model.

``` ts
import { HalProperty, HalResource } from "hal-rest-client";
import { Person } from './person.model';

class Resource extends HalResource {
  @HalProperty()
  public name;

  // for array, you must specify class item as parameter
  @HalProperty(Resource)
  public subResources: Array<Resource>;

  // if name on hal-service is not equals at attribute name
  // you can add hal-service property name as parameter
  @HalProperty("main-owner")
  public owner: Person;

}
```
> your model must extends HalResource
>
> each property must be annoted with `@HalProperty`.
> \_links, \_embedded, an simple props must to be map with `@HalProperty`

#### Read an object

To read an object, you need to create a client, and call `fetch` method.

``` ts
import { createClient } from "hal-rest-client";

const client = createClient();
// or
const client = createClient("http://exemple.com/api");
```

call fetch method

``` ts
import { Resource } "./resource.model";
const resource = await client.fetch("/resource/5", Resource);
```
> fetch return a promise. you can use `then` and `catch` to get result. Otherwise you can use `await` see [this article](https://blog.mariusschulz.com/2016/12/09/typescript-2-1-async-await-for-es3-es5)

read props is simply call object attributs.

``` ts
const name = resource.name;
const uri = resource.uri;
```

#### Follow a link

links are made to be followed. So you can simply fetch a link using `fetch` method.
``` ts
await resource.owner.fetch();
const ownerName = resource.owner.name;
```
> mapped links return an empty `HalResource`, just `uri` is setted. Call `fetch` populate the HalResource.
>
> if ower is not a link but an embedded resource, you don't need to call `fetch`. Object is populate with embedded resource

fetch return the fetched object, so you can do that :
``` ts
const resourceOwner = await resource.owner.fetch();
const ownerName = resourceOwner.name;
```

#### update a resource

Resource can be updated, an save with a PATCH query.

``` ts
resource.name = "new value";
await resource.update()
```
> update return a promise. use `await` to wait end of update.

You can set a link, the new value for a link must be an `HalResource` or an other model, populated or not.
``` ts
// init an HalResource called newPerson
resource.owner = newPerson
await resource.update();
```
> on the request send to server, only the uri is sent not all the object.

#### create a resource

To create a resource, you have two choices :
1. use `create` method on client
2. create a resource object and call `create` method on this object

##### Use the client

To create a resource, you must use method `create` on your client.

``` ts
await client.create("/resources", { name: "Thomas" });
```

If your server return the new created object as body, you can do this :
``` ts
const resource = await client.create("/resources", { name: "Thomas" }, Resource);
```
> Resource is an Resource object if server return a resource or just json if a simple json is returned

##### Create a new Object

To create a resource object, you must use `createResource` method

``` ts
import { createResource } from "hal-rest-client";
const resource = createResource(client, "/resources", Resource);
```

After resource creation, set properties
``` ts
resource.name = "my resource";
resource.owner = owner;
```

Call `create` method
``` ts
const createdResource = await resource.create();
```
> if your server return new created object, create return this object. createdResource have type Resource. create don't populate the existing object.

## Configuration

### request configuration
You can configure some parameter on you client.
HalClient use axios to run ajax request.

You can configure each parameter describe [here](https://github.com/mzabriskie/axios#request-config)

To do, you have two solution:

```typescript
// example to configure CORS withCredentials parameter
createClient('http://test.fr', {withCredentials : true})

// or
client.config.withCredentials = true
```

### interceptor

You can configure interceptors, you have two interceptor types :
- request interceptor : configure request information
- response interceptor: do something with server response. This interceptor is called before object parsing to HalResource

```typescript
// Add a request interceptor
halClient.interceptors.request.use(function (config) {
    // Do something before request is sent
    return config;
  }, function (error) {
    // Do something with request error
    return Promise.reject(error);
});

// Add a response interceptor
halClient.interceptors.response.use(function (response) {
    // Do something with response data
    return response;
  }, function (error) {
    // Do something with response error
    return Promise.reject(error);
});
```

## API description

### Client creation

Two parameters can be used for create a client.
- The base URI. fetchs are done with this base
- A header. All request are done with this header

an base URL can be used to fetch resources.

``` ts
import { createClient } from 'hal-rest-client';
const client = await createClient('http://foo.bar');
```

header can be set to HalRestClient
``` ts
const client = await createClient('http://foo.bar', {'headers' : {'authorization': 'Basic Auth'}});
// or
const client = createClient('http://foo.bar');
client.addHeader('authorization', 'Basic Auth');
```

When the client fetch a resource, a parser is used to convert json on HalResource.
You can customize the parsing method. To do this, you need extends JSONParser and implements your own jsonToResource method.
After, you can set the parser like this.

``` ts
client.setJsonParser(myParser);
```

### HalProperty

`HalProperty` annotation is used to map model with service body.
HalProperty have two parameters:
- name of property on service body. default it's the same name
- type. model to use for embedded or link.

``` ts
@HalProperty("property-name")
@HalProperty(Type)
@HalProperty("property-name", Type)
```

### Fetch

#### fetchResource

Fetch a service, and return an HalResource. Parameter is the URI.

``` ts
client.fetchResource('/resources/5');
// or
client.fetchResource('http://test.fr/resources/5');
```

#### fetch

Fetch a service and return a model class. Parameter is the URI and model class.
``` ts
client.fetch('/resources/5', Resource);
// or
client.fetch('http://test.fr/resources/5', Resource);
```

#### fetchArray

Fetch an array service. Return an array of object (HalResource or model class).
The service can return :
- A simple array of HAL resources
- A HAL resource containing a list of HAL resource on \_embedded

``` ts
client.fetchArray('/resources', Resource);
// or
client.fetchArray('http://test.fr/resources', Resource);
// or
client.fetchArray('http://test.fr/resources', HalResource);
```

### Create or update HAL Resource

To create or update resource, Typescript Objects are serialized on simple json to send at server.
on `create` or `update` method you can use custom JsonSerializer.

```ts
const result = await resource.update({
  parseProp : (value) => "serializer." + value,
  parseResource : (value) => "serializer2." + value.uri,
});
```

- parseProp : parse a simple property (not an HalResource)
- parseResource : parse a HalResource or model class
