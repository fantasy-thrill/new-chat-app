import React from "react"
import { useState, useEffect } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import chat from "../lib/chatdata"
import logo from "../logo.svg"

function Login() {
  const [username, setUsername] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userInfo, setUserInfo] = useState(null)
  const [developerLogin, setDeveloperLogin] = useState(false)
  const [authKey, setAuthKey] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  const navigate = useNavigate()

  async function fetchData() {
    try {
      const response = await fetch("https://localhost:5174/data/test")
      const data = await response.json()
      if (data) {
        setUserInfo(data)
        console.log("Information retrieved successfully")
      }
    } catch (error) {
      console.error(`User information not fetched: "${error}"`)
    }
  }

  function onSubmit(e) {
    e.preventDefault()
    const testUserRegex = /superhero[1-5]/

    if (developerLogin) {
      if (
        testUserRegex.test(username) &&
        authKey === import.meta.env.VITE_AUTH_KEY
      ) {
        login()
      } else {
        setErrorMessage("Invalid test user credentials")
      }
    }
  }

  async function login() {
    toggleIsSubmitting()
    let token = ""

    if (developerLogin && userInfo) {
      const matchedUser = userInfo.find(user => user.uid === username)
      if (matchedUser) {
        token = matchedUser.authToken
      }
    }

    try {
      const user = await chat.login(token)
      setUser(user)
      setIsAuthenticated(true)
    } catch (error) {
      setErrorMessage("Login failed. Please try again")
      console.error(error)
      console.log(token)
    } finally {
      toggleIsSubmitting()
    }
    //}
  }

  function toggleIsSubmitting() {
    setIsSubmitting(prevState => !prevState)
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

  return (
    <div className="App" style={{ height: "75vh" }}>
      <h1 style={{ margin: "0.25em 0" }}>YAPPER</h1>
      <p>
        Create an account through your CometChat dashboard or login with one of
        our test users, superhero1, superhero2, etc.
      </p>
      {developerLogin ? (
        <>
          <form className="login-form" onSubmit={onSubmit}>
            <label htmlFor="uid-login">Test user ID</label>
            <input
              onChange={e => setUsername(e.target.value)}
              type="text"
              id="uid-login"
            />

            <label htmlFor="authkey-input">Authentication Key</label>
            <input
              onChange={e => setAuthKey(e.target.value)}
              type="text"
              id="authkey-input"
            />

            <span className="error">{errorMessage}</span>
            {isSubmitting ? (
              <img src={logo} alt="Spinner component" className="App-logo" />
            ) : (
              <button type="submit" disabled={username === ""} value="LOGIN">
                LOGIN
              </button>
            )}
          </form>
          <span className="other-cases" onClick={() => navigate("/register")}>
            Create an account
          </span>
          <span
            className="other-cases"
            onClick={() => setDeveloperLogin(false)}>
            Login as regular user
          </span>
        </>
      ) : (
        <>
          <form className="login-form" onSubmit={onSubmit}>
            <label htmlFor="uid-login">User ID</label>
            <input
              onChange={e => setUsername(e.target.value)}
              type="text"
              name="user_id"
              id="uid-login"
            />

            <label htmlFor="pwd-login">Password</label>
            <input type="password" name="password" id="pwd-login" />

            <span className="error">{errorMessage}</span>
            {isSubmitting ? (
              <img src={logo} alt="Spinner component" className="App-logo" />
            ) : (
              <button type="submit" disabled={username === ""} value="LOGIN">
                LOGIN
              </button>
            )}
          </form>
          <span className="other-cases" onClick={() => navigate("/register")}>
            Create an account
          </span>
          <span
            className="other-cases"
            onClick={() => {
              setDeveloperLogin(true)
              fetchData()
            }}>
            Login with a test user (developers only)
          </span>
        </>
      )}
    </div>
  )
}

export default Login
