import React from "react";
import { useState, useEffect, useMemo, useRef } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import config from "../config.js"
import chat from "../lib/chatdata.js"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faRightToBracket, faFaceSmile } from "@fortawesome/free-solid-svg-icons";
import { calculateTimeDifference, displayDateOrTime, darkenBackground, lightenBackground } from "../smalleffects.js";
import '@cometchat/uikit-elements'

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
 const [contextMenuDisplay, setContextMenuDisplay] = useState("none");
 const [menuCoordinates, setMenuCoordinates] = useState({ x: 0, y: 0 });
 const [selected, setSelected] = useState("")


 const navigate = useNavigate();
 const emojiKeyboardRef = useRef(null)
 const para = useRef(null)
 const GUID = config.GUID;

 const emojiKeyboardStyle = {
  height: "250px",
  display: "none"
 }

 const contextMenuStyle = {
  display: contextMenuDisplay,
  backgroundColor: "white",
  border: "1px solid gray",
  position: "absolute",
  zIndex: 100,
  top: `${menuCoordinates.y}px`,
  left: `${menuCoordinates.x}px`
 }

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

 // Unused function
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
   const chatList = document.getElementById("chatList");
   chatList.scrollTop = chatList.scrollHeight;
 };

 function handleSubmit(event) {
   event.preventDefault();
   sendTextMessage(receiverID);
   event.target.reset();
 };

 function handleChange(event) {
   setMessageText(event.target.value);
   const emojiKeyboard = emojiKeyboardRef.current;
   emojiKeyboard.addEventListener("cc-emoji-clicked", (e) => {
    setMessageText(event.target.value + e.detail.id)
   })
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

 function handleActivityReceived(msgReceipt, error) {
  if (error) return console.log(`error: ${error}`);
  para.current.style.fontSize = "0.75em"
  para.current.textContent = "Delivered";
  console.log(msgReceipt);
 }

 function handleActivityRead(msgReceipt, error) {
  if (error) return console.log(`error: ${error}`);
  para.current.style.fontSize = "0.75em"
  para.current.textContent = `Read ${displayDateOrTime(msgReceipt["readAt"])}`;
  console.log(msgReceipt);
 }

 function handleChatActivity(message, error) {
  if (error) return console.log(`error: ${error}`);
  setTextConversation(prevState => [...prevState, message]);
  if (message["sender"]["uid"] !== user["uid"]) {
    chat.markAsDelivered(message)
    chat.markAsRead(message)
  }
  console.log("Message received: " + message)
  scrollToBottom()
 }

 function messageListener() {
  chat.addMessageListener(handleChatActivity);
 };

 function activityListener() {
  chat.addActivityListener(handleActivityReceived, handleActivityRead)
 }

 function displayReceipt() {
  const lastMessage = textConversation[textConversation.length - 1]
  if (lastMessage["sender"]["uid"] === user["uid"] && lastMessage.hasOwnProperty("readAt")) {
    para.current.textContent = "Read " + displayDateOrTime(lastMessage["readAt"])
    para.current.style.fontSize = "0.75em"
  }
 }

 function displayEmojiKeyboard() {
  const keyboard = emojiKeyboardRef.current
  keyboard.classList.toggle("displayed")
 }

 function displayContextMenu(event, messageID) {
  const parentElement = event.target.closest(".msg")
  // const messageDiv = document.getElementById(messageID)
  setSelected(messageID)

  if (parentElement) {
    event.preventDefault()
    const { clientX, clientY } = event
    darkenBackground(parentElement)
    parentElement.classList.add("selected")

    setMenuCoordinates({ x: clientX, y: clientY })
    setContextMenuDisplay("block")
  }
 }

 function removeContextMenu(event) {
  const messages = document.querySelectorAll(".msg")
  for (const message of messages) {
    if (message.classList.contains("selected")) {
      lightenBackground(message)
      message.classList.remove("selected")
    }
  }
  setContextMenuDisplay("none")
  setSelected("")
 }

 function deleteMessage() {
   // Code for function will be set up later...
 }

 function getConversation() {
  chat.messagesRequest(receiverID, 100)
     .then(
      messages => {
        setTextConversation(messages)
        console.log(messages)
      },
      error => console.log("Could not load messages: " + error)
     )
 }

 function backToConversationList() {
  navigate("/recentmsgs")
  chat.removeListener(chat.LISTENER_KEY_MESSAGE, chat.LISTENER_KEY_ACTIVITY)
 }

 function logout() {
  chat.logout()
  chat.removeListener(chat.LISTENER_KEY_MESSAGE, chat.LISTENER_KEY_ACTIVITY, chat.LISTENER_KEY_CONVERSATION)
  navigate("/login")
 }
 
 useEffect(() => {
   getUser();
   // chat.joinGroup(GUID)
 }, []);

 useEffect(() => {
  if (user !== null) {
    getGroupList()
    messageListener();
    activityListener();
  }
 }, [user])

 useEffect(() => {
  if (textConversation.length > 0) {
    displayReceipt()
  }
 }, [textConversation])

 useEffect(() => {
  if (receiverID !== "") {
    getConversation()
  }
 }, [receiverID])

 // useEffect(() => {console.log(selected)}, [selected])

 if (!isAuthenticated) {
  return <Navigate to="/" replace />;
}

 return (
  <div id="page" onClick={removeContextMenu}>
   <div className="navigation-chat">
    <button className="nav-btn" onClick={backToConversationList}>
      <FontAwesomeIcon icon={faArrowLeft} size="lg" className="icon-spacing" />
      Back
    </button>
    <button className="nav-btn" onClick={logout}>
    <FontAwesomeIcon icon={faRightToBracket} size="lg" className="icon-spacing" />
      Logout
    </button>
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
         <div key={message.id} id={message.id}>
           {user.uid === message.sender.uid ? (
             <li className="self">
               <div className="msg" onContextMenu={(event) => displayContextMenu(event, message.id)}>
                 <div className="message">{message.text}</div>
               </div>
               {textConversation.indexOf(message) === textConversation.length - 1 ? (<p ref={para}></p>) : ""}
               {/* {textConversation.indexOf(message) === textConversation.length - 1 ? displayReceipt(message) : ""} */}
             </li>
           ) : (
             <li className="other">
               <div className="msg" onContextMenu={(event) => displayContextMenu(event, message.id)}>
                 <div className="message">{message.text}</div>
               </div>
             </li>
           )}          
         </div>
       ))}
     </ul>
     <div className="chatInputWrapper">
       <cometchat-emoji-keyboard style={emojiKeyboardStyle} ref={emojiKeyboardRef}></cometchat-emoji-keyboard>
       <form onSubmit={handleSubmit}>
         <FontAwesomeIcon 
           icon={faFaceSmile} 
           size="xl" 
           style={{ margin: "auto 0.75em", color: "#187dbc" }} 
           onClick={displayEmojiKeyboard} 
          />
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
   {contextMenuDisplay === "block" && (
    <div id="context-menu" style={contextMenuStyle}>
      <div className="menu-choice">Delete message</div>
      <div className="menu-choice">Delete multiple</div>
    </div>
    )}
  </div>
 );
};

export default Chatroom
