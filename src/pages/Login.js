import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

const Login = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const navigate = useNavigate();

  // Redirect to home if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/home", { replace: true }); // Prevents back navigation to login
    }
  }, [navigate]);

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = isSignup
        ? "http://localhost:5000/auth/register"
        : "http://localhost:5000/auth/login";

      const { data } = await axios.post(url, formData);

      if (!isSignup) {
        // Store token and user info in localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify({ username: data.user.username })); // Store username
        
        navigate("/home", { replace: true }); // Redirect to Home Page after login
      } else {
        alert("Account created successfully! Please login.");
        setIsSignup(false);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Something went wrong!");
    }
  };

  return (
    <div className={`container ${isSignup ? "active-signup" : "active-login"}`}>
      <div className="welcome-section">
        <h2>Welcome! ❤️</h2>
        <p>Explore your digital time capsule and relive your memories.</p>
      </div>

      <div className="form-section">
        <h2>{isSignup ? "Sign Up" : "Login"}</h2>

        <form onSubmit={handleSubmit}>
          {isSignup && (
            <input type="text" name="username" placeholder="Username" onChange={handleChange} required />
          )}
          <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
          <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
          <button type="submit">{isSignup ? "Sign Up" : "Login"}</button>
        </form>

        <p>
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <span onClick={() => setIsSignup(!isSignup)}>
            {isSignup ? "Login" : "Sign Up"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
