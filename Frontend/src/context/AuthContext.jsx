import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Development Mock: Store the mock confirmation state
  const [mockVerificationState, setMockVerificationState] = useState(false);

  useEffect(() => {
    // Check for existing token
    const checkToken = async () => {
      const token = localStorage.getItem("jwt_token");
      if (token) {
        try {
          // Verify token and fetch user
          const res = await axios.get("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data.success) {
            setCurrentUser(res.data.user);
          }
        } catch (error) {
          console.error("Token verification failed", error);
          localStorage.removeItem("jwt_token");
        }
      }
      setLoading(false);
    };
    checkToken();
  }, []);

  const sendOtp = async (mobile, buttonId) => {
    try {
      console.log("🛠️ Mock OTP Mode Enabled");
      console.log(`🛠️ Simulated sending OTP to: ${mobile}`);
      console.log(`🛠️ Please enter OTP: 123456 to verify.`);
      
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      setMockVerificationState(true);
      return { success: true };
    } catch (error) {
      console.error("Error sending Mock OTP", error);
      return { success: false, message: error.message };
    }
  };

  const verifyOtpAndRegister = async (otp, userData) => {
    try {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      // 1. Verify Mock OTP
      if (otp !== "123456") {
        throw new Error("Invalid OTP");
      }
      
      // 2. Register/Login on Backend
      const res = await axios.post("/api/auth/register", userData);
      
      if (res.data.success) {
        localStorage.setItem("jwt_token", res.data.token);
        setCurrentUser(res.data.user);
        return { success: true };
      }
    } catch (error) {
      console.error("Error verifying Mock OTP", error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || "Invalid OTP or registration failed" 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("jwt_token");
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    loading,
    sendOtp,
    verifyOtpAndRegister,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
