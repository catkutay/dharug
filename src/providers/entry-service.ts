import { Injectable } from '@angular/core';
import { BehaviorSubject } from "rxjs/BehaviorSubject"
import { DatabaseService } from './database-service'
import { LanguageService } from './language-service'

declare var cordova: any

@Injectable()
export class EntryService {

  _entries$: BehaviorSubject<any> = new BehaviorSubject({})
  _entriesIndex$: BehaviorSubject<any> = new BehaviorSubject({})
  _letter$: BehaviorSubject<string> = new BehaviorSubject("")
  // use entriesAll as a memory cache of all the entries,
  // then the observable (entries$) can be the entries for the current state
  entriesAll: any = {}
  entriesIndex: any
  languageCode: any
  languagesSub: any
  selectedLetter: string

  constructor(
    public databaseService: DatabaseService,
    public languageService: LanguageService
  ) {
    // initialise the entries index arrays. eg { lang : [], lang : [] }
    this.languagesSub = this.languageService.languages$.subscribe((languages) => {
      if (typeof(this.entriesIndex)=="undefined") {
        this.entriesIndex = {}
        for (let language of languages) {
          this.entriesIndex[language.code] = []
        }
      }
    })

    this.languageService.languageCode$.subscribe((language) => this.languageCode = language)
  }

  // . . . . . . . . . . . . . . . . . . . . . . . .

  get entries$() {
    return this._entries$.asObservable()
  }
  get entriesIndex$() {
    return this._entriesIndex$.asObservable()
  }
  get letter$() {
    return this._letter$.asObservable()
  }

  // . . . . . . . . . . . . . . . . . . . . . . . .

  setLetter(letter) {
    this.selectedLetter = letter
    this._letter$.next(letter)
  }

  // . . . . . . . . . . . . . . . . . . . . . . . .

  getWordlistForLetter() {
    return new Promise((resolve, reject) => {
      if (this.languageCode) {
          // replace e.key e.word with full entry record
          let arr = this.entriesIndex[this.languageCode][this.selectedLetter].map( (e) => {
            let entry = this.entriesAll[e.key]
            entry.key = e.key
          return entry
        })
        this._entries$.next( arr )
        this._entriesIndex$.next( this.entriesIndex[this.languageCode][this.selectedLetter] )
        resolve (arr)
      } else {
        reject (0)
      }
    })
  }

  getEntry(key) {
    return(this.entriesAll[key])
  }

  // . . . . . . . . . . . . . . . . . . . . . . . .

  // Update our collection with retrieved firebase objects

  mergeEntries(entries) {
    // create an index for ordered flicking
    this.buildIndex(entries)
    // combine with our existing entries (need to de-duplicate?)
    Object.assign(this.entriesAll, entries)
    this._entries$.next( this.entriesAll )
    // Save to pouch
    let doc = {"_id": this.databaseService.entriesKey}
    doc[this.databaseService.entriesKey] = this.entriesAll
    this.databaseService.insertOrUpdate(doc)
      .then((res)=>{
        console.log(res)
      })
      .catch((err)=>{
        console.log(err)
      })
  }

  // Replace collection with pouch data

  replaceEntries(entries) {
    this.buildIndex(entries)
    this.entriesAll = entries
    this._entries$.next( this.entriesAll )
  }

  // . . . . . . . . . . . . . . . . . . . . . . . .

  // fast-find array to help with navigating to prev/next entries

  buildIndex(entries){
    for (let lang in this.entriesIndex) {
      for (let key in entries) {
        let entry = entries[key]
        let flattened = this.flattenSenses(entry)
        if (flattened) {
          let char = (lang=='ENG') ? this.getInitial(flattened) : entry.initial
          
          //entry.def??
          let word = (lang=='ENG') ? this.getWord(flattened) : entry.lx
          if (typeof(this.entriesIndex[lang][char])=="undefined") this.entriesIndex[lang][char] = []
          this.entriesIndex[lang][char].push({key:key, word:word})
        }
      }
      // sort the arrays by the word value
      for(let key in this.entriesIndex[lang]) {
        let arr = this.entriesIndex[lang][key]
        arr.sort(this.dynamicSort("word"))
      }
    }
    this._entriesIndex$.next( this.entriesIndex )
  }

  flattenSenses(entry) {
    let word, def, ge
    if (entry.senses) {
      // senses may be an array or singular
      if (entry.senses.length > 0) {
        if (entry.senses[0].def) def = entry.senses[0].def
        if (entry.senses[0].ge) ge = entry.senses[0].ge
      } else {
        if (entry.senses.def) def = entry.senses.def
        if (entry.senses.ge) ge = entry.senses.ge
      }
      // def / ge might be arrays, so just get the first item
      if ( (typeof(def)=="object") && (def.length > 0) ) def = def[0]
      if ( (typeof(ge)=="object") && (ge.length > 0) ) ge = ge[0]
      // combine so searches can search easily on either def or ge values
      word = def + ge
      // sanitise - drop hyphens
      if (word) word = word.replace(/[-]/g,"")
      // sanitise - everything else non-alpanumeric gets replaced by a period
      if (word) word = word.replace(/[^a-zA-Z0-9]+/g,".").toLowerCase() // \.\?\"
    } else {
      // no senses. log this so we can fix the data
      // console.log('MISSING senses', entry)
    }
    if (typeof(word)=="undefined") return false
    return word
  }

  dynamicSort(property) {
    let sortOrder = 1
    if(property[0] === "-") {
      sortOrder = -1
      property = property.substr(1)
    }
    return function (a,b) {
      let result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0
      return result * sortOrder
    }
  }


  // . . . . . . . . . . . . . . . . . . . . . . . .


  getInitial(word) {
    return(word.charAt(0))
  }

  getWord(word) {
    word = word.replace(/\./," ").toLowerCase()
    return(word.split(" ")[0])
  }

  // . . . . . . . . . . . . . . . . . . . . . . . .

  // todo - modify flattensenses so we serch in ge as well as def
  search(term: string) {
    return new Promise((resolve, reject) => {
      let searchEntries = []
      for (let key in this.entriesAll) {
        let searchstring = this.flattenSenses( this.entriesAll[key] )
        if (searchstring) {
          if (this.entriesAll[key].lx)  searchstring += this.entriesAll[key].lx
          if (this.entriesAll[key].lxc) searchstring += this.entriesAll[key].lxc
          if (searchstring.toLowerCase().indexOf( term.trim().toLowerCase() ) > -1) searchEntries.push(this.entriesAll[key])
        }
      }
      // need to work out how to do an index on this result for prev/next
      resolve(searchEntries)
    })
  }

}
