import { Link } from 'react-router-dom';
import './homepage.css';
import { TypeAnimation } from 'react-type-animation';
import { useState } from 'react';
//import { useAuth } from '@clerk/clerk-react';

const Homepage = () => {
  const [typingStatus, setTypingStatus] = useState("human1");

  return (
    <div className="homepage">
      <img src="/orbital.png" alt=" " className="orbital" />
      <div className="Left">
        <h1> DEV CHAT-AI </h1>
        <h2> Supercharge your creativity and productivity</h2>
        <h3>
          An intelligent, human-like assistant designed to answer your questions,
          spark ideas, and simplify your life — all in real-time.
        </h3>
        <button>
          <Link to="/dashboard"> Get Started </Link>
        </button>
      </div>
      <div className="Right">
        <div className="imgContainer">
          <div className="bgContainer">
            <div className="bg"></div>
          </div>
          <img src="/bot.png" alt="" className="bot" />
          <div className="chat">
            <img
              src={
                typingStatus === "human1"
                  ? "/human1.jpeg"
                  : typingStatus === "human2"
                  ? "/human2.jpeg"
                  : "bot.png"
              }
              alt=""
            />
            <TypeAnimation
              sequence={[
                'Human1: I need help debugging this JavaScript error.',
                2000,
                () => {
                  setTypingStatus("bot");
                },
                'Bot: No worries! Let me scan your code and suggest fixes.',
                2000,
                () => {
                  setTypingStatus("human2");
                },
                "Human2: What's the best way to learn TypeScript?",
                2000,
                () => {
                  setTypingStatus("bot");
                },
                'Bot: Start small—convert one file at a time. Use VSCode + TS Docs!',
                2000,
                () => {
                  setTypingStatus("human1");
                },
              ]}
              wrapper="span"
              repeat={Infinity}
              cursor={true}
              omitDeletionAnimation={true}
            />
          </div>
        </div>
      </div>
      <div className="terms">
        <img src="/logo.png" alt="" />
        <div className="links">
          <Link to="/">Terms of Services</Link>
          <span>
            <h2>|</h2>
          </span>
          <Link to="/">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
};

export default Homepage;
