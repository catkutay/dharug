import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { Search } from './search';
import { ComponentsModule } from '../../components/components.module'

@NgModule({
  declarations: [
    Search,
  ],
  imports: [
    ComponentsModule,
    IonicPageModule.forChild(Search),
  ],
  exports: [
    Search
  ]
})
export class SearchModule {}
