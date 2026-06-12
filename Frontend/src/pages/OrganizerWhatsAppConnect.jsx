import React, { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import organizerService from "../services/organizerService";

const OrganizerWhatsAppConnect = () => {
  const [status, setStatus] = useState("checking"); // 'checking', 'disconnected', 'generating', 'qr_ready', 'connected'
  const [qrCode, setQrCode] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // 1. Check initial status from backend
    const checkStatus = async () => {
      try {
        const data = await organizerService.getWhatsAppStatus();
        if (data.connected) {
          setStatus("connected");
          setWhatsappNumber(data.whatsappNumber || "");
        } else {
          setStatus("disconnected");
        }
      } catch (err) {
        toast.error("Failed to fetch WhatsApp status");
        setStatus("disconnected");
      }
    };
    checkStatus();

    // 2. Setup Socket.IO connection
    const user = JSON.parse(localStorage.getItem("user"));
    const organizerId = user?._id || user?.id;
    
    if (organizerId) {
      // Connect to Socket.IO backend
      const newSocket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5001", {
        withCredentials: true,
      });

      newSocket.on("connect", () => {
        // Join personal organizer room
        newSocket.emit("join", `organizer_${organizerId}`);
      });

      newSocket.on("whatsapp_qr", (qr) => {
        setQrCode(qr);
        setStatus("qr_ready");
      });

      newSocket.on("whatsapp_connected", (data) => {
        setStatus("connected");
        setWhatsappNumber(data.whatsappNumber || "");
        toast.success("WhatsApp Connected Successfully!");
      });

      newSocket.on("whatsapp_disconnected", () => {
        setStatus("disconnected");
        setQrCode("");
        setWhatsappNumber("");
        toast.error("WhatsApp Disconnected");
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, []);

  const handleStartConnection = async () => {
    try {
      setStatus("generating");
      await organizerService.startWhatsApp();
      toast.success("Connecting... Please wait for QR code");
    } catch (err) {
      toast.error("Failed to start WhatsApp connection");
      setStatus("disconnected");
    }
  };

  const handleDisconnect = async () => {
    try {
      setStatus("checking");
      await organizerService.disconnectWhatsApp();
      setStatus("disconnected");
      setQrCode("");
      toast.success("WhatsApp disconnected");
    } catch (err) {
      toast.error("Failed to disconnect WhatsApp");
      setStatus("connected"); // Revert if failed
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">WhatsApp Connection</h2>
        <p className="text-zinc-500">
          Connect your WhatsApp account to automatically send messages to donors.
        </p>
      </div>

      {status === "checking" && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-zinc-600 font-medium">Checking connection status...</p>
        </div>
      )}

      {status === "disconnected" && (
        <div className="flex flex-col items-center py-8">
          <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-6">
            <span className="text-4xl">📱</span>
          </div>
          <h3 className="text-lg font-bold text-zinc-800 mb-4">Not Connected</h3>
          <p className="text-zinc-500 text-center mb-8 max-w-md">
            Your WhatsApp is currently disconnected. Click below to generate a QR code and link your account.
          </p>
          <button
            onClick={handleStartConnection}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full transition-colors shadow-sm"
          >
            Generate QR Code
          </button>
        </div>
      )}

      {status === "generating" && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-zinc-600 font-medium">Starting WhatsApp client and generating QR code...</p>
          <p className="text-sm text-zinc-400 mt-2">This may take a few seconds.</p>
        </div>
      )}

      {status === "qr_ready" && (
        <div className="flex flex-col items-center py-8">
          <h3 className="text-xl font-bold text-zinc-800 mb-2">Scan QR Code</h3>
          <p className="text-zinc-500 mb-8 text-center max-w-md">
            Open WhatsApp on your phone. Tap Menu or Settings and select Linked Devices. Tap on Link a Device and point your phone to this screen.
          </p>
          
          <div className="bg-white p-4 rounded-xl border-2 border-zinc-200 shadow-sm mb-8">
            {qrCode ? (
              <QRCodeCanvas value={qrCode} size={256} level="H" />
            ) : (
              <div className="w-64 h-64 bg-zinc-100 flex items-center justify-center">
                <span className="text-zinc-400">QR Error</span>
              </div>
            )}
          </div>

          <button
            onClick={handleStartConnection}
            className="text-zinc-500 hover:text-zinc-800 font-medium transition-colors"
          >
            ↻ Refresh QR Code
          </button>
        </div>
      )}

      {status === "connected" && (
        <div className="flex flex-col items-center py-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-green-700 mb-2">WhatsApp Connected</h3>
          <p className="text-zinc-600 mb-8">
            Connected Number: <span className="font-bold">{whatsappNumber || "Hidden"}</span>
          </p>
          
          <button
            onClick={handleDisconnect}
            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold py-2 px-8 rounded-full transition-colors"
          >
            Disconnect WhatsApp
          </button>
        </div>
      )}
    </div>
  );
};

export default OrganizerWhatsAppConnect;
