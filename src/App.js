import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode
  const [isLoading, setIsLoading] = useState(false); // For loading state
  const chatEndRef = useRef(null); // For auto-scrolling to the bottom
  const sendSoundRef = useRef(new Audio('/sounds/send_sound.mp3')); // Sound for sending
  const replySoundRef = useRef(new Audio('/sounds/reply_sound.mp3')); // Sound for Bearcat reply

  // Preload and set volume for sounds
  useEffect(() => {
    sendSoundRef.current.preload = 'auto';
    sendSoundRef.current.volume = 0.5; // 50% volume
    replySoundRef.current.preload = 'auto';
    replySoundRef.current.volume = 0.5; // 50% volume
  }, []);

  // Scroll to the bottom of chat when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return; // No empty or whitespace-only messages

    // Play send sound
    try {
      await sendSoundRef.current.play().catch(e => console.warn("Send sound blocked:", e));
    } catch (error) {
      console.warn("Send sound failed:", error);
    }

    // Add user message to chat history
    const userMessage = { type: 'user', text: message, time: new Date().toLocaleTimeString() };
    setChatHistory(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      console.log("Sending message:", message);
      const historyJson = JSON.stringify(chatHistory.map(msg => ({ type: msg.type, text: msg.text })));
      const url = `http://localhost:8000/chat/${encodeURIComponent(message.trim())}?history=${encodeURIComponent(historyJson)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();

      // Handle OpenRouter API response structure (fix for 'choices' error)
      let sarcasm = "Oops, the Bearcat’s lost its sass—try again!";
      let gif = "https://media.giphy.com/media/26FPy3QZQqGtDcrja/giphy.gif"; // Fallback GIF
      if (data && data.sarcasm) {
        sarcasm = data.sarcasm;
      }
      if (data && data.gif) {
        gif = data.gif;
      } else {
        // Try to fetch GIF directly if not in response
        try {
          const gifRes = await fetch('https://api.giphy.com/v1/gifs/random?api_key=your_giphy_key&tag=sarcasm&rating=pg-13');
          const gifData = await gifRes.json();
          gif = gifData.data.images.original.url || gif;
        } catch (gifError) {
          console.warn("GIPHY fetch failed:", gifError);
        }
      }

      // Add Bearcat response to chat history
      const bearMessage = { 
        type: 'bearcat', 
        text: sarcasm, 
        gif: gif, 
        time: new Date().toLocaleTimeString() 
      };
      setChatHistory(prev => [...prev, bearMessage]);

      // Play reply sound
      try {
        await replySoundRef.current.play().catch(e => console.warn("Reply sound blocked:", e));
      } catch (error) {
        console.warn("Reply sound failed:", error);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      const errorMessage = { 
        type: 'bearcat', 
        text: "Wow, the backend’s dead. Shocking. Error: " + (error.message || 'Unknown error'), 
        gif: "https://media.giphy.com/media/26FPy3QZQqGtDcrja/giphy.gif", 
        time: new Date().toLocaleTimeString() 
      };
      setChatHistory(prev => [...prev, errorMessage]);

      // Play reply sound for error
      try {
        await replySoundRef.current.play().catch(e => console.warn("Error sound blocked:", e));
      } catch (error) {
        console.warn("Error sound failed:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <div className={`App ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <header className="app-header">
        <h1>Sarcastic Bearcat</h1>
        <img src="https://www.uc.edu/content/dam/refresh/marketing-communication/graphics/mascot-walk.svg" alt="UC Bearcat Mascot" className="bearcat-avatar" />
        <label className="theme-toggle" aria-label="Toggle dark/light mode">
          <input type="checkbox" checked={!isDarkMode} onChange={toggleTheme} />
          <span className="toggle-icon">
            <span className="moon">🌙</span>
            <span className="sun">☀️</span>
          </span>
        </label>
      </header>

      <div className="chat-container">
        <div className="welcome-message">
          <p>Hey, I’m the Sarcastic Bearcat—ready to roast you with wit, facts, GIFs, and sass. Drop a message, and let’s get noisy!</p>
        </div>
        <div className="chat-window">
          {chatHistory.map((msg, index) => (
            <div key={index} className={`message ${msg.type}`}>
              <div className="message-content">
                <p>{msg.text}</p>
                {msg.gif && <img src={msg.gif} alt="Sarcastic GIF" className="gif bounce" />}
                <span className="time">{msg.time}</span>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="loading">
              <span className="spinner">🐾 Thinking of a sassy reply...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="chat-input">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Drop your chill vibes here..."
          className="funky-input"
          aria-label="Chat input"
        />
        <button type="submit" className="funky-button">Send</button>
      </form>
    </div>
  );
}

export default App;