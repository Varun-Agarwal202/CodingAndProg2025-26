import React from 'react'
import { useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { redirect } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
          username: "",
          password: "",
      });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { setIsAuthenticated, setUser } = useContext(AuthContext)
  
  const handleChange = (e) => {
      setFormData({
          ...formData,
          [e.target.name]: e.target.value
      });
      console.log(formData);
  };
  const handleSubmit = async (e) => {
      e.preventDefault();
      setError("");
      setSuccess("");
      
      try {
          const res = await axios.post(
              'http://localhost:8000/auth/login/',
              formData,
              { headers: { 'Content-Type': 'application/json' } }
          );
          const userRes = await axios.get('http://localhost:8000/auth/user/', {
            headers: { Authorization: `Token ${res.data.key}` }
          });
          console.log(userRes.data);
          setIsAuthenticated(true);
          setUser(userRes.data); // userRes.data will have username, email, etc.
          localStorage.setItem("user", JSON.stringify(userRes.data));
          setSuccess("Logged in successfully!");
          navigate('/');
      } catch (err) {
          console.error("Login error:", err.response?.data);
      }
  };
  return (
    <div>
      <Navbar />  
    <div style = {{maxWidth: 400, margin: "auto", padding: 20}}>
      <h2>Login Page</h2>
      <form onSubmit={handleSubmit}>
        <input 
          type = "text"
          name = "username"
          placeholder = "Username"
          value = {formData.username}
          onChange = {handleChange}
          required
          style = {{width: "100%", padding: 8, margin: "8px 0"}}
        />
        <br />
        <input 
          type = "password"
          name = "password"
          placeholder = "Password"
          value = {formData.password}
          onChange = {handleChange}
          required
          style = {{width: "100%", padding: 8, margin: "8px 0"}}
        />
        <br />
        <button className = "text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800" type="submit" style={{padding: 10, width: "100%", color: "white", border: "none", borderRadius: 4}}>Login</button>
      </form>
      {error && <p style={{color: 'red'}}>{error}</p>}
      {success && <p style={{color: 'green'}}>{success}</p>}
      </div>
    </div>

  )
}

export default Login