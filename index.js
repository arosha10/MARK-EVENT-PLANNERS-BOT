const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, jidNormalizedUser, getContentType, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys');
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('./lib/functions');
const fs = require('fs');
const pino = require('pino');
const config = require('./config');
const qrcode = require('qrcode-terminal');
const util = require('util');
const { sms, downloadMediaMessage } = require('@whiskeysockets/baileys');
const axios = require('axios');
const { File } = require('megajs');
const prefix = config.PREFIX;

// Global fetch for Node.js
(async () => {
  const { default: fetch } = await import('node-fetch');
  globalThis.fetch = fetch;
})();

const ownerNumber = config.OWNER_NUM;

// Check if session exists, if not download from MEGA
if (!fs.existsSync(__dirname + '/auth_info_baileys/creds.json')) {
  if (!config.SESSION_ID) {
    console.log('No SESSION_ID provided, bot will start without session');
  } else {
    console.log('Downloading session from MEGA...');
    console.log('Session ID:', config.SESSION_ID);
    
    const sessdata = config.SESSION_ID;
    // The SESSION_ID should already be a complete MEGA link or file ID
    const megaLink = sessdata.startsWith('http') ? sessdata : 'https://mega.nz/file/' + sessdata;
    console.log('MEGA Link:', megaLink);
    
    // Create auth_info_baileys directory if it doesn't exist
    const authDir = __dirname + '/auth_info_baileys';
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
      console.log('Created auth_info_baileys directory');
    }
    
    try {
      // For megajs v1.3.7, we need to use File.fromURL
      const file = File.fromURL(megaLink);
      console.log('MEGA file object created successfully');
      
      // Set a timeout for the entire MEGA download process
      const megaTimeout = setTimeout(() => {
        console.log('MEGA download timed out after 30 seconds');
        console.log('Bot will continue without session - you can use pairing instead');
        createBasicSession();
      }, 30000);
      
      file.loadAttributes((err, fileInfo) => {
        if (err) {
          console.error('Error loading MEGA file attributes:', err);
          console.log('This could mean:');
          clearTimeout(megaTimeout);
          console.log('1. The MEGA link is invalid or expired');
          console.log('2. The file has been deleted');
          console.log('3. Network connectivity issues');
          console.log('4. MEGA service is down');
          console.log('Bot will continue without session - you can use pairing instead');
          createBasicSession();
          return;
        }
        
        console.log('File attributes loaded successfully');
        console.log('File name:', fileInfo.name);
        console.log('File size:', (fileInfo.size / 1024).toFixed(2), 'KB');
        
        file.download((err, stream) => {
          if (err) {
            clearTimeout(megaTimeout);
            console.error('Error downloading from MEGA:', err);
            console.log('Bot will continue without session - you can use pairing instead');
            createBasicSession();
            return;
          }
          
          console.log('Download started, stream received');
          console.log('Stream type:', typeof stream);
          console.log('Stream has pipe method:', typeof stream.pipe === 'function');
          
          try {
            const writeStream = fs.createWriteStream(__dirname + '/auth_info_baileys/creds.json');
            console.log('Write stream created');
            
            // Handle the stream properly
            if (stream && typeof stream.pipe === 'function') {
              console.log('Stream is valid, starting download...');
              stream.pipe(writeStream);
              
              writeStream.on('finish', () => {
                clearTimeout(megaTimeout);
                console.log('Session downloaded ✅');
                console.log('File saved to:', __dirname + '/auth_info_baileys/creds.json');
              });
              
              writeStream.on('error', (err) => {
                console.error('Error writing session file:', err);
                console.log('Bot will continue without session - you can use pairing instead');
              });
              
              stream.on('error', (streamErr) => {
                console.error('Stream error:', streamErr);
                console.log('Bot will continue without session - you can use pairing instead');
              });
              
              stream.on('end', () => {
                console.log('Stream ended successfully');
              });
              
            } else if (stream && Buffer.isBuffer(stream)) {
              // Handle Buffer data directly
              console.log('Received Buffer data, writing directly...');
              try {
                fs.writeFileSync(__dirname + '/auth_info_baileys/creds.json', stream);
                clearTimeout(megaTimeout);
                console.log('Session downloaded ✅');
                console.log('File saved to:', __dirname + '/auth_info_baileys/creds.json');
              } catch (writeError) {
                clearTimeout(megaTimeout);
                console.error('Error writing session file:', writeError);
                console.log('Bot will continue without session - you can use pairing instead');
                createBasicSession();
              }
            } else {
              console.error('Invalid stream received from MEGA');
              console.log('Stream object:', stream);
              console.log('Stream type:', typeof stream);
              if (stream) {
                console.log('Stream properties:', Object.keys(stream));
              }
              clearTimeout(megaTimeout);
              console.log('Bot will continue without session - you can use pairing instead');
              createBasicSession();
            }
          } catch (error) {
            clearTimeout(megaTimeout);
            console.error('Error setting up file stream:', error);
            console.log('Bot will continue without session - you can use pairing instead');
            createBasicSession();
          }
        });
      });
    } catch (error) {
      console.error('Error creating MEGA file object:', error);
      console.log('This could mean:');
      console.log('1. Invalid MEGA link format');
      console.log('2. Network connectivity issues');
      console.log('3. MEGA service is down');
      console.log('Bot will continue without session - you can use pairing instead');
      createBasicSession();
    }
  }
}

// Create basic session structure if MEGA download fails
function createBasicSession() {
  const authDir = __dirname + '/auth_info_baileys';
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  
  // Create a basic creds.json structure
  const basicCreds = {
    noiseKey: {
      private: Buffer.alloc(32),
      public: Buffer.alloc(32)
    },
    signedIdentityKey: {
      private: Buffer.alloc(32),
      public: Buffer.alloc(32)
    },
    signedPreKey: {
      keyPair: {
        private: Buffer.alloc(32),
        public: Buffer.alloc(32)
      },
      signature: Buffer.alloc(64),
      keyId: 1
    },
    registrationId: 0,
    advSignedIdentityKey: {
      private: Buffer.alloc(32),
      public: Buffer.alloc(32)
    },
    processedHistoryMessages: [],
    nextPreKeyId: 1,
    firstUnuploadedPreKeyId: 1,
    accountSettings: {
      unarchiveChats: false
    }
  };
  
  fs.writeFileSync(authDir + '/creds.json', JSON.stringify(basicCreds, null, 2));
  console.log('Created basic session structure for pairing');
}

// Express server setup
const express = require('express');
const app = express();
const port = process.env.PORT || 8000;

// Start web server
app.listen(port, () => {
  console.log(`🌐 Web server listening on port http://localhost:${port}`);
  console.log('📱 Access pairing interface at: http://localhost:8000');
});

async function connectToWA() {
  console.log('Connecting 🌀ONYX MD🔥BOT👾...');
  
  // Ensure we have a session directory and basic structure
  const authDir = __dirname + '/auth_info_baileys';
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  
  if (!fs.existsSync(authDir + '/creds.json')) {
    console.log('No session found, creating basic structure for pairing...');
    createBasicSession();
  }
  
  const { state, saveCreds } = await useMultiFileAuthState(__dirname + '/auth_info_baileys/');
  var { version } = await fetchLatestBaileysVersion();
  
  const robin = makeWASocket({
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.macOS('Safari'),
    syncFullHistory: false,
    auth: state,
    version: version,
    connectTimeoutMs: 60000,
    qrTimeout: 40000,
    defaultQueryTimeoutMs: 60000,
    retryRequestDelayMs: 250,
  });

  // Add connection timeout
  const connectionTimeout = setTimeout(() => {
    console.log('Connection timeout - bot may need QR code or pairing');
    console.log('Access web interface at http://localhost:8000 for pairing');
  }, 30000);

  robin.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    console.log('Connection update:', connection);
    
    if (qr) {
      console.log('QR Code received - scan with WhatsApp to connect');
    }
    
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
      if (shouldReconnect) {
        connectToWA();
      }
    } else if (connection === 'open') {
      clearTimeout(connectionTimeout);
      console.log(' Installing... ');
      
      // Load plugins
      const pluginFolder = fs.readdirSync('./plugins/');
      const pluginFilter = pluginFolder.filter((plugin) => plugin.endsWith('.js'));
      
      pluginFilter.forEach(async (plugin) => {
        require('./plugins/' + plugin);
      });
      
      console.log('🌀ONYX MD🔥BOT👾 installed successful ✅');
      console.log('🌀ONYX MD🔥BOT👾 connected to whatsapp ✅');
      
      let caption = '*🌀ONYX MD🔥BOT👾 connected successful ✅*\n\n𝙾𝚗𝚢𝚡 𝙼𝚍 𝚒𝚜 𝚊 𝚋𝚘𝚝 𝚝𝚑𝚊𝚝 𝚠𝚘𝚛𝚔𝚜 𝚘𝚗 𝚆𝚑𝚊𝚝𝚜𝚊𝚙𝚙 𝚌𝚛𝚎𝚊𝚝𝚎𝚍 𝚋𝚢 𝙰𝚛𝚘𝚜𝚑 𝚂𝚊𝚖𝚞𝚍𝚒𝚝𝚑𝚊! 𝚈𝚘𝚞 𝚌𝚊𝚗 𝚐𝚎𝚝 𝚖𝚊𝚗𝚢 𝚋𝚎𝚗𝚎𝚏𝚒𝚝𝚜 𝚏𝚛𝚘𝚖 𝚝𝚑𝚒𝚜 🤑\n\n*✅ Github repository = https://github.com/aroshsamuditha/ONYX-MD*\n*✅Youtube = https://www.youtube.com/@ONYXSTUDIO2005*\n*✅ Tiktok Page = https://www.tiktok.com/@onyxstudio_byarosh?_t=ZS-8xQGlXXfj3o&_r=1*\n\n> By Arosh Samuditha';
      let text = '*※ Hello Arosh, I made bot successful 🖤✅*';
      
      robin.sendMessage(ownerNumber + '@s.whatsapp.net', {
        image: { url: 'https://raw.githubusercontent.com/aroshsamuditha/ONYX-MEDIA/refs/heads/main/oNYX%20bOT.jpg' },
        caption: caption
      });
      
      robin.sendMessage(ownerNumber + '@s.whatsapp.net', {
        image: { url: 'https://raw.githubusercontent.com/aroshsamuditha/ONYX-MEDIA/refs/heads/main/oNYX%20bOT.jpg' },
        caption: text
      });
    }
  });

  robin.ev.on('creds.update', saveCreds);

  robin.ev.on('messages.upsert', async (chatUpdate) => {
    const msg = chatUpdate.messages[0];
    if (!msg.key.fromMe) return;
    
    msg.message = getContentType(msg.message) === 'ephemeralMessage' ? msg.message.ephemeralMessage.message : msg.message;
    
    if (msg.key && msg.key.remoteJid === 'status@broadcast' && config.AUTO_READ_STATUS === 'true') {
      await robin.readMessages([msg.key]);
    }
    
    const messageType = getContentType(msg.message);
    const messageContent = JSON.stringify(msg.message);
    const from = msg.key.remoteJid;
    const quoted = messageType === 'extendedTextMessage' && msg.message.extendedTextMessage.contextInfo != null ? msg.message.extendedTextMessage.contextInfo.quotedMessage || [] : [];
    const body = messageType === 'conversation' ? msg.message.conversation : messageType === 'extendedTextMessage' ? msg.message.extendedTextMessage.text : messageType == 'imageMessage' && msg.message.imageMessage.caption ? msg.message.imageMessage.caption : messageType == 'videoMessage' && msg.message.videoMessage.caption ? msg.message.videoMessage.caption : '';
    const command = body.startsWith(prefix);
    const text = command ? body.slice(prefix.length).trim().split('\n')[0].trim().split(' ').shift().toLowerCase() : '';
    const args = body.trim().split(/ +/).slice(1);
    const q = args.join(' ');
    const isGroup = from.endsWith('@g.us');
    const sender = msg.key.participant ? robin.user.id.split(':')[0] + '@s.whatsapp.net' || robin.user.id : msg.key.remoteJid || msg.key.participant;
    const senderNumber = sender.split('@')[0];
    const botNumber2 = await jidNormalizedUser(robin.user.id);
    const botNumber = robin.user.id.split(':')[0];
    const pushname = msg.pushName || 'Sin Nombre';
    const isMe = botNumber.includes(senderNumber);
    const isOwner = ownerNumber.includes(senderNumber) || isMe;
    const groupMetadata = isGroup ? await robin.groupMetadata(from).catch((e) => {}) : '';
    const groupName = isGroup ? await groupMetadata.subject : '';
    const participants = isGroup ? await groupMetadata.participants : '';
    const groupAdmins = isGroup ? await getGroupAdmins(participants) : '';
    const isBotAdmins = isGroup ? groupAdmins.includes(botNumber2) : false;
    const isAdmins = isGroup ? groupAdmins.includes(sender) : false;
    const isCmd = sms(robin, msg).message.conversation ? true : false;
    
    const reply = (teks) => {
      robin.sendMessage(from, { text: teks }, { quoted: msg });
    };

    // Custom sendFileUrl function
    robin.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
      let mimetype = '';
      const response = await axios.head(url);
      mimetype = response.headers['content-type'];
      
      if (mimetype.split('/')[1] === 'gif') {
        return robin.sendMessage(jid, { video: await getBuffer(url), caption: caption, gifPlayback: true, ...options }, { quoted: quoted, ...options });
      }
      
      let type = mimetype.split('/')[0] + 'Message';
      if (mimetype === 'application/pdf') {
        return robin.sendMessage(jid, { document: await getBuffer(url), mimetype: 'application/pdf', caption: caption, ...options }, { quoted: quoted, ...options });
      }
      if (mimetype.split('/')[0] === 'image') {
        return robin.sendMessage(jid, { image: await getBuffer(url), caption: caption, ...options }, { quoted: quoted, ...options });
      }
      if (mimetype.split('/')[0] === 'video') {
        return robin.sendMessage(jid, { video: await getBuffer(url), caption: caption, mimetype: 'video/mp4', ...options }, { quoted: quoted, ...options });
      }
      if (mimetype.split('/')[0] === 'audio') {
        return robin.sendMessage(jid, { audio: await getBuffer(url), caption: caption, mimetype: 'audio/mpeg', ...options }, { quoted: quoted, ...options });
      }
    };

    if (senderNumber.includes('status')) {
      if (isCmd) return;
      sms(robin, msg).react('💀');
    }
    
    if (!isOwner && config.MODE === 'private') return;
    if (!isOwner && isGroup && config.MODE === 'inbox') return;
    if (!isOwner && !isGroup && config.MODE === 'groups') return;

    const commandModule = require('./command');
    const cmdName = commandModule ? body.slice(1).trim().split('\n')[0].trim().split(' ').shift().toLowerCase() : false;
    
    if (commandModule) {
      const cmd = commandModule.commands.find((cmd) => cmd.pattern === cmdName) || commandModule.commands.find((cmd) => cmd.alias && cmd.alias.includes(cmdName));
      
      if (cmd) {
        if (cmd.react) robin.sendMessage(from, { react: { text: cmd.react, key: msg.key } });
        
        try {
                     cmd.function(robin, msg, sms(robin, msg), {
             from: from,
             quoted: quoted,
             body: body,
             isCmd: commandModule,
             command: cmdName,
            args: args,
            q: q,
            isGroup: isGroup,
            sender: sender,
            senderNumber: senderNumber,
            botNumber2: botNumber2,
            botNumber: botNumber,
            pushname: pushname,
            isMe: isMe,
            isOwner: isOwner,
            groupMetadata: groupMetadata,
            groupName: groupName,
            participants: participants,
            groupAdmins: groupAdmins,
            isBotAdmins: isBotAdmins,
            isAdmins: isAdmins,
            reply: reply
          });
        } catch (e) {
          console.log('[PLUGIN ERROR] ' + e);
        }
      }
    }

    // Handle other events
    commandModule.commands.forEach(async (cmd) => {
      if (body && cmd.on === 'text') {
        cmd.function(robin, msg, sms(robin, msg), {
          from: from,
          l: console.log,
          quoted: quoted,
          body: body,
          isCmd: commandModule,
          command: cmd,
          args: args,
          q: q,
          isGroup: isGroup,
          sender: sender,
          senderNumber: senderNumber,
          botNumber2: botNumber2,
          botNumber: botNumber,
          pushname: pushname,
          isMe: isMe,
          isOwner: isOwner,
          groupMetadata: groupMetadata,
          groupName: groupName,
          participants: participants,
          groupAdmins: groupAdmins,
          isBotAdmins: isBotAdmins,
          isAdmins: isAdmins,
          reply: reply
        });
      } else {
        if (msg.q && cmd.on === 'text') {
          cmd.function(robin, msg, sms(robin, msg), {
            from: from,
            l: console.log,
            quoted: quoted,
            body: body,
            isCmd: commandModule,
            command: cmd,
            args: args,
            q: q,
            isGroup: isGroup,
            sender: sender,
            senderNumber: senderNumber,
            botNumber2: botNumber2,
            botNumber: botNumber,
            pushname: pushname,
            isMe: isMe,
            isOwner: isOwner,
            groupMetadata: groupMetadata,
            groupName: groupName,
            participants: participants,
            groupAdmins: groupAdmins,
            isBotAdmins: isBotAdmins,
            isAdmins: isAdmins,
            reply: reply
          });
        } else {
          if ((cmd.on === 'image' || cmd.on === 'photo') && msg.message === 'imageMessage') {
            cmd.function(robin, msg, sms(robin, msg), {
              from: from,
              l: console.log,
              quoted: quoted,
              body: body,
              isCmd: commandModule,
              command: cmd,
              args: args,
              q: q,
              isGroup: isGroup,
              sender: sender,
              senderNumber: senderNumber,
              botNumber2: botNumber2,
              botNumber: botNumber,
              pushname: pushname,
              isMe: isMe,
              isOwner: isOwner,
              groupMetadata: groupMetadata,
              groupName: groupName,
              participants: participants,
              groupAdmins: groupAdmins,
              isBotAdmins: isBotAdmins,
              isAdmins: isAdmins,
              reply: reply
            });
          } else if (cmd.on === 'sticker' && msg.message === 'stickerMessage') {
            cmd.function(robin, msg, sms(robin, msg), {
              from: from,
              l: console.log,
              quoted: quoted,
              body: body,
              isCmd: commandModule,
              command: cmd,
              args: args,
              q: q,
              isGroup: isGroup,
              sender: sender,
              senderNumber: senderNumber,
              botNumber2: botNumber2,
              botNumber: botNumber,
              pushname: pushname,
              isMe: isMe,
              isOwner: isOwner,
              groupMetadata: groupMetadata,
              groupName: groupName,
              participants: participants,
              groupAdmins: groupAdmins,
              isBotAdmins: isBotAdmins,
              isAdmins: isAdmins,
              reply: reply
            });
          }
        }
      }
    });
  });
}

// Express routes
app.get('/', (req, res) => {
  res.send('hey, 🌀ONYX MD🔥BOT👾 started✅');
});

app.listen(port, () => console.log('Server listening on port http://localhost:' + port));

// Start the bot after a delay
setTimeout(() => {
  connectToWA();
}, 4000);
 
