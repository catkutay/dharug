import { NgModule } from "@angular/core"

import { EntryById } from './entry-by-id'
import { Values } from './values'

@NgModule({
  declarations: [
    EntryById,
    Values
    ],
  exports: [
    EntryById,
    Values
    ],
  imports: []
})
export class PipesModule {
}
