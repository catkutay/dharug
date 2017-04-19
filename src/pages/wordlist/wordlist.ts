import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Observable } from "rxjs/Observable";
import { DatabaseService } from "../../providers/database-service"
import { EntryService } from "../../providers/entry-service"
import { LanguageService } from "../../providers/language-service"


@IonicPage()
@Component({
  selector: 'page-wordlist',
  templateUrl: 'wordlist.html',
})
export class Wordlist {

  entries$: Observable<any>
  entriesSub: any
  language: any
  languageSub: any
  entriesCount: number
  letter$: Observable<string>
  loading: boolean = true

  constructor(
    public navCtrl: NavController,
    public databaseService: DatabaseService,
    public entryService: EntryService,
    public languageService: LanguageService,
    public cd: ChangeDetectorRef
    ) {
    this.entries$ = this.entryService.entries$
  }

  ngOnInit() {
    // Letter subscription
    this.letter$ = this.entryService.letter$
    // Language subscription, reload entries when language changes
    this.languageSub = this.languageService.language$.subscribe( (language) => {
      this.language = language
      // Get the entries
      this.entryService.getWordlistForLetter()
        .then((res:any) => {
          this.loading = false
          this.entriesCount = res.length
          // this.cd.markForCheck() // Marks path for change detection
        })
        .catch( (err) => {
          this.entriesCount = 0
        })
    })
  }

  ngOnDestroy() {
    this.languageSub.unsubscribe()
  }

  goToEntry(entry) {
    let options = {entry:entry}
    this.navCtrl.push('Entry', options)
  }
}
