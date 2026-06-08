import React, { createContext, useContext, useState, useEffect } from "react";
import { getMe, registerUser } from "../services/authService";

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
          const data = await getMe(token);
          if (data && data.success) {
            setCurrentUser(data.user);
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
      const data = await registerUser(userData);
      
      if (data && data.success) {
        localStorage.setItem("jwt_token", data.token);
        setCurrentUser(data.user);
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
    setCurrentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
