import React from "react"
import { useState, useEffect } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import chat from "../lib/chatdata"
import { authTokens } from "../config"
import logo from "../logo.svg"

function Login() {
  const [username, setUsername] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const navigate = useNavigate()

  function onSubmit(e) {
    if (username !== "") {
      e.preventDefault()
      login()
    }
  }

  function login() {
    toggleIsSubmitting()
    let authToken = ""

    for (const userID in authTokens) {
      if (userID === username) {
        authToken = authTokens[userID]
        break
      }
    }

    chat
      .login(authToken)
      .then(user => {
        setUser(user)
        setIsAuthenticated(true)
      })
      .catch(error => {
        setErrorMessage("Please enter a valid username")
        toggleIsSubmitting()
        console.log(error)
        console.log(authToken)
      })
  }

  function toggleIsSubmitting() {
    setIsSubmitting(prevState => !prevState)
  }

  function handleInputChange(e) {
    setUsername(e.target.value)
  }

  if (isAuthenticated) {
    return (
      <Navigate
        to={{
          pathname: "/recentmsgs",
          state: { user: user },
        }}
        replace
      />
    )
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("http://localhost:5174/data")
        const data = await response.json()
        console.log(data)
      } catch (error) {
        console.error(`User information not fetched: \"${error}\"`)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="App">
      <h1>YAPPER</h1>
      <p>
        Create an account through your CometChat dashboard or login with one of
        our test users, superhero1, superhero2, etc.
      </p>
      <form className="form" onSubmit={onSubmit}>
        <input onChange={handleInputChange} type="text" />
        <span className="error">{errorMessage}</span>
        {isSubmitting ? (
          <img src={logo} alt="Spinner component" className="App-logo" />
        ) : (
          <button type="submit" disabled={username === ""} value="LOGIN">LOGIN</button>
        )}
      </form>
      <span id="create-account" onClick={() => navigate("/register")}>Create an account</span>
    </div>
  )
}

export default Login
