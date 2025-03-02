import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);
  const sendSoundRef = useRef(new Audio('/sounds/send_sound.mp3'));
  const replySoundRef = useRef(new Audio('/sounds/reply_sound.mp3'));

  // Preload and set volume for sounds
  useEffect(() => {
    sendSoundRef.current.preload = 'auto';
    sendSoundRef.current.volume = 0.5;
    replySoundRef.current.preload = 'auto';
    replySoundRef.current.volume = 0.5;
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Play send sound
    sendSoundRef.current.play().catch(e => console.warn("Send sound blocked:", e));

    const userMessage = { type: 'user', text: message, time: new Date().toLocaleTimeString() };
    setChatHistory(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      const historyJson = JSON.stringify(chatHistory.map(msg => ({ type: msg.type, text: msg.text })));
      const url = `https://sarcastic-bearcat-backend-4dcb99f19508.herokuapp.com/chat/${encodeURIComponent(message.trim())}?history=${encodeURIComponent(historyJson)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();

      const sarcasm = data.sarcasm || "Oops, the Bearcat’s lost its sass—try again!";
      const gif = data.gif || "https://media.giphy.com/media/26FPy3QZQqGtDcrja/giphy.gif";

      const bearMessage = { 
        type: 'bearcat', 
        text: sarcasm, 
        gif, 
        time: new Date().toLocaleTimeString() 
      };
      setChatHistory(prev => [...prev, bearMessage]);

      // Play reply sound
      replySoundRef.current.play().catch(e => console.warn("Reply sound blocked:", e));
    } catch (error) {
      console.error("Fetch error:", error);
      const errorMessage = { 
        type: 'bearcat', 
        text: `Wow, the backend’s dead. Shocking. Error: ${error.message || 'Unknown error'}`, 
        gif: "https://media.giphy.com/media/26FPy3QZQqGtDcrja/giphy.gif", 
        time: new Date().toLocaleTimeString() 
      };
      setChatHistory(prev => [...prev, errorMessage]);
      replySoundRef.current.play().catch(e => console.warn("Error sound blocked:", e));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  return (
    <div className={`App ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <header className="app-header">
        <h1>Sarcastic Bearcat</h1>
        <img 
          src="https://www.uc.edu/content/dam/refresh/marketing-communication/graphics/mascot-walk.svg" 
          alt="UC Bearcat Mascot" 
          className="bearcat-avatar" 
        />
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
          disabled={isLoading} // Disable input while loading
        />
        <button type="submit" className="funky-button" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

export default App;