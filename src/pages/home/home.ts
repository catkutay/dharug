import { Component, NgZone, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { style, animate, transition, trigger } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';
import { Observable } from "rxjs/Observable";
import { DatabaseService } from "../../providers/database-service"
import { EntryService } from "../../providers/entry-service"
import { LanguageService } from "../../providers/language-service"
import { ConnectivityService } from "../../providers/connectivity-service"
import { SyncService } from "../../providers/sync-service"

import { LanguageChooser } from "../../components/language-chooser/language-chooser.module"


@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [   // :enter is alias to 'void => *'
        // style({opacity:0, height: 0}),
        // animate(500, style({opacity:1, height: "auto"}))
      ]),
      transition(':leave', [   // :leave is alias to '* => void'
        animate(1000, style({height: 0}))
      ])
    ])
  ]
})
export class Home {

  language: any
  loading: boolean = true
  lettersLoading$: Observable<any>
  lettersLoaded$: Observable<any>
  lettersLoadingSub: any
  languageCode$: Observable<any>
  status$: Observable<any>
  syncMessage$: Observable<any>
  downloading$: Observable<any>

  constructor(
    public connectivityService: ConnectivityService,
    public databaseService: DatabaseService,
    public entryService: EntryService,
    public languageService: LanguageService,
    public navCtrl: NavController,
    public syncService: SyncService,
    public cd: ChangeDetectorRef,
    public zone: NgZone
  ) {
  }

  ngOnInit() {
    this.lettersLoading$ = this.syncService.lettersLoading$
    this.lettersLoadingSub = this.syncService.lettersLoading$.subscribe( (letters) => {
      this.loading = (letters.length > 0) ? true : false
    })
    this.lettersLoaded$  = this.syncService.lettersLoaded$
    this.languageCode$   = this.languageService.languageCode$
    this.status$ = this.connectivityService.onlineSubject
    this.syncMessage$ = this.syncService.syncMessage$
    this.downloading$ = this.syncService.downloading$
  }

  ngOnDestroy() {
    this.lettersLoadingSub.unsubscribe()
  }

  gotoAbout() {
    this.navCtrl.push('About')
  }

  gotoSearch() {
    this.navCtrl.push('Search')
  }

  gotoWordlist(letter) {
    this.entryService.setLetter(letter)
    this.navCtrl.push('Wordlist')
  }

  status() {
    return this.connectivityService.isOnline()
  }
}
