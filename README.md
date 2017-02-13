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

``` ts
let resource = await new HalRestClient().fetch('http://foo.bar/resource');

// can access properties with
resource.prop('my_prop')

// can get _links with
var linkResource = resource.link('my_link') // or resource.prop('my_link')

// can fetch link
await linkResource.fetch();

linkResource.prop('my_prop');
```

an base URL can be used on HalRestClient

``` ts
let resource = await new HalRestClient('http://foo.bar').fetch('/resource');
```
