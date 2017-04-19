import { Component, Input } from '@angular/core';

@Component({
  selector: 'entry-sense',
  templateUrl: 'entry-sense.html'
})
export class EntrySense {

  @Input() sense: any

  constructor() {
  }
}
