import React from "react";
import { useState, useEffect, useMemo } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import config from "../config.js"
import chat from "../lib/chatdata.js"

function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

function Chatroom() {
 const query = useQuery();

 const [receiverID, setReceiverID] = useState(query.get("receipient") ?? "");
 const [messageText, setMessageText] = useState("");
 const [textConversation, setTextConversation] = useState([]);
 const [memberList, setMemberList] = useState([])
 const [user, setUser] = useState(null);
 const [isAuthenticated, setIsAuthenticated] = useState(true);

 const navigate = useNavigate();
 const GUID = config.GUID;

 function sendTextMessage(receipient) {
  chat.sendIndividualMessage(receipient, messageText).then(
    message => {
      console.log("Message sent successfully:", message);
      setTextConversation(prevState => [...prevState, message]);
      setMessageText("");
    },
    error => {
      if (error.code === "ERR_NOT_A_MEMBER") {
        chat.joinGroup(GUID).then(response => {
          sendMessage();
        });
      } else {
       console.log("Message not sent. Button doesn't work. " + error.code )
      }
    }
  )
 }

 function sendMessageToGroup() {
   chat.sendGroupMessage(GUID, messageText).then(
     message => {
       console.log("Message sent successfully:", message);
       setMessageText("");
     },
     error => {
       if (error.code === "ERR_NOT_A_MEMBER") {
         chat.joinGroup(GUID).then(response => {
           sendMessage();
         });
       } else {
        console.log("Message not sent. Button doesn't work. " + error.code )
       }
     }
   );
 };

 function scrollToBottom() {
   const chat = document.getElementById("chatList");
   chat.scrollTop = chat.scrollHeight;
 };

 function handleSubmit(event) {
   event.preventDefault();
   sendTextMessage(receiverID);
   event.target.reset();
 };

 function handleChange(event) {
   setMessageText(event.target.value);
 };

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

 function getGroupList() {
  chat
   .getGroupMembers(GUID)
   .fetchNext()
   .then(
    groupMembers => {
      const groupMemberNames = groupMembers
        .map((member, index) => ({ 
          name: member["uid"],
          key: "00" + (index + 1) 
        }))
        .filter(member => member["name"] !== user["uid"])
      setMemberList(groupMemberNames)  
      console.log(groupMemberNames);
      console.log(user["uid"])
    },
    error => {
      console.log("Error fetching group members:", error);
    }
   )
 }

 function messageListener() {
   chat.addMessageListener((message, error) => {
     if (error) return console.log(`error: ${error}`);
     setTextConversation(prevState => [...prevState, message]);
     scrollToBottom()
   });
 };

 function getConversation() {
  chat.messagesRequest(receiverID, 100)
     .then(
      messages => setTextConversation(messages),
      error => console.log("Could not load messages: " + error)
     )
 }

 function logout() {
  chat.logout()
  navigate("/login")
 }
 
 useEffect(() => {
   getUser();
   messageListener();
   // chat.joinGroup(GUID)
 }, []);

 useEffect(() => {
  if (user !== null) {
    getGroupList()
  }
 }, [user])

 useEffect(() => {
  if (receiverID !== "") {
    getConversation()
  }
 }, [receiverID])

 if (!isAuthenticated) {
  return <Navigate to="/" replace />;
}

 return (
  <>
   <div id="logout">
    <button id="logout-btn" onClick={logout}>Logout</button>
   </div>
   <div className="chatWindow">
    <div id="receiverSelection">
      <label htmlFor="members">Send to: </label>
      <select name="members" value={receiverID} id="members" onChange={(event) => setReceiverID(event.target.value)}>
        <option value="">Select receipient</option>
        {memberList.map(member => 
          <option 
            value={member["name"]} 
            key={member["key"]}>
              {member["name"]}
          </option>
        )}
      </select>
    </div>
     <ul className="chat" id="chatList">
       {textConversation.map(message => (
         <div key={message.id}>
           {user.uid === message.sender.uid ? (
             <li className="self">
               <div className="msg">
                 <div className="message">{message.text}</div>
               </div>
             </li>
           ) : (
             <li className="other">
               <div className="msg">
                 <div className="message">{message.text}</div>
               </div>
             </li>
           )}
         </div>
       ))}
     </ul>
     <div className="chatInputWrapper">
       <form onSubmit={handleSubmit}>
         <input
           className="textarea input"
           type="text"
           placeholder="Enter your message..."
           value={messageText}
           onChange={handleChange}
         />
         <button type="submit" id="sendButton">Send</button>
       </form>
     </div>
   </div>
  </>
 );
};

export default Chatroom
