# hal-rest-client

[![Build Status](https://travis-ci.org/deblockt/hal-rest-client.svg?branch=master)](https://travis-ci.org/deblockt/hal-rest-client)
[![Coverage Status](https://coveralls.io/repos/github/deblockt/hal-rest-client/badge.svg)](https://coveralls.io/github/deblockt/hal-rest-client)

Typescript HAL Rest client

## Install

Using npm :

```
npm install hal-rest-client
```

## how to use

Hal rest client provide read-only HAL Rest access.
It can read HAL et follow links.

### Generic Usage

You can quickly access the hal-rest-api using the HalResource generic class

``` ts
let client = createClient();
let resource = client.fetchResource('http://foo.bar/resource');

// can access properties with
// return can be an HalResource or any primitive string depends of rest-service return
resource.prop('my_prop');

// can get _links with
var linkResource = resource.link('my_link') // or resource.prop('my_link')

// can fetch link, fetch run http request and hydrate resource
await linkResource.fetch();

// you can now access to resource properties
linkResource.prop('my_prop');
```

an base URL can be used on HalRestClient

``` ts
let resource = await createClient('http://foo.bar').fetch('/resource');
```

header can be add to HalRestClient
``` ts
let resource = await createClient('http://foo.bar', {'authorization': 'Basic Auth'}).fetch('/resource');

// or

let client = createClient('http://foo.bar');
client.addHeader('authorization', 'Basic Auth');
```

### Advanced Usage

hal-rest-client can use model class to fetch HAL REST API result.

first step : create model class

``` ts
class ContactInfos extends HalResource {
  @HalProperty()
  public phone: string;
}

class Person extends HalResource {
  @HalProperty()
  public name;

  @HalProperty()
  public contactInfos : ContactInfos;

  // for array, you need specify content class as parameter
  @HalProperty(Person)
  public friends: Array<Person>;

  // if name on hal-rest-service is not equals at attribute name
  // you can add hal-rest-service property name as parameter
  @HalProperty("best-friend")
  public bestFriend: Person;

  @HalProperty({name : 'personnal-address', type : Address})
  public personnalAddress: List<Address>;
}
```

After you can fetch Person like this :
``` ts
// ...
let person = await client.fetch('/person/1', Person);

console.log(person.name); // show ...

// fetch contactInfos link
await client.contactInfos.fetch();

console.log(client.contactInfos.phone) // show ...;
```
