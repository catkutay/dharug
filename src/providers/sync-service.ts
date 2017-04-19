import { Injectable, NgZone  } from "@angular/core"
import { ConnectivityService } from "./connectivity-service"
import { DatabaseService } from "./database-service"
import { EntryService } from "./entry-service"
import { LanguageService } from "./language-service"
import { BehaviorSubject } from "rxjs/BehaviorSubject"
import { Subject } from 'rxjs/Subject'


@Injectable()
export class SyncService {

  _lettersLoading$: BehaviorSubject<any> = new BehaviorSubject([])
  _lettersLoaded$ : BehaviorSubject<any> = new BehaviorSubject(null)
  _syncMessage$   : BehaviorSubject<any> = new BehaviorSubject(null)
  _downloading$: BehaviorSubject<any> = new BehaviorSubject(null)
  lettersLoading: any = []
  lettersLoaded: any = {}
  languagesSub: any
  worker: any


  constructor(
    public connectivityService: ConnectivityService,
    public databaseService: DatabaseService,
    public entryService: EntryService,
    public languageService: LanguageService,
    public zone: NgZone
  ) {
    this.init()
  }

  get lettersLoading$() {
    return this._lettersLoading$.asObservable()
  }
  get lettersLoaded$() {
    return this._lettersLoaded$.asObservable()
  }
  get syncMessage$() {
    return this._syncMessage$.asObservable()
  }
  get downloading$() {
    return this._downloading$.asObservable()
  }

/*
1 online ?

  1a compare db versions
  1b download data if they differ
  1c use local if they match

2 offline ?

  2a get letters from pouch
  2b get entries from pouch
  2c show letters for these entries

  3a check connection
  3b try to download


offline?
  no letters? notify

online?
  get dbversion
  if no letters/entries
    get all letters and entries
  else
    download letters
    download entries since last dbversion

 */

  init() {

    // Initialise arrays to track the UI letter buttons
    this.languagesSub = this.languageService.languages$.subscribe((languages) => {
      for (let language of languages) {
        if (typeof(this.lettersLoaded[language.code])=="undefined") this.lettersLoaded[language.code] = []
      }
    })

    // Publish letter arrays when language changes
    this.languageService.languageCode$.subscribe( (languageCode) => {
      this._lettersLoaded$.next(this.lettersLoaded[languageCode])
    })

    this._downloading$.next(true) // for the UI to update spinners

    if (this.connectivityService.isOnline()) {
      // online
      // 1a Compare db versions. download everything if they differ, use local if they match
      this.databaseService.getFromPouch("dbVersion")
        .then((pdbVersion) => {
          this.broadcast("checking db version")
          this.databaseService.getFromFirebase("dbVersion")
            .then((fdbVersion) => {
              if (fdbVersion !== pdbVersion) {
                // 1b different db versions, download afresh
                this.downloadAll()
              } else {
                // 1c matching db versions, use local data
                this.loadAll()
              }
            })
            .catch((err) => console.log("couldn't get db version from firebase"))
        })
        .catch((err) => {
          console.log('no local dbversion, download all')
          this.downloadAll()
        })

    } else {
      // offline
      this.loadAll()
    }
  }

  broadcast(msg){
    this._syncMessage$.next(msg)
  }

  // . . . . . . . . . . . . . . . . . . . . . . . . . . .

  loadAll() {
    this.broadcast("using local data")
    // 2a get letters from pouch
    this.databaseService.getFromPouch("letters")
      .then((letters) => {
        // 2b get get entries from pouch
        this.databaseService.getFromPouch("entries")
          .then((entries) => {
            this.showLettersLoaded(entries)
            this.entryService.replaceEntries(entries)
            this._downloading$.next(false) // for the UI to update spinners
        })
      })
      .catch((err) => {
        // 3a do we have a connection ?
        if (this.connectivityService.isOnline()) {
          // 3b try to download letters, then entries
          this.downloadAll()
        } else {
          // no connection. can't download
          let msg = "no letters, no connection, can't download the words"
          console.log(msg)
          this.broadcast(msg)
        }
      })
  }

  downloadAll() {
    this.broadcast("downloading all data from firebase")
    this.databaseService.getFromFirebase("dbVersion")
      .then((dbVersion) => {
        // save dbVersion to pouch for next time
        let doc = {"_id": "dbVersion", "dbVersion":dbVersion}
        this.databaseService.insertOrUpdate(doc)
      })

    this.databaseService.getFromFirebase("letters")
      .then((letters) => {
        // save letters to pouch for next time
        let doc = {"_id": "letters", "letters":letters}
        this.databaseService.insertOrUpdate(doc)
        this.getEntriesForLetter(letters)
      })
  }

  // . . . . . . . . . . . . . . . . . . . . . . . . . . .

  getEntriesForLetter(letters) {
    this.startWorker()
    letters.map( (letter) => {
      this.broadcast("get entries for " + letter)
      this.lettersLoadingAdd(letter)
      this.messageWorker({
        "message":"getEntriesForLetter",
        "location":this.databaseService.entriesKey,
        "child":"initial",
        "value":letter
      })
    })
  }

  lettersLoadingAdd(letter) {
    this.lettersLoading.push(letter)
    this._lettersLoading$.next(this.lettersLoading)
    // could persist this list and resume next time
  }

  lettersLoadingDelete(letter) {
    if (this.lettersLoading.length > 0) {
      let index = this.lettersLoading.indexOf(letter)
      if (index > -1) this.lettersLoading.splice(index, 1)
      this._lettersLoading$.next(this.lettersLoading)
      // check again. if there are no letters left, we're done
      if (this.lettersLoading.length > 0) this._downloading$.next(false)
    }
  }

  showLettersLoaded(entries) {
    // 2c work out the letters to show
    for (let lang in this.lettersLoaded){
      for (let key in entries) {
        let entry = entries[key]
        let flattened = this.entryService.flattenSenses(entry)
        if (flattened) {
          let char = (lang=='ENG') ? this.entryService.getInitial(flattened) : entry.initial
          if (this.lettersLoaded[lang].indexOf(char) == -1 ) this.lettersLoaded[lang].push(char)
          this.lettersLoaded[lang].sort()
        }
      }
    }
    this._downloading$.next(false)
    this.broadcast('')
  }


  // . . . . . . . . . . . . . . . . . . . . . . . . . . .

  startWorker() {
    if (typeof(Worker) !== "undefined") {
      if (typeof(this.worker) == "undefined") {
        this.worker = new Worker("assets/js/firebase-worker.js")
        // how to deal with worker replies
        this.worker.onmessage = (event) => {
            this.zone.run(()=>{
              if (event.data.message == "replaceEntries") {
                this.entryService.replaceEntries(event.data.entries)
              }
              if (event.data.message == "mergeEntries") {
                this.entryService.mergeEntries(event.data.entries)
              }
              // Remove this from our list of downloading letters..
              if (event.data.letter) {
                this.lettersLoadingDelete(event.data.letter)
              }
              // Update the ui
              if (event.data.entries) {
                this.showLettersLoaded(event.data.entries)
              }
            })
        }
      }
    } else {
      console.log("Sorry, couldn't get the data. No Web Worker support.")
    }
  }

  stopWorker() {
    if (typeof(this.worker) != "undefined") this.worker.terminate()
    delete(this.worker)
  }

  messageWorker(message) {
    this.worker.postMessage(message)
  }

}
