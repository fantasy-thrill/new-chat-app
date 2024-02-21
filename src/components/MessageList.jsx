import React from "react"
import { useState, useEffect, useRef } from "react"
import chat from "../lib/chatdata.js"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faFaceSmile } from "@fortawesome/free-solid-svg-icons"
import {
  displayDateOrTime,
  darkenBackground,
  lightenBackground,
  displayDeleteMenu
} from "../smalleffects.js"
import "@cometchat/uikit-elements"

function MessageList({ user, receiver, members, deletedList }) {
  const [textConversation, setTextConversation] = useState([])
  const [messageText, setMessageText] = useState("")
  const [contextMenuDisplay, setContextMenuDisplay] = useState("none")
  const [menuCoordinates, setMenuCoordinates] = useState({ x: 0, y: 0 })
  const [selected, setSelected] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [recTyping, setRecTyping] = useState(false)

  const emojiKeyboardRef = useRef(null)
  const para = useRef(null)
  // const GUID = config.GUID

  const emojiKeyboardStyle = {
    height: "250px",
    display: "none",
  }

  const contextMenuStyle = {
    display: contextMenuDisplay,
    backgroundColor: "white",
    width: "150px",
    border: "1px solid gray",
    position: "absolute",
    zIndex: 100,
    top: `${menuCoordinates.y}px`,
    left: `${menuCoordinates.x}px`,
  }

  function getConversation() {
    chat.messagesRequest(receiver, 100).then(
      messages => {
        const cleanList = messages.filter(
          message =>
            !message.hasOwnProperty("action") &&
            !message.hasOwnProperty("deletedAt") &&
            !deletedList.includes(message["id"])
        )
        setTextConversation(cleanList)
        console.log(cleanList)
      },
      error => console.log("Could not load messages: " + error)
    )
  }

  function sendTextMessage(receipient) {
    chat.sendIndividualMessage(receipient, messageText).then(
      message => {
        console.log("Message sent successfully:", message)
        setTextConversation(prevState => [...prevState, message])
        setMessageText("")
      },
      error => {
        if (error.code === "ERR_NOT_A_MEMBER") {
          chat.joinGroup(GUID).then(response => {
            sendMessage()
          })
        } else {
          console.log("Message not sent. Button doesn't work. " + error.code)
        }
      }
    )
  }

  function scrollToBottom() {
    const chatList = document.getElementById("chatList")
    const lastMessage = chatList.lastElementChild
    if (lastMessage) lastMessage.scrollIntoView({
      behavior: "smooth",
      block: "end",
    })
  }

  function handleSubmit(event) {
    event.preventDefault()
    sendTextMessage(receiver)
    event.target.reset()
  }

  function handleChange(event) {
    setMessageText(event.target.value)
    const emojiKeyboard = emojiKeyboardRef.current
    emojiKeyboard.addEventListener("cc-emoji-clicked", e => {
      setMessageText(event.target.value + e.detail.id)
    })
  }

  function handleTypingStatus(event) {
    if (event.key !== "Backspace" && !isTyping) {
      chat.typingStarted(receiver, "user")
      setIsTyping(true)
    } else if (event.key === "Backspace" && isTyping) {
      chat.typingStopped(receiver, "user")
      setIsTyping(false)
    }
  }

  function handleActivityReceived(msgReceipt, error) {
    if (error) return console.log(`error: ${error}`)
    para.current.style.fontSize = "0.75em"
    para.current.textContent = "Delivered"
    console.log(msgReceipt)
  }

  function handleActivityRead(msgReceipt, error) {
    if (error) return console.log(`error: ${error}`)
    para.current.style.fontSize = "0.75em"
    para.current.textContent = `Read ${displayDateOrTime(msgReceipt["readAt"])}`
    console.log(msgReceipt)
  }

  function handleChatActivity(message, error) {
    if (error) return console.log(`error: ${error}`)
    setTextConversation(prevState => [...prevState, message])
    setRecTyping(false)
    if (message["sender"]["uid"] !== user["uid"]) {
      chat.markAsDelivered(message)
      chat.markAsRead(message)
    }
    console.log("Message received: " + message)
    // scrollToBottom()
  }

  function messageListener() {
    chat.addMessageListener(handleChatActivity)
  }

  function activityListener() {
    chat.addActivityListener(handleActivityReceived, handleActivityRead)
  }

  function typingListener() {
    chat.addTypingListener(setRecTyping)
  }

  function displayReceipt() {
    const lastMessage = textConversation[textConversation.length - 1]
    if (
      lastMessage["sender"]["uid"] === user["uid"] &&
      lastMessage.hasOwnProperty("readAt")
    ) {
      para.current.textContent =
        "Read " + displayDateOrTime(lastMessage["readAt"])
      para.current.style.fontSize = "0.75em"
    }
  }

  function displayEmojiKeyboard() {
    const keyboard = emojiKeyboardRef.current
    keyboard.classList.toggle("displayed")
  }

  function displayContextMenu(event, messageID) {
    const parentElement = event.target.closest(".msg")
    setSelected(messageID)

    if (parentElement) {
      event.preventDefault()
      const { clientX, clientY } = event
      darkenBackground(parentElement)
      parentElement.classList.add("selected")
      const spaceOnRight = window.innerWidth - clientX
      const spaceOnLeft = clientX - 150

      setMenuCoordinates({
        x: spaceOnRight < 150 ? spaceOnLeft : clientX,
        y: clientY,
      })
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
  }

  async function updateData() {
    try {
      const response = await fetch(
        `http://localhost:5174/update/${user.uid}/${user.authToken}/${selected}`,
        { method: "PUT" }
      )
      const resDetails = await response.json()
      console.log(resDetails)
      if (resDetails["acknowledged"]) console.log("Deleted messages updated successfully")
    } catch (error) {
      console.error(`No update was made: \"${error}\"`)
    }
  }

  function deleteMessage(forEveryone) {
    const messageToDelete = textConversation.find(message => message["id"] === selected)
    const updatedConvo = textConversation.toSpliced(textConversation.indexOf(messageToDelete), 1)
    forEveryone ? chat.deleteMessage(selected) : updateData()
    setTextConversation(updatedConvo)
  }

  useEffect(() => {
    if (user && receiver) {
      if (deletedList) getConversation()
    }
  }, [user, receiver, deletedList])

  useEffect(() => {
    if (user) {
    //  scrollToBottom()
      messageListener()
      activityListener()
      typingListener()
    }
  }, [user])

  // useEffect(() => console.log(selected), [selected])
  
  useEffect(() => {
    const chatList = document.getElementById("chatList")
    if (chatList) scrollToBottom()
  })

  useEffect(() => {
    if (textConversation.length > 0) {
      displayReceipt()
      console.log(textConversation)
    }
  }, [textConversation])

  return (
    <div className="chatWindow" onClick={removeContextMenu}>
      <div id="receiverSelection">
        <label htmlFor="members">Send to: </label>
        <select
          name="members"
          id="members"
          onChange={(event) => {
            receiver = event.target.value
            console.log(receiver)
            getConversation()
          }}>
          <option value="">Select receipient</option>
          {members.map(member => (
            <option value={member["name"]} key={member["key"]}>
              {member["name"]}
            </option>
          ))}
        </select>
      </div>
      <ul className="chat" id="chatList">
        {textConversation.map(message => (
          <div key={message.id} id={message.id}>
            {user.uid === message.sender.uid ? (
              <li className="self">
                <div
                  className="msg"
                  onContextMenu={event =>
                    displayContextMenu(event, message.id)
                  }>
                  <div className="message">{message.text}</div>
                </div>
                {textConversation.indexOf(message) ===
                textConversation.length - 1 ? (
                  <p ref={para}></p>
                ) : (
                  ""
                )}
              </li>
            ) : (
              <li className="other">
                <div
                  className="msg"
                  onContextMenu={event =>
                    displayContextMenu(event, message.id)
                  }>
                  <div className="message">{message.text}</div>
                </div>
              </li>
            )}
          </div>
        ))}
      </ul>
      {recTyping && <p>{receiver} is typing...</p>}
      <div className="chatInputWrapper">
        <cometchat-emoji-keyboard
          style={emojiKeyboardStyle}
          ref={emojiKeyboardRef}></cometchat-emoji-keyboard>
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
            onKeyDown={handleTypingStatus}
          />
          <button type="submit" id="sendButton">
            Send
          </button>
        </form>
      </div>
      {contextMenuDisplay === "block" && (
        <div id="context-menu" style={contextMenuStyle}>
          <div
            className="menu-choice"
            onClick={() => {
              const messageToDelete = textConversation.find(message => message["id"] === selected)
              if (messageToDelete["sender"]["uid"] !== user["uid"]) {
                deleteMessage(false)
              } else {
                displayDeleteMenu("block")
              }
            }}>
            Delete message
          </div>
          <div className="menu-choice">Delete multiple</div>
        </div>
      )}
      <div id="delete-menu">
        Do you want to delete messages only for you or for everyone in the
        conversation?
        <div 
          className="d-menu-choice" 
          onClick={() => {
            deleteMessage(false)
            displayDeleteMenu("none")
          }}>
          Delete for me
        </div>
        <div 
          className="d-menu-choice" 
          onClick={() => {
            deleteMessage(true)
            displayDeleteMenu("none")
          }}>
          Delete for everyone
        </div>
        <div
          className="d-menu-choice"
          onClick={() => displayDeleteMenu("none")}
        >
          Cancel
        </div>
      </div>
    </div>
  )
}

export default MessageList
