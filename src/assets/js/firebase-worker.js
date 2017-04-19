importScripts("https://www.gstatic.com/firebasejs/3.6.1/firebase.js");
importScripts("https://www.gstatic.com/firebasejs/3.6.1/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/3.6.1/firebase-database.js");

var config = {
    apiKey: "XXXXXXXX",
    authDomain: "XXXXXXXX",
    databaseURL: "XXXXXXXX",
    projectId: "XXXXXXXX",
    storageBucket: "XXXXXXXX",
    messagingSenderId: "XXXXXXXX"
};

firebase.initializeApp(config);

function getFromFirebase(key) {
  postMessage({"message":"doing get from Firebase"});
  firebase.database().ref(key)
    .once("value")
    .then(function(snapshot){
      postMessage({"message":"replaceEntries", "entries": snapshot.val() });
    });
}

function queryFirebase(location, child, value) {
  postMessage({"message":"doing query Firebase"});
  firebase.database().ref(location)
    .orderByChild(child)
    .equalTo(value)
    .once("value")
    .then(function(snapshot){
      postMessage({"message":"mergeEntries", letter:value, "entries": snapshot.val() });
    });
}

onmessage = function(message) {
  if (message.data.message == "getWords") {
    getFromFirebase(message.data.location);
  }
  if (message.data.message == "getEntriesForLetter") {
    queryFirebase(message.data.location, message.data.child, message.data.value);
  }
}
