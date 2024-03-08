import React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import chat from "../lib/chatdata"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons"

function CreateAccount() {
  const [submitted, setSubmitted] = useState(false)

  const navigate = useNavigate()
  const passwordExp = "(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}"

  async function submitAccountCreation() {
    try {
      const response = await fetch("https://localhost:5174/create-account", { method: "POST" })
      const result = await response.json()
      if (result) {
        const { name, uid, authKey } = result
        chat.createNewUser(name, uid, authKey)
        setSubmitted(true)
      }
    } catch (error) {
      console.error(`Server error: "${error}"`)
    }
  }

  return (
    <div id="account-creation">
      <div className="back-nav" onClick={() => navigate("/login")}>
        <FontAwesomeIcon icon={faArrowLeft} />
        <span style={{ marginLeft: "0.5em" }}>Back to login</span>
      </div>
      {submitted ? (
        <h1 style={{ textAlign: "center" }}>
          You have successfully created your account! Click the link above to log in.
        </h1>
      ) : (
        <div>
          <h2 style={{ textAlign: "center" }}>Sign up for Yapper</h2>
          <form onSubmit={submitAccountCreation}>

            <div id="creation-form">
              <label htmlFor="name">Full display name: </label>
              <input type="text" name="name" id="name" required />

              <label htmlFor="user-id">User ID: </label>
              <input type="text" name="user_id" id="user-id" required />

              <label htmlFor="set-profile-pic">Profile picture: </label>
              <input type="file" id="set-profile-pic" accept="image/*,.jpg,.jpeg,.png" />

              <label htmlFor="create-password">Password: </label>
              <input type="password" name="password" id="create-password" minLength={8} pattern={passwordExp} required />
            </div>

            <button type="submit">Create account</button>
          </form>
        </div>
      )}
    </div>
  )
}

export default CreateAccount
