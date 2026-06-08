import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getIo } from '../socket.js';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clients = new Map();

export const connectOrganizerWhatsApp = async (organizerId) => {
  if (clients.has(organizerId)) {
    console.log(`WhatsApp client already running for organizer ${organizerId}`);
    return;
  }

  const sessionDir = path.join(__dirname, '..', '.sessions', `organizer_${organizerId}`);
  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' })
  });

  clients.set(organizerId, sock);

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      console.log(`Generated QR for organizer ${organizerId}`);
      try {
        const io = getIo();
        io.to(`organizer_${organizerId}`).emit("whatsapp_qr", qr);
      } catch (err) {
        console.error("Socket.io emit error:", err.message);
      }
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(`WhatsApp connection closed for organizer ${organizerId}. Reconnecting:`, shouldReconnect);
      
      clients.delete(organizerId);

      try {
        const io = getIo();
        io.to(`organizer_${organizerId}`).emit("whatsapp_disconnected", { connected: false });
      } catch (err) {}

      if (shouldReconnect) {
        connectOrganizerWhatsApp(organizerId);
      } else {
        console.log(`WhatsApp logged out for organizer ${organizerId}. Clearing session.`);
        await User.findByIdAndUpdate(organizerId, {
          whatsappConnected: false,
          whatsappSessionId: null,
          whatsappNumber: null
        });
        if (fs.existsSync(sessionDir)) {
          fs.rmSync(sessionDir, { recursive: true, force: true });
        }
      }
    } else if (connection === 'open') {
      console.log(`WhatsApp connected successfully for organizer ${organizerId}!`);
      
      const whatsappNumber = sock.user.id.split(':')[0];
      
      await User.findByIdAndUpdate(organizerId, {
        whatsappConnected: true,
        whatsappSessionId: `organizer_${organizerId}`,
        whatsappNumber: whatsappNumber
      });

      try {
        const io = getIo();
        io.to(`organizer_${organizerId}`).emit("whatsapp_connected", {
          connected: true,
          whatsappNumber
        });
      } catch (err) {}
    }
  });
};

export const disconnectOrganizerWhatsApp = async (organizerId) => {
  const sock = clients.get(organizerId);
  if (sock) {
    sock.logout();
    clients.delete(organizerId);
  }
  
  const sessionDir = path.join(__dirname, '..', '.sessions', `organizer_${organizerId}`);
  if (fs.existsSync(sessionDir)) {
    fs.rmSync(sessionDir, { recursive: true, force: true });
  }

  await User.findByIdAndUpdate(organizerId, {
    whatsappConnected: false,
    whatsappSessionId: null,
    whatsappNumber: null
  });

  try {
    const io = getIo();
    io.to(`organizer_${organizerId}`).emit("whatsapp_disconnected", { connected: false });
  } catch (err) {}
};

export const getOrganizerConnectionStatus = (organizerId) => {
  return clients.has(organizerId);
};

export const sendMessage = async (organizerId, phone, message) => {
  const sock = clients.get(organizerId);
  if (!sock) {
    console.error(`WhatsApp not connected for organizer ${organizerId}`);
    return false;
  }
  try {
    let jid = phone.toString().replace(/\D/g, '');
    if (!jid.startsWith('91')) jid = '91' + jid;
    jid = jid + '@s.whatsapp.net';

    await sock.sendMessage(jid, { text: message });
    console.log(`Message sent to ${phone} from organizer ${organizerId}`);
    return true;
  } catch (err) {
    console.error(`Failed to send to ${phone} from organizer ${organizerId}:`, err.message);
    return false;
  }
};
