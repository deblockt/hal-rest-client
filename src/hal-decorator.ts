import "reflect-metadata";
import { HalResource } from "./hal-resource";
import { IHalResourceConstructor } from "./hal-resource-interface";
import { HalRestClient } from "./hal-rest-client";

/**
 * get the transco decorator
 */
function getTransco(transconame: string, target: any): object {
  let transco = Reflect.getMetadata("halClient:" + transconame, target);
  if (transco === undefined) {
      transco = {};
      Reflect.defineMetadata("halClient:" + transconame, transco, target);
  }
  return transco;
}

export function HalProperty<T extends HalResource>(nameOrType ?: string|Function, maybeType ?: Function) {
  let type;
  let propName;
  let error = false;
  if (nameOrType) {
    if (typeof nameOrType === "string") {
      propName = nameOrType;
    } else {
      type = nameOrType;
    }

    if (maybeType) {
      if (typeof nameOrType === "function") {
        error = true;
      } else {
        type = maybeType;
      }
    }
  }

  return (target: any, key: string) => {
    if (error) {
        throw new Error(`${target.constructor.name}.${key} @HalProperty parameters are 'name' and 'type', not reverse`);
    }
    const propertyType = Reflect.getMetadata("design:type", target, key);
    if (propertyType === Array && type === undefined) {
      throw new Error(`${target.constructor.name}.${key} for Array you need to specify a type on @HalProperty.` +
                       "Example : @HalProperty(HalResource) or  @HalProperty(ClassOfArrayContent)");
    }

    const halToTs = getTransco("halToTs", target);
    const tsToHal = getTransco("tsToHal", target);
    halToTs[propName || key] = key;
    tsToHal[key] = propName || key;

    const toUseType = type || propertyType;
    Reflect.defineMetadata("halClient:specificType", toUseType, target, key);

    // Delete property.
    if (delete target[key]) {
      // Create new property with getter and setter
      Object.defineProperty(target, key, {
        get() { return this.prop(key); },
        set(value) { this.prop(key, value); },
        configurable: true,
        enumerable: true,
      });
    }
  };
}
