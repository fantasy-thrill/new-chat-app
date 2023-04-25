import React from "react";
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";

function Chatroom() {
 const [receiverID, setReceiverID] = useState("");
 const [messageText, setMessageText] = useState("");
 const [groupMessage, setGroupMessage] = useState([]);
 const [user, setUser] = useState({});
 const [isAuthenticated, setIsAuthenticated] = useState(true);

 const GUID = config.GUID;

 function sendMessage() {
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
   sendMessage();
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
       if (error.code === "USER_NOT_LOGED_IN") {
         setIsAuthenticated(false);
       }
     });
 };

 function messageListener() {
   chat.addMessageListener((data, error) => {
     if (error) return console.log(`error: ${error}`);
     setGroupMessage(prevState => [...prevState, data]);
   });
 };

 useEffect(() => {
   getUser();
   messageListener();
   // chat.joinGroup(GUID)
 }, []);

 if (!isAuthenticated) {
  return <Navigate to="/" replace />;
}

 return (
   <div className="chatWindow">
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
       </form>
     </div>
   </div>
 );
};

export default Chatroom