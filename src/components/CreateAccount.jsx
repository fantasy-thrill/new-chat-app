import React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons"

function CreateAccount() {
  const navigate = useNavigate()
  const passwordExp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"

  return (
    <div id="account-creation">
      <div className="back-nav" onClick={() => navigate("/login")}>
        <FontAwesomeIcon icon={faArrowLeft} />
        <span style={{ marginLeft: "0.5em" }}>Back to login</span>
      </div>
      <div>
        <h2 style={{ textAlign: "center" }}>Sign up for Yapper</h2>
        <form id="creation-form">
          <label htmlFor="name">Full display name: </label>
          <input type="text" id="name" required />
          <label htmlFor="user-id">User ID: </label>
          <input type="text" id="user-id" required />
          <label htmlFor="set-profile-pic">Profile picture: </label>
          <input type="file" id="set-profile-pic" accept="image/*,.jpg,.jpeg,.png" />
          <label htmlFor="create-password">Password: </label>
          <input type="password" id="create-password" minLength={8} pattern={passwordExp} required />
        </form>
      </div>
    </div>
  )
}

export default CreateAccount
