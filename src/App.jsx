import React from "react"
import { Route, Routes, Navigate } from "react-router-dom"
import Login from "./components/Login"
import Chatroom from "./components/Chatroom"
import RecentChats from "./components/RecentChats"
import CreateAccount from "./components/CreateAccount"
import ForgotPassword from "./components/ForgotPassword"
import ResetPassword from "./components/ResetPassword"
import "./styles/App.css"

function App() {
  const user = JSON.parse(localStorage.getItem("user"))

  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? "/recentmsgs" : "/login"} />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<CreateAccount />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:userID/:recoveryCode" element={<ResetPassword />} />
      <Route path="/chat" element={<Chatroom />} />
      <Route path="/recentmsgs" element={<RecentChats />} />
    </Routes>
  )
}

export default App
