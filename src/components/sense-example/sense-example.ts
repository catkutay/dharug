import { Component, Input } from '@angular/core';


@Component({
  selector: 'sense-example',
  templateUrl: 'sense-example.html'
})
export class SenseExample {

  @Input() example: any

  constructor() {
  }
}
