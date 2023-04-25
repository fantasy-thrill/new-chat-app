import React from 'react'
import { Route, Routes, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Chatroom from './components/Chatroom'
import './App.css'

function App() {
  return (
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/chat" element={<Chatroom />} />
      </Routes>
  )
}

export default App
