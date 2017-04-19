import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'
import { Observable } from 'rxjs/Observable'

import { ConnectivityService } from "./connectivity-service"

import firebase from 'firebase'
import PouchDB from 'pouchdb'

@Injectable()
export class DatabaseService {

  entriesKey: string = "entries"
  pdb: any
  appOnline: boolean
  _dbVersion$: BehaviorSubject<any> = new BehaviorSubject(null)

  constructor(
    public connectivityService: ConnectivityService
    ) {

    // create or open the db
    this.pdb = new PouchDB('Dictionary');

    connectivityService.status.subscribe((status) => {
      this.appOnline = (status !== 'offline')
    })

    this.getDbVersion()

  }

  populatePouch( key ) {
    return new Promise((resolve, reject) => {
      if ( ! this.appOnline) reject("no connection")
      this.getFromFirebase(key)
        .then((res) => {
          let doc = {"_id": key}
          doc[key] = res
          this.insertOrUpdate(doc)
          resolve(res)
        })
        .catch((err) => {
          reject(err)
        })
    })

  }

  get dbVersion$() {
    return this._dbVersion$.asObservable()
  }

  getDbVersion() {
    this.getFromFirebase("dbVersion").then((data:any) => {
      this._dbVersion$.next(data)
    })
  }


  // POUCH - - - - - - - - - - - - - - - -

  getFromPouch(key) {
    return new Promise((resolve, reject) => {
      this.pdb.get(key)
        .then((doc) => {
          resolve( doc[key] )
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  insertOrUpdate(doc) {
    return new Promise((resolve, reject) => {
      this.pdb.get(doc._id, {include_docs: true})
      .then((_doc) => {
          doc._rev = _doc._rev
          resolve(this.pdb.put(doc))
      }).catch((err) => {
          resolve(this.pdb.put(doc))
      })
    })
  }

  // FIREBASE - - - - - - - - - - - - - - - -

  getFromFirebase(key) {
    return new Promise((resolve, reject) => {
      firebase.database().ref(key)
          .once('value')
          .then((snapshot) => resolve(snapshot.val()) )
          .catch((err) => reject(err))
    })
  }

  queryFirebase(location, child, value) {
    return new Promise((resolve, reject) => {
      firebase.database().ref(location)
          .orderByChild(child)
          .equalTo(value)
          .once('value')
          .then((snapshot) => resolve(snapshot.val()) )
          .catch((err) => reject(err))
    })
  }
}
