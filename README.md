This is a wordlist app, built with Ionic. It loads data from a Firebase database. It uses a web worker to load data because it was built for a dictionary with +25,000 entries and it was taking tooooo long without.

## Installation


### Install the code

Clone the code, cd into it and do `npm install`


### Set up a firebase account

Set permissions for firebase database read access in the firebase console `Database > Rules`

    {
      "rules": {
        ".read": "auth == null",
        ".write": "auth != null",
        "entries": {
          ".indexOn": ["initial"]
        }
      }
    }

For now, set the Storage rules to allow for public read access

    service firebase.storage {
      match /b/{bucket}/o {
        match /{allPaths=**} {
          allow write: if request.auth != null;
          allow read: if request.auth == null;
        }
      }
    }


Copy the firebase config settings from `Overview > Add Firebase to your web app` to the `/src/assets/js/firebase-worker.js` and `/src/app/app.module.ts` We need: 

- apiKey
- authDomain
- databaseURL
- storageBucket
- messagingSenderId



### Set your languages

Set your language codes in `/src/providers/language-service.ts`

 

-----

# Things to do 

provide sample json data

test without firebase worker

add attachment methods (save files and play)


-----

Kamuthant is a Kayardild word for 'a person who has a lot of words, who talks a lot'. 
