import React from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import chat from "../lib/chatdata"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faRightToBracket, faCircle } from "@fortawesome/free-solid-svg-icons";

function RecentChats() {
 const [user, setUser] = useState({});
 const [isAuthenticated, setIsAuthenticated] = useState(true);
 const [conversations, setConversations] = useState([])

 const navigate = useNavigate()

 const userNameStyle = {
  display: "inline",
  fontSize: "1.25em",
  verticalAlign: "super",
  marginLeft: "10px"
 }

 const emptyMsgStyle = {
  textAlign: "center",
  opacity: 0.7
 }

 function recentConversations() {
  chat.conversationsRequest()
    .fetchNext()
    .then(
     conversationList => {
       setConversations(conversationList)
       console.log("Conversations list received:", conversationList);
     }, error => {
       console.log("Conversations list fetching failed with error:", error);
     }
    )
 }

 function getUser() {
  chat
    .getLoggedinUser()
    .then(user => {
      console.log("user details:", { user });
      setUser(user);
    })
    .catch(({ error }) => {
      if (error.code === "USER_NOT_LOGGED_IN") {
        setIsAuthenticated(false);
      }
    });
 };

 function messagesDelivered() {
  conversations.map(convo => {
    if (convo["lastMessage"]["sender"]["uid"] !== user["uid"] && !convo["lastMessage"].hasOwnProperty("deliveredAt")) {
      chat.markAsDelivered(convo["lastMessage"])
    }
  })
 }

 function newChat() {
  navigate("/chat")
 }

 function goToChat(receiver) {
  navigate(`/chat?receipient=${receiver}`)
  chat.messagesRequest(receiver, 30)
   .then(
    messages => {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage["sender"]["uid"] !== user["uid"] && !lastMessage.hasOwnProperty("readAt")) { chat.markAsRead(lastMessage) }
    },
    error => { console.log("Could not fetch messages: " + error) }
   )
 }

 function logout() {
  chat.logout()
  navigate("/login")
 }

 useEffect(() => {
  getUser();
 }, []);

 useEffect(() => {
  if (user !== null) {
    recentConversations()
  }
 }, [user])

 useEffect(() => {
  messagesDelivered()
  const messageList = document.querySelector("#messageList")
  if (conversations.length === 0) {
    messageList.style.borderBottom = "none"
  } else {
    messageList.style.borderBottom = "1px solid black"
  }
  console.log(conversations)
 }, [conversations])


 return (
  <>
    <div className="navigation-recent">
     <div className="userInfo">
      <img src={user["avatar"]} alt="" style={{ width: "30px" }} />
      <p style={userNameStyle}>{user["name"]}</p>
     </div>
     <button className="nav-btn" onClick={logout} style={{ display: "block" }}>
       <FontAwesomeIcon icon={faRightToBracket} size="lg" className="icon-spacing" />
       Logout
     </button>
    </div>
    <div id="listWindow">
      <div id="header">
       <h1>Recent Conversations</h1>
       <button id="new-msg-btn" onClick={newChat}>
         <FontAwesomeIcon icon={faPlus} size="lg" className="icon-spacing"/>
         <span>New Message</span>
       </button>
     </div>
     <div id="messageList">
       {conversations.length === 0 ? (<h2 style={emptyMsgStyle}>No conversations to display.</h2>) 
       : conversations.map(convo => {
        const receiverID = convo["conversationWith"]["uid"]
        const receiverName = convo["conversationWith"]["name"]
        const senderID = convo["lastMessage"]["sender"]["uid"]
        const messageText = convo["lastMessage"]["text"]
        
        return (
         <div 
          className="conversation" 
          key={convo["conversationId"]} 
          onClick={(e) => goToChat(receiverID)}>
           <div className="profilePic">
             <img src={convo["conversationWith"]["avatar"]} alt={receiverID} className="avatar" />
           </div>
           <div className="conversationInfo">
             <h3>
             {receiverName}
             <span className="userID">{receiverID}</span>
             </h3>
             {senderID === user["uid"] ? (
               <p className="last-message">You: {messageText}</p>
             ) : senderID !== user["uid"] && !convo["lastMessage"].hasOwnProperty("readAt") ? (
              <>
               <FontAwesomeIcon icon={faCircle} size="sm" style={{ color: "#1c5bca" }} className="icon-spacing" />
               <p className="last-message" style={{ fontWeight: "bold", opacity: 1, display: "inline" }}>{messageText}</p>
              </>
              ) : (
              <p className="last-message">{messageText}</p>
              )}
           </div>
         </div>
         )
        }
       )
      }
     </div>
   </div>
  </>
 )
}

export default RecentChats