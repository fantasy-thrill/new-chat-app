import React from "react";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import chat from "../lib/chatdata"
import logo from "../logo.svg"

function Login() {
 const [username, setUsername] = useState('');
 const [isAuthenticated, setIsAuthenticated] = useState(false);
 const [user, setUser] = useState(null);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [errorMessage, setErrorMessage] = useState('');

 function onSubmit(e) {
   if (username !== '') {
     e.preventDefault();
     login();
   }
 };

 function login() {
   toggleIsSubmitting();
   chat
     .login(username)
     .then((user) => {
       setUser(user);
       setIsAuthenticated(true);
     })
     .catch((error) => {
       setErrorMessage('Please enter a valid username');
       toggleIsSubmitting();
       console.log(error);
     });
 };

 function toggleIsSubmitting() {
   setIsSubmitting((prevState) => !prevState);
 };

 function handleInputChange(e) {
   setUsername(e.target.value);
 };

 if (isAuthenticated) {
  return (
    <Navigate
      to={{
        pathname: '/recentmsgs',
        state: { user: user }
      }}
      replace
    />
  );
}

 return (
   <div className="App">
     <h1>YAPPER</h1>
     <p>
       Create an account through your CometChat dashboard or login with one of our test users, superhero1, superhero2, etc.
     </p>
     <form className="form" onSubmit={onSubmit}>
       <input onChange={handleInputChange} type="text" />
       <span className="error">{errorMessage}</span>
       {isSubmitting ? (
         <img src={logo} alt="Spinner component" className="App-logo" />
       ) : (
         <input
           type="submit"
           disabled={username === ''}
           value="LOGIN"
         />
       )}
     </form>
   </div>
 )
}

export default Login