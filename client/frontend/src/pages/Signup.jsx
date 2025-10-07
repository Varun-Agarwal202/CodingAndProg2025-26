import React from 'react'
import { useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';

export default function Signup ()  {

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password1: "",
        password2: ""
    });

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

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
                'http://localhost:8000/auth/registration/',
                formData,
                { headers: { 'Content-Type': 'application/json' } }
            );
            setSuccess("Account created successfully!");
            console.log(res.data);
        } catch (err) {
            console.error("Signup error:", err.response?.data);
        }
    };
    return (
        <div>
      <Navbar />  
    <div style = {{maxWidth: 400, margin: "auto", padding: 20}}>
        
        <h2>Sign Up</h2>
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
            type = "email"
            name = "email"
            placeholder = "Email"
            value = {formData.email}
            onChange = {handleChange}
            required
            style = {{width: "100%", padding: 8, margin: "8px 0"}}
            />
            <br />
            <input k
            type = "password"
            name = "password1"
            placeholder = "Password"
            value = {formData.password}
            onChange = {handleChange}
            required
            style = {{width: "100%", padding: 8, margin: "8px 0"}}
            />
            <br />
            <input 
            type = "password"
            name = "password2"
            placeholder = "Confirm Password"
            value = {formData.password2}
            onChange = {handleChange}
            required
            style = {{width: "100%", padding: 8, margin: "8px 0"}}
            />
            <br />  
            <button className = "text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800" 
            type="submit" style = {{padding: 10, width: "100%"}}>Sign Up</button>
        </form>
            <div className = "flex"><p>Already have an account? </p>  <a href = "/login" className = "font-bold text-blue-800 ml-2 "> Login</a></div>
        <br />
        {error && <p style={{color: 'red'}}>{error}</p>}
        {success && <p style={{color: 'green'}}>{success}</p>}
    </div>
    </div>
  )
}
