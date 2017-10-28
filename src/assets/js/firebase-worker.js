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
var config = {
    apiKey: "AIzaSyAof-FJq1ZJiE5Wx-fvTK4xc9b8whWquO4",
    authDomain: "dharug-3239a.firebaseapp.com",
    databaseURL: "https://dharug-3239a.firebaseio.com",
    projectId: "dharug-3239a",
    storageBucket: "dharug-3239a.appspot.com",
    messagingSenderId: "449884289934"
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
