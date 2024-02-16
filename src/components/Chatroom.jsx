import React from "react"
import { useState, useEffect, useMemo } from "react"
import { Navigate, useNavigate, useLocation } from "react-router-dom"
import config from "../config.js"
import chat from "../lib/chatdata.js"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faArrowLeft,
  faRightToBracket,
} from "@fortawesome/free-solid-svg-icons"
import "@cometchat/uikit-elements"
import MessageList from "./MessageList.jsx"
import { displayDeleteMenu } from "../smalleffects.js"

function useQuery() {
  const { search } = useLocation()
  return React.useMemo(() => new URLSearchParams(search), [search])
}

function Chatroom() {
  const query = useQuery()

 //  const [receiverID, setReceiverID] = 
  const [memberList, setMemberList] = useState([])
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(true)
  // const [deleteMenuDisplay, setDeleteMenuDisplay] = useState("none")
  const [deletedMessages, setDeletedMessages] = useState(undefined)

  let receiverID = useState(query.get("receipient") ?? "")[0]
  const navigate = useNavigate()
  const GUID = config.GUID

  // const displayStyle = {
  //   display: deleteMenuDisplay,
  // }

  // Unused function
  function sendMessageToGroup() {
    chat.sendGroupMessage(GUID, messageText).then(
      message => {
        console.log("Message sent successfully:", message)
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
    chatList.scrollTop = chatList.scrollHeight
  }

  function getUser() {
    chat
      .getLoggedinUser()
      .then(user => {
        console.log("user details:", { user })
        setUser(user)
      })
      .catch(({ error }) => {
        if (error.code === "USER_NOT_LOGGED_IN") {
          setIsAuthenticated(false)
        }
      })
  }

  function getGroupList() {
    chat
      .getGroupMembers(GUID)
      .fetchNext()
      .then(
        groupMembers => {
          const groupMemberNames = groupMembers
            .map((member, index) => ({
              name: member["uid"],
              key: "00" + (index + 1),
            }))
            .filter(member => member["name"] !== user["uid"])
          setMemberList(groupMemberNames)
          console.log(groupMemberNames)
          console.log(user["uid"])
        },
        error => {
          console.log("Error fetching group members:", error)
        }
      )
  }

  function backToConversationList() {
    navigate("/recentmsgs")
    chat.removeListener(
      chat.LISTENER_KEY_MESSAGE,
      chat.LISTENER_KEY_ACTIVITY,
      chat.LISTENER_KEY_TYPING
    )
  }

  function logout() {
    chat.logout()
    chat.removeListener(
      chat.LISTENER_KEY_MESSAGE,
      chat.LISTENER_KEY_ACTIVITY,
      chat.LISTENER_KEY_TYPING
    )
    navigate("/login")
  }

  useEffect(() => {
    getUser()
    // chat.joinGroup(GUID)
  }, [])

  useEffect(() => {
    if (user) {
      async function fetchData() {
        try {
          const response = await fetch("http://localhost:5174/data")
          const data = await response.json()
          if (data) {
            const userInfo = data[0]
            for (const userID in userInfo) {
              if (userID === user.uid)
                setDeletedMessages(userInfo[userID].deletedMsgs)
            }
          }
        } catch (error) {
          console.error("Data not fetched: " + error)
        }
      }
      fetchData()
      getGroupList()
    }
  }, [user])

  useEffect(() => {
    if (deletedMessages) console.log(deletedMessages)
  }, [deletedMessages])

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <div id="page">
      <div id="overlay"></div>
      <div className="navigation-chat">
        <button className="nav-btn" onClick={backToConversationList}>
          <FontAwesomeIcon
            icon={faArrowLeft}
            size="lg"
            className="icon-spacing"
          />
          Back
        </button>
        <button className="nav-btn" onClick={logout}>
          <FontAwesomeIcon
            icon={faRightToBracket}
            size="lg"
            className="icon-spacing"
          />
          Logout
        </button>
      </div>
      <MessageList
        user={user}
        receiver={receiverID}
        members={memberList}
        deletedList={deletedMessages}
      />
    </div>
  )
}

export default Chatroom
