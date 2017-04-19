import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { Entry } from './entry';
import { ComponentsModule } from '../../components/components.module'

@NgModule({
  declarations: [
    Entry,
  ],
  imports: [
    ComponentsModule,
    IonicPageModule.forChild(Entry),
  ],
  exports: [
    Entry
  ]
})
export class EntryModule {}
