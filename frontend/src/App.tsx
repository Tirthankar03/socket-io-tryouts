// client/src/App.js
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

// Connect to the backend Socket.IO server
const socket = io('http://localhost:5000');

const App = () => {
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState('');
  const [content, setContent] = useState('');

  // // Load initial messages
  // useEffect(() => {
  //   socket.on('loadMessages', (loadedMessages) => {
  //     setMessages(loadedMessages);
  //   });

  //   socket.on('broadcastMessage', (newMessage) => {
  //     setMessages((prevMessages) => [...prevMessages, newMessage]);
  //   });

  //   return () => socket.disconnect(); // Cleanup on unmount
  // }, []);

  useEffect(() => {
    // Listen for events from the server
    socket.on('loadMessages', (loadedMessages) => {
      console.log('previous messages>>>', loadedMessages)
      setMessages(loadedMessages);
    });
  
    socket.on('broadcastMessage', (newMessage) => {
      console.log('broadcast message working!!!!');
      
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });
  
    // Cleanup function
    return () => {  
      // Remove event listeners when the component unmounts          
      socket.off('broadcastMessage');          
      socket.off('loadMessages');
    };
  }, []);
  

  const handleSendMessage = async () => {
    if (!username || !content) return;

    const message = { username, content };
    socket.emit('newMessage', message); // Emit message to server
    setContent(''); // Clear input field
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Chat Application</h1>
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          placeholder="Message"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
      <div>
        <h2>Messages</h2>
        <ul>
          {messages.map((msg, index) => (
            <li key={index}>
              <strong>{msg.username}: </strong>
              {msg.content}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default App;
