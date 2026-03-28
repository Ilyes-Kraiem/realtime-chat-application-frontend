# 📌 Frontend Report – Real-Time Chat Application

## Overview

The frontend is built using **React.js** and provides a responsive real-time chat interface. It allows users to communicate instantly through WebSocket connections while maintaining a smooth and modern user experience.

---

## Key Features

### 💬 Chat Interface

* Sidebar with chat list and user search
* Real-time message display
* Sender vs receiver message styling
* Scrollable chat window

### ⚡ Real-Time Communication

* Integrated **Socket.IO client**
* Instant message updates without refresh
* Live synchronization across multiple users

### 👤 User Experience

* Online / offline status indicators
* Dynamic chat switching
* Clean and responsive UI design

### 🔗 API Integration

* Connected to backend APIs for:

  * Authentication
  * Chat retrieval
* Axios used for HTTP requests


## State Management

* Managed using React Hooks:

  * `useState`
  * `useEffect`
* Controlled:

  * Active chat
  * Messages
  * User session


## Deployment

* Deployed on **Vercel**
* Configured environment variables for backend connection


## Tech Stack

* React.js
* JavaScript (ES6+)
* Socket.IO Client
* Axios
* CSS


## Result

A fully functional real-time chat interface with smooth UX and instant communication between users.
