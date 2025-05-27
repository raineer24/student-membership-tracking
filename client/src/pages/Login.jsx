import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPasswprd] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefaul();
    try {
      const res = await api.post("/api/auth/login", { email, password });
      localStorage.setItem('token', res.data.accessToken);
      navigate('/');
    } catch (error) {
      alert("Login failed");
    }
  };

  fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'your-email@example.com',
    password: 'your-password'
  })
})
.then(res => res.json())
.then(console.log);

  return (
    <form onSubmit={handleSubmit}>
        <h2>Login</h2>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required/>
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPasswprd(e.target.value)} required/>
        <button type="submit">Login</button>
    </form>
  )
};

export default Login;
