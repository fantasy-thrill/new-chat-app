import React from "react";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons"


function ForgotPassword() {
  const [submitted, setSubmitted] = useState(false)
  const [emailInput, setEmailInput] = useState("")

  async function sendEmail(address) {
    try {
      const response = await fetch("https://localhost:5174/data")
      const data = await response.json()
      if (data) {
        const matchedUser = data.find(user => user.email === address)
        if (matchedUser) {
          const response = await fetch("https://localhost:5174/password-recovery", {
            method: "POST",
            body: {
              email: address
            }
          })

          const result = response.json()
          // Rest of e-mail handling code goes here
        }
      }
    } catch (error) {
      console.error("Could not send e-mail: \n", error)
    }
  }
  
  function handleSubmit(event) {
    event.preventDefault()
    sendEmail(emailInput)
  }

  return (
    <div>
      <div className="back-nav" onClick={() => navigate("/login")}>
        <FontAwesomeIcon icon={faArrowLeft} />
        <span style={{ marginLeft: "0.5em" }}>Back to login</span>
      </div>
      <div>
        <h2>Forgot your password?</h2>
        <p>Enter the e-mail address associated with your account below.</p>
        <input type="email" name="email" id="email-input" onChange={(e) => setEmailInput(e.target.value)} />
        <button type="submit" onClick={(e) => handleSubmit(e)}>Submit</button>
      </div>
    </div>
  )
}

export default ForgotPassword