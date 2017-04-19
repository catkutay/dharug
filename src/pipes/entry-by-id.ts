import { Pipe, PipeTransform } from '@angular/core';


@Pipe({
  name: 'entry-by-id',
})
export class EntryById implements PipeTransform {
  transform(value: any, args: any[] = null): any {
    return Object.keys(value).map(key => {
      return value[key]
    })
  }
}