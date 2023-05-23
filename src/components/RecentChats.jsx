import React from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import chat from "../lib/chatdata"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

function RecentChats() {
 const [user, setUser] = useState(null);
 const [isAuthenticated, setIsAuthenticated] = useState(true);
 const [conversations, setConversations] = useState([])

 const navigate = useNavigate()

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

 function newChat() {
  navigate("/chat")
 }

 function goToChat(receiver) {
  navigate(`/chat?receipient=${receiver}`)
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
  console.log(conversations)
 }, [conversations])


 return (
  <>
   <div id="logout">
    <button id="logout-btn" onClick={logout}>Logout</button>
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
       {conversations.map(convo => (
        <div 
         className="conversation" 
         key={convo["conversationId"]} 
         onClick={(e) => goToChat(convo["conversationWith"]["uid"])}>
          <div className="profilePic">
            <img src={convo["conversationWith"]["avatar"]} alt={convo["conversationWith"]["uid"]} className="avatar" />
          </div>
          <div className="conversationInfo">
            <h3>
             {convo["conversationWith"]["name"]}
             <span className="userID">{convo["conversationWith"]["uid"]}</span>
            </h3>
            {convo["lastMessage"]["sender"]["uid"] ===  user["uid"] ? (
             <p>You: {convo["lastMessage"]["text"]}</p>
             ) : (
             <p>{convo["lastMessage"]["text"]}</p>
             )}
          </div>
        </div>
       ))}
     </div>
   </div>
  </>
 )
}

export default RecentChats