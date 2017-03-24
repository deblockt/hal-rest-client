import 'reflect-metadata';
import { HalResource } from './hal-resource';
import { IHalResourceConstructor } from './hal-resource-interface';
import { HalRestClient } from './hal-rest-client';

export function HalProperty<T extends HalResource>(param1 ?: any) {
  var type = undefined;
  var propName = undefined;
  var error = false;

  if (param1) {
    if (typeof param1 === "string") {
      propName = param1;
    } else if (typeof param1 === 'object' && (param1.name || param1.type)) {
      propName = param1.name;
      type = param1.type;
    } else if (typeof param1 === 'function'){
      type = param1;
    } else {
      error = true;
    }
  }

  return (target: any, key: string) => {
    if (error) {
        throw new Error(target.constructor.name + '.' + key + ' Parameter of @HalProperty is unreadable. read @HalProperty documentation.');
    }

    var halToTs = Reflect.getMetadata("halClient:halToTs", target);
    if (halToTs === undefined) {
        halToTs = {};
        Reflect.defineMetadata("halClient:halToTs", halToTs, target);
    }
    halToTs[propName || key] = key;

    var toUseType = type || Reflect.getMetadata("design:type", target, key);
    Reflect.defineMetadata("halClient:specificType", toUseType, target, key);

    // Delete property.
    if (delete target[key]) {
      // Create new property with getter and setter
      Object.defineProperty(target, key, {
        get: function() { return this.prop(key) },
        set: function(value) { this.props[key] = value },
        enumerable: true,
        configurable: true
      });
    }
  }
}
