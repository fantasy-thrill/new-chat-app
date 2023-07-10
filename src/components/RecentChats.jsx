import React from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import chat from "../lib/chatdata"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faRightToBracket, faCircle } from "@fortawesome/free-solid-svg-icons";
import { calculateTimeDifference, displayDateOrTime } from "../unixconverter";

function RecentChats() {
 const [user, setUser] = useState({});
 const [isAuthenticated, setIsAuthenticated] = useState(true);
 const [conversations, setConversations] = useState([])

 const navigate = useNavigate()
 const lastMessagePara = useRef(null)

 const userNameStyle = {
  display: "inline",
  fontSize: "1.25em",
  verticalAlign: "super",
  marginLeft: "10px"
 }

 const unreadMsgStyle = {
  fontWeight: "bold", 
  opacity: 1, 
  display: "inline-block",
  marginBlockStart: 0
 }

 function recentConversations() {
  chat.conversationsRequest()
    .fetchNext()
    .then(
     conversationList => {
       if (conversationList.length === 0) {
        const messageList = document.querySelector("#messageList")
        messageList.innerHTML = "<h2 style=\"text-align: center; opacity: 0.7;\">No conversations to display.</h2>"
       } else {
        setConversations(conversationList)
       console.log("Conversations list received:", conversationList);
       }
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

//  function messageListener() {
//  const lastMessage = lastMessagePara.current
//   chat.addMessageListener((message, error) => {
//     if (error) return console.log(`error: ${error}`);
//     conversations.map((convo) => {
//       if (message["conversationId"] === convo["conversationId"]) {
//         convo["lastMessage"] = message
//         chat.markAsDelivered(convo["lastMessage"])
        
//         lastMessage.textContent = message["text"]
//       }
//     })
//   })
//  }

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
    messagesDelivered()
  }
 }, [user])

 useEffect(() => {
  // messageListener()
  const messageList = document.querySelector("#messageList")
  if (conversations.length === 0) {
    messageList.style.borderBottom = "none"
  } else {
    messageList.style.borderBottom = "1px solid black"
  }
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
         <FontAwesomeIcon icon={faPenToSquare} size="lg" className="icon-spacing"/>
         <span>New Message</span>
       </button>
     </div>
     <div id="messageList">
       {conversations.map(convo => {
        const receiverID = convo["conversationWith"]["uid"]
        const receiverName = convo["conversationWith"]["name"]
        const senderID = convo["lastMessage"]["sender"]["uid"]
        const messageText = convo["lastMessage"]["text"]

        const sentTime = convo["lastMessage"]["sentAt"]
        
        return (
         <div 
          className="conversation" 
          key={convo["conversationId"]} 
          onClick={(e) => goToChat(receiverID)}>
           <div className="profilePic">
             <img src={convo["conversationWith"]["avatar"]} alt={receiverID} className="avatar" />
           </div>
           <div className="conversationInfo">
             <h3 className="receiver">
             {receiverName}
             <span className="userID">{receiverID}</span>
             </h3>
             {senderID === user["uid"] ? (
               <p className="last-message">You: {messageText}</p>
             ) : senderID !== user["uid"] && !convo["lastMessage"].hasOwnProperty("readAt") ? (
              <>
               <p className="last-message" style={unreadMsgStyle} ref={lastMessagePara}>
                <FontAwesomeIcon icon={faCircle} size="sm" style={{ color: "#1c5bca" }} className="icon-spacing" />
                {messageText}
                </p>
              </>
              ) : (
              <p className="last-message" ref={lastMessagePara}>{messageText}</p>
              )}
           </div>
           <div className="dateOrTime">
            {displayDateOrTime(sentTime)}
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