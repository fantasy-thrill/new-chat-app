import React from "react";
import { useState, useEffect, useMemo, useRef } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import config from "../config.js"
import chat from "../lib/chatdata.js"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faRightToBracket, faFaceSmile } from "@fortawesome/free-solid-svg-icons";
import { calculateTimeDifference, displayDateOrTime } from "../unixconverter";
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

 const navigate = useNavigate();
 const emojiKeyboardRef = useRef(null)
 //  const para = useRef(null)
 const GUID = config.GUID;

 const emojiKeyboardStyle = {
  height: "250px",
  display: "none"
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

 function messageListener() {
   //const lastMessage = textConversation[textConversation.length - 1]
   // const receipt = para.current;

   chat.addMessageListener(
    (message, error) => {
     if (error) return console.log(`error: ${error}`);
     setTextConversation(prevState => [...prevState, message]);
     if (message["sender"]["uid"] !== user["uid"]) { chat.markAsRead(message) }
     scrollToBottom()
    }
    // (msgReceipt, error) => {
    //  if (error) return console.log(`error: ${error}`);
    //  receipt.textContent = msgReceipt["receiptType"]
    //  console.log(msgReceipt)
    // },
    // (msgReceipt, error) => {
    //   if (error) return console.log(`error: ${error}`);
    //   receipt.textContent = msgReceipt["receiptType"] + displayDateOrTime(msgReceipt["readAt"])
    //   console.log(msgReceipt)
    // }
   );
 };

//  function getReceipts(msgID) {
//   chat.eventReceipts(msgID)
//  }

 function displayEmojiKeyboard() {
  const keyboard = emojiKeyboardRef.current
  keyboard.classList.toggle("displayed")
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

 function displayReceipt(textMsg) {
  const paraStyle = {
    fontWeight: "400", 
    fontSize: "0.75em",
    marginBlockStart: "0.5em",
    marginBlockEnd: "0.5em"
  }

  if (textMsg["sender"]["uid"] === user["uid"]) {
    if (textMsg.hasOwnProperty("deliveredAt") && !textMsg.hasOwnProperty("readAt")) {
      return (<p style={paraStyle}>Delivered</p>)
    } else if (textMsg.hasOwnProperty("readAt")) {
      return (<p style={paraStyle}>Read {displayDateOrTime(textMsg["readAt"])}</p>)
    }
  }
 }

 function backToConversationList() {
  navigate("/recentmsgs")
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

//  useEffect(() => {
//   if (textConversation.length !== 0) {
//     const lastMessage = textConversation[textConversation.length - 1]
//     getReceipts(lastMessage["id"])
//   }
//  }, [textConversation])

 if (!isAuthenticated) {
  return <Navigate to="/" replace />;
}

 return (
  <>
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
         <div key={message.id}>
           {user.uid === message.sender.uid ? (
             <li className="self">
               <div className="msg">
                 <div className="message">{message.text}</div>
               </div>
               {/* {textConversation.indexOf(message) === textConversation.length - 1 ? (<p ref={para}></p>) : ""} */}
               {textConversation.indexOf(message) === textConversation.length - 1 ? displayReceipt(message) : ""}
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
     <cometchat-emoji-keyboard style={emojiKeyboardStyle} ref={emojiKeyboardRef}></cometchat-emoji-keyboard>
     <div className="chatInputWrapper">
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
  </>
 );
};

export default Chatroom
