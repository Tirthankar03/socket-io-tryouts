// client/src/App.js
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

// Connect to the backend Socket.IO server
const socket = io('http://localhost:5000');

type Tmessage = {
  username: string;
  content: string;
}

const App = () => {
  const [messages, setMessages] = useState<Tmessage[]>([]);
  const [username, setUsername] = useState('');
  const [content, setContent] = useState('');

  const [typingIndicator, setTypingIndicator] = useState('');
  const [isTyping, setIsTyping] = useState(false);


  const [videoQueue, setVideoQueue] = useState([]);
  const [videoUrl, setVideoUrl] = useState('');


  let typingTimeout: number

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

    // Listen for video queue updates
    socket.on('videoQueue', (queue) => {
      setVideoQueue(queue);
    });


    // Listen for events from the server
    socket.on('loadMessages', (loadedMessages) => {
      console.log('previous messages>>>', loadedMessages)
      setMessages(loadedMessages);
    });
  
    socket.on('broadcastMessage', (newMessage) => {
      console.log('broadcast message working!!!!');
      
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    socket.on('userTyping', (message) => {
      setTypingIndicator(message);
    });
  
    // Cleanup function
    return () => {  
      // Remove event listeners when the component unmounts          
      socket.off('broadcastMessage');          
      socket.off('loadMessages');
      socket.off('userTyping');
      socket.off('videoQueue')
    };
  }, []);
  

  const handleSendMessage = async () => {
    if (!username || !content) return;

    const message = { username, content };
    socket.emit('newMessage', message); // Emit message to server
    setContent(''); // Clear input field
    socket.emit('stopTyping'); // Notify server that user stopped typing
  };


  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', username); // Emit typing event to server
    }

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      setIsTyping(false);
      socket.emit('stopTyping'); // Emit stopTyping event to server
    }, 3000); // User stops typing after 1 second of inactivity
  };


  const handleAddVideo = () => {
    const videoId = extractVideoId(videoUrl);
    if (!videoId) return alert('Invalid YouTube URL');

    const video = {
      id: videoId,
      url: `https://www.youtube.com/embed/${videoId}`,
    };
    socket.emit('addVideo', video);
    setVideoUrl('');
  };

  const extractVideoId = (url) => {
    const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
    return match ? match[1] : null;
  };

  const handleUpvote = (videoId) => {
    socket.emit('upvote', videoId);
  };

  const handleDownvote = (videoId) => {
    socket.emit('downvote', videoId);
  };


  return (
    <div style={{ padding: '20px' }}>
      <h1>Chat Application</h1>
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
          }}
        />
      </div>
      <div>
      <h1>Shared Video Queue</h1>
      <input
        type="text"
        placeholder="Paste YouTube URL"
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
      />
      <button onClick={handleAddVideo}>Add Video</button>

      <h2>Video Queue</h2>
      <ul>
        {videoQueue
          .sort((a, b) => b.votes - a.votes)
          .map((video) => (
            <li key={video.id}>
              <iframe
                src={video.url}
                frameBorder="0"
                allow="autoplay; encrypted-media"
                allowFullScreen
                title={video.id}
                width="300"
                height="200"
              ></iframe>
              <div>
                Votes: {video.votes}{' '}
                <button onClick={() => handleUpvote(video.id)}>Upvote</button>
                <button onClick={() => handleDownvote(video.id)}>Downvote</button>
              </div>
            </li>
          ))}
      </ul>
    </div>
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          placeholder="Message"
          value={content}
          onChange={(e) => {setContent(e.target.value);
                         handleTyping();}}
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
      <div>
        <h3>{typingIndicator}</h3>
      </div>
    </div>
  );
};

export default App;
