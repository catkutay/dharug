import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';

import { MyApp } from './app.component';
import { ComponentsModule } from '../components/components.module'
import { PipesModule } from '../pipes/pipes.module'

// providers
import { DatabaseService } from '../providers/database-service'
import { EntryService } from '../providers/entry-service'
import { LanguageService } from '../providers/language-service'
import { ConnectivityService } from '../providers/connectivity-service'
import { SyncService } from '../providers/sync-service'

// 3rd party deps
import firebase from 'firebase'
import { FirebaseProvider } from '../providers/firebase/firebase';


// firebase
export const firebaseConfig = {

    apiKey: "AIzaSyAof-FJq1ZJiE5Wx-fvTK4xc9b8whWquO4",
    authDomain: "dharug-3239a.firebaseapp.com",
    databaseURL: "https://dharug-3239a.firebaseio.com",
    projectId: "dharug-3239a",
    storageBucket: "dharug-3239a.appspot.com",
    messagingSenderId: "449884289934"
  
}

@NgModule({
  declarations: [
    MyApp
  ],
  imports: [
    BrowserModule,
    ComponentsModule,
    PipesModule,
    IonicModule.forRoot(MyApp, {
      preloadModules: true
    })
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp
  ],
  providers: [
    DatabaseService,
    EntryService,
    LanguageService,
    ConnectivityService,
    SyncService,
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    FirebaseProvider
  ]
})
export class AppModule {
  constructor() {
    firebase.initializeApp(firebaseConfig)
  }
}
