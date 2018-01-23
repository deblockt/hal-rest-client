import {HalResource} from '../../hal-resource';
import {HalProperty} from '../../hal-decorator';

export class ArrayResourceItem extends HalResource {

  @HalProperty()
  public id: Number;

}

export class ArrayResource extends HalResource {

  @HalProperty('items', ArrayResourceItem)
  public items: ArrayResourceItem[];

}

