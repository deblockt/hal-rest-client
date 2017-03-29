import "reflect-metadata";
import { HalResource } from "./hal-resource";
import { IHalResourceConstructor } from "./hal-resource-interface";
import { HalRestClient } from "./hal-rest-client";

export function HalProperty<T extends HalResource>(param1 ?: any) {
  let type;
  let propName;
  let error = false;

  if (param1) {
    if (typeof param1 === "string") {
      propName = param1;
    } else if (typeof param1 === "object" && (param1.name || param1.type)) {
      propName = param1.name;
      type = param1.type;
    } else if (typeof param1 === "function") {
      type = param1;
    } else {
      error = true;
    }
  }

  return (target: any, key: string) => {
    if (error) {
        throw new Error(`${target.constructor.name}.${key} Parameter of @HalProperty is unreadable.` +
                         " Read @HalProperty documentation.");
    }
    const propertyType = Reflect.getMetadata("design:type", target, key);
    if (propertyType === Array && type === undefined) {
      throw new Error(`${target.constructor.name}.${key} for Array you need to specify a type on @HalProperty.` +
                       "Example : @HalProperty(HalResource) or  @HalProperty(ClassOfArrayContent)");
    }

    let halToTs = Reflect.getMetadata("halClient:halToTs", target);
    if (halToTs === undefined) {
        halToTs = {};
        Reflect.defineMetadata("halClient:halToTs", halToTs, target);
    }
    halToTs[propName || key] = key;

    const toUseType = type || propertyType;
    Reflect.defineMetadata("halClient:specificType", toUseType, target, key);

    // Delete property.
    if (delete target[key]) {
      // Create new property with getter and setter
      Object.defineProperty(target, key, {
        get() { return this.prop(key); },
        set(value) { this.props[key] = value; },
        configurable: true,
        enumerable: true,
      });
    }
  };
}
