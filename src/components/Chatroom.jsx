import React from "react";
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import config from "../config.js"
import chat from "../lib/chatdata.js"

function Chatroom() {
 const [receiverID, setReceiverID] = useState("");
 const [messageText, setMessageText] = useState("");
 const [groupMessage, setGroupMessage] = useState([]);
 const [user, setUser] = useState({});
 const [isAuthenticated, setIsAuthenticated] = useState(true);

 const GUID = config.GUID;

 function sendTextMessage() {
  chat.sendIndividualMessage(UID, messageText).then(
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
   sendTextMessage();
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
        .map(member => member["uid"])
        .filter(member => member !== user["uid"])
      console.log(groupMemberNames);
      
      const receiverSelection = document.getElementById("members")
      for (const member of groupMemberNames) {
        const selection = document.createElement("option")
        selection.setAttribute("value", member)
        selection.textContent = member
        receiverSelection.appendChild(selection)
      }
    },
    error => {
      console.log("Error fetching group members:", error);
    }
   )
 }

 function messageListener() {
   chat.addMessageListener((data, error) => {
     if (error) return console.log(`error: ${error}`);
     setGroupMessage(prevState => [...prevState, data]);
     scrollToBottom()
   });
 };

 useEffect(() => {
   getUser();
   getGroupList();
   messageListener();
   // chat.joinGroup(GUID)
 }, []);

 if (!isAuthenticated) {
  return <Navigate to="/" replace />;
}

 return (
   <div className="chatWindow">
    <div id="receiverSelection">
      <label htmlFor="members">Send to: </label>
      <select name="members" id="members">
        <option value="">Select recipient</option>
      </select>
    </div>
     <ul className="chat" id="chatList">
       {groupMessage.map(data => (
         <div key={data.id}>
           {user.uid === data.sender.uid ? (
             <li className="self">
               <div className="msg">
                 <p>{data.sender.uid}</p>
                 <div className="message">{data.data.text}</div>
               </div>
             </li>
           ) : (
             <li className="other">
               <div className="msg">
                 <p>{data.sender.uid}</p>
                 <div className="message">{data.data.text}</div>
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
 );
};

export default Chatroom
