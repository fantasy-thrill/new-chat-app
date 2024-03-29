import React from "react";
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCheck, faXmark } from "@fortawesome/free-solid-svg-icons"

function ResetPassword() {
  const [newPassword, setNewPassword] = useState("")
  const [secondEntry, setSecondEntry] = useState("")
  const [passwordReset, setPasswordReset] = useState(false)

  const { userID, recoveryCode } = useParams()

  const passwordExp = {
    expression: "(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}",
    validation: function(str) {
      return new RegExp(this.expression).test(str)
    }
  }

  async function resetUserPassword() {
    try {
      const response = await fetch(`https://localhost:5174/update-password/${userID}`)
      if (response.status === 200) {
        setPasswordReset(true)
        console.log("Password update successful")
      }
      
    } catch (error) {
      console.error("Password update not successful", error)
    }
  }

  return (
    <div>
      <h2>Reset Your Password</h2>
      <div className="account-cases">
        <p>
          Username: <strong>{userID}</strong>
        </p>
        <div>
          <form onSubmit={resetUserPassword}>
            <div id="reset-form">
              <label htmlFor="new-password">New password: </label>
              <input
                type="password"
                name="new_password"
                id="new-password"
                onChange={e => setNewPassword(e.target.value)}
                minLength={8}
                pattern={passwordExp}
                required
              />

              <label htmlFor="reenter-password">Re-enter new password: </label>
              <input
                type="password"
                id="reenter-password"
                onChange={e => setSecondEntry(e.target.value)}
                minLength={8}
                pattern={newPassword}
                required
              />
            </div>
            <div style={{ margin: "1.25em 0" }}>
              <p
                className="validation"
                style={{
                  color: passwordExp.validation(newPassword)
                    ? "#16912a"
                    : "#e31414",
                }}>
                <FontAwesomeIcon
                  icon={passwordExp.validation(newPassword) ? faCheck : faXmark}
                  style={{ marginRight: "1em" }}
                />
                Password must be at least 8 characters long and contain at least
                one number and one special character.
              </p>
              {secondEntry === newPassword ? (
                <p className="validation" style={{ color: "#16912a" }}>
                  <FontAwesomeIcon
                    icon={faCheck}
                    style={{ marginRight: "1em" }}
                  />
                  Passwords match
                </p>
              ) : (
                <p className="validation" style={{ color: "#e31414" }}>
                  <FontAwesomeIcon
                    icon={faXmark}
                    style={{ marginRight: "1em" }}
                  />
                  Passwords do not match
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!newPassword || secondEntry !== newPassword}>
              Submit
            </button>
          </form>
          {passwordReset ? (
            <p>
              You have successfully reset your password.
              <Link to="/login">Click here</Link> to log in to your account
            </p>
          ) : (
            ""
          )}
        </div>
      </div>
    </div>
  )
}

export default ResetPassword