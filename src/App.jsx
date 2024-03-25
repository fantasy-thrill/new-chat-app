import React from "react"
import { Route, Routes, Navigate } from "react-router-dom"
import Login from "./components/Login"
import Chatroom from "./components/Chatroom"
import RecentChats from "./components/RecentChats"
import CreateAccount from "./components/CreateAccount"
import ForgotPassword from "./components/ForgotPassword"
import "./App.css"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<CreateAccount />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/chat" element={<Chatroom />} />
      <Route path="/recentmsgs" element={<RecentChats />} />
    </Routes>
  )
}

export default App
