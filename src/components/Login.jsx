import React from "react"
import { useState, useEffect } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import chat from "../lib/chatdata"
// import { authTokens } from "../config"
import logo from "../logo.svg"

function Login() {
  const [username, setUsername] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  // const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  async function fetchData() {
    try {
      const response = await fetch("http://localhost:5174/data");
      const data = await response.json();
      if (data) {
        const { _id, ...newData } = data[0];
        setUserInfo(newData);
        console.log("Information retrieved successfully");
      }
    } catch (error) {
      console.error(`User information not fetched: "${error}"`);
    }
  }

  function onSubmit(e) {
    e.preventDefault();

    if (username !== "") {
      login();
    // } else {
    //   setErrorMessage("Please enter a valid username");
    }
  }

  async function login() {
    toggleIsSubmitting();
    let token = "";

    if (userInfo) {
      for (const userID in userInfo) {
        if (userID === username) {
          token = userInfo[userID].authToken;
          break;
        }
      }

      try {
        const user = await chat.login(token);
        setUser(user);
        setIsAuthenticated(true);
      } catch (error) {
        // setErrorMessage(".");
        const errorMessage = document.querySelector(".error")
        errorMessage.style.display = "inline"
        console.error(error);
      } finally {
        toggleIsSubmitting();
      }
    }
  }

  function toggleIsSubmitting() {
    setIsSubmitting(prevState => !prevState);
  }

  function handleInputChange(e) {
    setUsername(e.target.value);
    // setErrorMessage("");
  }

  useEffect(() => {
    fetchData();
  }, []);

  if (isAuthenticated) {
    return (
      <Navigate
        to={{
          pathname: "/recentmsgs",
          state: { user: user },
        }}
        replace
      />
    );
  }

  return (
    <div className="App">
      <h1>YAPPER</h1>
      <p>
        Create an account through your CometChat dashboard or login with one of
        our test users, superhero1, superhero2, etc.
      </p>
      <form className="form" onSubmit={onSubmit}>
        <input onChange={handleInputChange} type="text" />
        <span className="error">Login failed. Please try again</span>
        {isSubmitting ? (
          <img src={logo} alt="Spinner component" className="App-logo" />
        ) : (
          <button type="submit" disabled={username === ""} value="LOGIN">
            LOGIN
          </button>
        )}
      </form>
      <span id="create-account" onClick={() => navigate("/register")}>
        Create an account
      </span>
    </div>
  );
}

export default Login
