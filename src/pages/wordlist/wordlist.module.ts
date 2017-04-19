import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { Wordlist } from './wordlist';
import { ComponentsModule } from '../../components/components.module'

@NgModule({
  declarations: [
    Wordlist,
  ],
  imports: [
    ComponentsModule,
    IonicPageModule.forChild(Wordlist),
  ],
  exports: [
    Wordlist
  ]
})
export class WordlistModule {}
