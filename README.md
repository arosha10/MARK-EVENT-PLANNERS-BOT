# 🌀ONYX MD🔥BOT👾

A powerful WhatsApp bot created by Arosh Samuditha using Node.js and Baileys.

## Features

- 🔗 **Session Pairing**: Generate pairing codes for WhatsApp Web
- 📁 **MEGA Integration**: Store sessions securely on MEGA
- 🌐 **Web Interface**: Generate pairing codes via browser
- 🤖 **Multi-Platform**: Works on various platforms
- 🔧 **Plugin System**: Easy to extend with custom plugins

## Prerequisites

- Node.js 20 or higher
- npm or yarn
- A MEGA account (for session storage)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MARK-EVENT-PLANNERS-BOT-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure the bot**
   - Copy `config.env` and fill in your details:
     ```env
     OWNER_NUM=your_phone_number_without_plus
     MEGA_EMAIL=your_mega_email
     MEGA_PASSWORD=your_mega_password
     ```

4. **Start the bot**
   ```bash
   npm start
   ```

## Usage

### Pairing a New Session

1. **Via WhatsApp**: Send `.pair <phone_number>` to the bot
2. **Via Web Interface**: Visit `http://localhost:8000/pair` in your browser

### Available Commands

- `.test` - Test if the bot is working
- `.pair <number>` - Generate pairing code for a phone number
- `.alive` - Check if bot is alive
- `.owner` - Owner commands

## Troubleshooting

### Login Issues

If the bot doesn't log in:

1. **Check Node.js version**: Ensure you're using Node.js 20+
2. **Clear session data**: Delete the `auth_info_baileys` folder
3. **Check MEGA credentials**: Verify your MEGA email and password
4. **Restart the bot**: Use `npm restart`

### Pairing Issues

If pairing fails:

1. **Check phone number format**: Use international format without +
2. **Wait for timeout**: The process has a 2-minute timeout
3. **Try again**: Use `.pair <number>` command again
4. **Check WhatsApp**: Ensure the phone has WhatsApp installed

## Support

- **GitHub**: https://github.com/aroshsamuditha/ONYX-MD
- **YouTube**: https://www.youtube.com/@ONYXSTUDIO2005
- **TikTok**: https://www.tiktok.com/@onyxstudio_byarosh

## License

This project is licensed under the MIT License.

---

**Created by Arosh Samuditha**

# ONYX-MD 
### **A JAVASCRIPT WHATSAPP BOT 🌀🔥**

*A WhatsApp based third party application that provide many services with a real-time automated conversational experience.*

![cover](https://raw.githubusercontent.com/aroshsamuditha/ONYX-MEDIA/refs/heads/main/oNYX%20bOT.jpg)

**ONYX MD** is a user bot for WhatsApp that allows you to do many tasks. This project mainly focuses on making the user's work easier. This project is coded with JavaScript and Docker. Also, you are not allowed to make any modifications to this project. This is our first bot and we will work on providing more updates in the future. Until then, enjoy!🌀🔥
⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘

---
### ※ Visit our official whatsapp group
**[JOIN 🔗](https://chat.whatsapp.com/IT6mjqGINN6LaLSKnTZd6r)**

### ※ You can join our Cool Art WhatsApp Group by this invite link
**[JOIN 🔗](https://chat.whatsapp.com/IT6mjqGINN6LaLSKnTZd6r)**

---
### GET SESSION ID:
**[SESSION ID 🔗](https://replit.com/@aroshasamuditha/ONYX-PIER-CODE)**

### CREATE MEGA ACCOUNT:
**[MEGA 📁](https://mega.io/)**

### GEMINI API:
**[GEMINI ⭐](https://aistudio.google.com/prompts/new_chat)**

### MOVIE API:
**[MOVIE 🎞](https://api.skymansion.site/movies-dl/)**

---
### DEPLOY METHOD 01:
**[LUNES HOST 👾](https://betadash.lunes.host/login)**


*Run Comands*

  **npm install**
  
  **npm start**


***සෑ.යු - Lunes Host platform එකෙන් ඔයා Bot ව Deploy කරනවනම් Movie API එක දාන්න එපා (මේ platform එකෙන් deploy කරාම Movie download කරන්න බෑ )***

---


### DEPLOY FROM WORKFLOW :

COPY WORKFLOW CODE 🌀🔥

```
name: Node.js CI

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  build:

    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [20.x]

    steps:
    - name: Checkout repository
      uses: actions/checkout@v3

    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}

    - name: Install dependencies
      run: npm install

    - name: Start application
      run: npm start

```

## **Contact ONYX MD Developers**

| <a href="https://wa.me/94761676948?text=*Hi,+Arosh🌀🔥*"><img src="https://raw.githubusercontent.com/aroshsamuditha/ONYX-MEDIA/refs/heads/main/IMG/me.png" width=150 height=150></a> | <a href="https://www.facebook.com/profile.php?id=61550302625124&mibextid=ZbWKwL"><img src="https://raw.githubusercontent.com/aroshsamuditha/ONYX-MEDIA/refs/heads/main/IMG/shakthi.png" width=150 height=150></a> |
|---|---|
| **[Arosh Samuditha](https://wa.me/94761676948?text=*Hi,+Arosh🌀🔥*)**</br>Main Developer & Owner</br>**[CREATIVE DEVIL💜🪄]** | **[Shakthi]( )**</br>Help Developer and errors fixed ||

