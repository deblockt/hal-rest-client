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
import { createClient } from "hal-rest-client";

let client = createClient();
let resource = client.fetchResource('http://foo.bar/resource');

// can access properties with, embedded resources are in prop
// return can be an HalResource or any primitive string depends of rest-service return
resource.prop('my_prop');

// can get _links with
var linkResource = resource.link('my_link') // or resource.prop('my_link')

// can fetch link, fetch run http request and hydrate resource
await linkResource.fetch();

// you can now access to resource properties
linkResource.prop('my_prop');
```

### Advanced Usage

hal-rest-client can use model class to fetch HAL REST API result.

first step : create model class

``` ts
import { HalProperty, HalResource } from "hal-rest-client";

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

Hal person/1 :

``` json
{
  "name" : "Deblock",
  "_embedded" : {
      "my-friends" : [
          {
              "_links" : { "self" : { "href" : "http://test.fr/person/5" }},
              "name" : "Laurent"
          }
      ],
      "best-friend" : {
        "name" : "Laurent",
        "_links" : {
          "self" : {
            "href" : "http://test.fr/person/5"
          }
        }
      }
  },
  "_links" : {
    "self" : {
      "href" : "http://test.fr/person/1"
    },
    "contactInfos" : {
      "href" : "http://test.fr/person/1/contactInfos"
    }
  }
}
```

Hal person/1/contactInfos :
``` json
{
  "phone" : "xxxxxxxxxx",
  "_links" : {
    "self" : {
      "href" : "http://test.fr/person/1/contactInfos"
    },
  }
}
```

After you can fetch Person like this :
``` ts
import { createClient } from "hal-rest-client";
import { Person } from './person';

let client = createClient();

// ...

let person = await client.fetch('/person/1', Person);

console.log(person.name); // show Deblock
console.log(person.bestFriend.name); // show Laurent
console.log(person.friends[0].name); // show Laurent

// fetch contactInfos link
let contactInfos = await client.contactInfos.fetch();

console.log(contactInfos.phone) // show xxxxxxxxxx;
console.log(client.contactInfos.phone) // show xxxxxxxxxx;
```

Function fetchArray can be use for get list of item :
``` ts
// ...
let persons = await client.fetchArray('/persons', Person);

// persons contains list of Person. It's an Array
console.log(persons[0].name); // show Thomas
```

### Client creation

Two parameters can be used for creation a client.
- The base URI. fetchs are done with this base
- A header. All request are done with this header 

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
