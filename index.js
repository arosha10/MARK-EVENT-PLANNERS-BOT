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
    return console.log('Please add your session to SESSION_ID env !!');
  }
  
  const sessdata = config.SESSION_ID;
  const filer = File.fromURL('https://mega.nz/file/' + sessdata);
  
  filer.loadAttributes((err, file) => {
    if (err) throw err;
    file.download((err, stream) => {
      if (err) throw err;
      const writeStream = fs.createWriteStream(__dirname + '/auth_info_baileys/creds.json');
      stream.pipe(writeStream);
      writeStream.on('finish', () => {
        console.log('Session downloaded ✅');
      });
    });
  });
}

// Express server setup
const express = require('express');
const app = express();
const port = process.env.PORT || 8000;

async function connectToWA() {
  console.log('Connecting 🌀ONYX MD🔥BOT👾...');
  
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

  robin.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
      if (shouldReconnect) {
        connectToWA();
      }
    } else if (connection === 'open') {
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

    const command = require('./command');
    const cmdName = command ? body.slice(1).trim().split('\n')[0].trim().split(' ').shift().toLowerCase() : false;
    
    if (command) {
      const cmd = command.commands.find((cmd) => cmd.pattern === cmdName) || command.commands.find((cmd) => cmd.alias && cmd.alias.includes(cmdName));
      
      if (cmd) {
        if (cmd.react) robin.sendMessage(from, { react: { text: cmd.react, key: msg.key } });
        
        try {
          cmd.function(robin, msg, sms(robin, msg), {
            from: from,
            quoted: quoted,
            body: body,
            isCmd: command,
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
    command.commands.forEach(async (cmd) => {
      if (body && cmd.on === 'text') {
        cmd.function(robin, msg, sms(robin, msg), {
          from: from,
          l: console.log,
          quoted: quoted,
          body: body,
          isCmd: command,
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
            isCmd: command,
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
              isCmd: command,
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
              isCmd: command,
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
 
