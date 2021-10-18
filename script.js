import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-app.js";
import * as rtdb from "https://www.gstatic.com/firebasejs/9.1.2/firebase-database.js";
import * as fbauth from "https://www.gstatic.com/firebasejs/9.1.2/firebase-auth.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
   apiKey: "AIzaSyBrpTLLn187dEp6GmdorNU82luariYrRnY",
   authDomain: "chatapp470-779f7.firebaseapp.com",
   databaseURL: "https://chatapp470-779f7-default-rtdb.firebaseio.com",
   projectId: "chatapp470-779f7",
   storageBucket: "chatapp470-779f7.appspot.com",
   messagingSenderId: "309925841817",
   appId: "1:309925841817:web:1a8c3066a1d45710b86108",
   measurementId: "G-XS39WHKD0Z"
};

  // Initialize Firebase
let username = "";
let uid = "";
let roles = "";
let channelName = "general";

const app = initializeApp(firebaseConfig);
let db = rtdb.getDatabase(app);
let titleRef = rtdb.ref(db, "/");
let channelRef = rtdb.child(titleRef, "channels/");
let chatRef = rtdb.child(channelRef, channelName);
let userRef = rtdb.child(titleRef, "users/");
let auth = fbauth.getAuth(app);

let userClickHandler = function(evt){
  if(roles == "admin"){
    let clickedElement = evt.currentTarget;
    let idFromDom = $(clickedElement).attr("data-id");
    let selectedUserRef = rtdb.ref(db, `/users/${idFromDom}/`);
    $(clickedElement).after(`
    <button data-done=${idFromDom}>Make Admin</button>`);
    $(`[data-done=${idFromDom}]`).on("click", (evt)=>{
       rtdb.get(selectedUserRef).then(ss=>{
        let adminUser = {
          "email": ss.val().email,
          "name": ss.val().name,
          "roles": "admin"
        }
        rtdb.set(selectedUserRef, adminUser);
      })
     })
    }
  }

let renderUser = function(userObj) {
  rtdb.onValue(userRef, ss=>{
    let userList = ss.val();
    $("#userlist").empty();
    let usernames = Object.keys(userList);
    usernames.map((users)=>{
      let userObj = userList[users];
      if (userObj.roles === "admin") {
        $("#userlist").append(
        `<div class="users" data-id=${users}>
          ${userObj.name} - Admin <div button-id=${users}}></div>
        </div>`
       )}
      else {
      $("#userlist").append(
        `<div class="users" data-id=${users}>
          ${userObj.name}
        </div>`
      )
    }}
  )   
  $("#logout").on("click", ()=>{
    fbauth.signOut(auth);
  })
  $(".users").click(userClickHandler);
 })
}

let addChannelClickHandler = function(evt){ 
  channelName = document.getElementById("channel-input").value;
  let newChannelRef = rtdb.ref(db,`/channels/${channelName}/`);
  let time = new Date().getTime();
  let initialMsg = {
    "UUID": "server",
    "msg": "New channel made!",
    "username": "Server",
    "time": time,
    "edited": false,
  }
  rtdb.set(newChannelRef, channelName);
  rtdb.push(newChannelRef, initialMsg);
  chatRef = rtdb.child(channelRef, channelName);
  rtdb.onValue(chatRef, ss=>{
    renderChats(ss.val());
   })
  renderChannels();
}

let renderAdminButtons = function () {
  let myUserRef = rtdb.child(titleRef,`users/${uid}`);
  rtdb.get(myUserRef).then(ss=>{
    if (roles == "admin") {
      $("#admin-buttons").show();
      $("#clearbutton").show();
    }
    else {
      $("#admin-buttons").hide();
      $("#clearbutton").hide();
    }
  })
  $("#add-channel").click(addChannelClickHandler);
}

let channelClickHandler = function(evt){
  let clickedElement = evt.currentTarget;
  let idFromDom = $(clickedElement).attr("data-id");
  channelName = idFromDom;
  chatRef = rtdb.child(channelRef, channelName);
   rtdb.onValue(chatRef, ss=>{
    renderChats(ss.val());
   })
  renderChannels();
}

let renderChannels = function() {
  let renderChannelRef = rtdb.child(titleRef, "channels/");
    
  rtdb.onValue(renderChannelRef, ss=>{
    let channelObj = ss.val();
    $("#channel-list").empty();
    let channelNames = Object.keys(channelObj);
    channelNames.map((channel)=>{
      if(channelName == channel){
        $("#channel-list").append(
        `<div class="channels" data-id=${channel} style="color:rgb(0,255,0)">
         ${channel}
         </div>`
      )} else {
        $("#channel-list").append(
        `<div class="channels" data-id=${channel}>
         ${channel}
         </div>`
        )}
      })
    $(".channels").click(channelClickHandler);
    })
 }

fbauth.onAuthStateChanged(auth, user => {
      if (!!user){
        let currentUser = {
          email: user.email,
          uid: user.uid,
          user: "",
          roles: "",
        }
        let currentUserRef = rtdb.ref(db, `/users/${currentUser.uid}`);
        rtdb.get(currentUserRef).then(ss=>{
          username = ss.val().name;
          uid = user.uid;
          roles = ss.val().roles;
        });
        $("#login").hide();
        $("#app").show();
        renderUser(user);
        renderAdminButtons();
        renderChannels();
        rtdb.onValue(chatRef, ss=>{
            renderChats(ss.val());
        })
      } else {
        $("#login").show();
        $("#app").hide();
      }
});

$("#register").on("click", ()=>{
  let email = $("#regemail").val();
  username = $("#regusername").val();
  let p1 = $("#regpass1").val();
  let p2 = $("#regpass2").val();
  if (p1 != p2){
    alert("Passwords don't match");
    return;
  }
  fbauth.createUserWithEmailAndPassword(auth, email, p1).then(somedata=>{
    uid = somedata.user.uid;
    let user = {
      roles: "user",
      name: username,
      email: email,
     }
    let newUserRef = rtdb.ref(db,`/users/${uid}/`)
    rtdb.set(newUserRef, user);
  }).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    console.log(errorCode);
    console.log(errorMessage);
  });
});

$("#login").on("click", ()=>{
  let email = $("#logemail").val();
  let pwd = $("#logpass").val();
  fbauth.signInWithEmailAndPassword(auth, email, pwd).then(
    somedata=>{
      console.log(somedata);
    }).catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      console.log(errorCode);
      console.log(errorMessage);
    });
});

let sendEdit = function(msgid, msgup){
  let msgRef = rtdb.child(chatRef, msgid);
  rtdb.update(msgRef, {"edited": true, "msg": msgup});
}

let editClickHandler = function(evt){
  let clickedElement = evt.currentTarget;
  let idFromDOM = $(clickedElement).attr("data-id");
  let messageRef = rtdb.child(chatRef, idFromDOM);
  rtdb.get(messageRef).then(ss=>{
    let msgUID = ss.val().UUID;
  
    if(uid == msgUID){
      $(clickedElement).after(`
        <input type="text" 
          data-edit=${idFromDOM} 
          class="msgedit" 
          placeholder="Edit Your message"/>
        <button data-done=${idFromDOM}>Send Edit</button>`);
      $(`[data-done=${idFromDOM}]`).on("click", (evt)=>{
        let editedMsg = $(`[data-edit=${idFromDOM}]`).val();
        sendEdit(idFromDOM, editedMsg);
        $(`[data-edit=${idFromDOM}]`).remove();
        $(`[data-done=${idFromDOM}]`).remove();
      });
    }
  })
}

let renderChats = function(chatObj){
  $("#chatbox").empty();
  let theIds = Object.keys(chatObj);
  theIds.map((anId)=>{
    let msgObj = chatObj[anId];
    $("#chatbox").append(
      `<div class="msg" data-id=${anId}>
      ${msgObj.username}:<br>
      ${msgObj.msg} ${msgObj.edited ? "<span>(edited)</span>" : ""}</div>`
    );
  });
  $(".msg").click(editClickHandler);
}

let addMessage = function(){
  let message = $("#chatinput").val();
  $("#incomingMsg").empty();
  let time = new Date().getTime();
  
  let msgObj = {
    "UUID": uid,
    "msg": message,
    "username": username,
    "time": time,
    "edited": false,
  }
  rtdb.push(chatRef, msgObj);
}

var clearHandler = function(eventObject) {
  $("#chathistory").empty();
  rtdb.remove(chatRef);
}

document.querySelector("#chatbutton").addEventListener("click" , addMessage);
document.querySelector("#clearbutton").addEventListener("click", clearHandler);
