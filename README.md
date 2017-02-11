# hal-rest-client

Typescript HAL Rest client

## Install

TODO

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
