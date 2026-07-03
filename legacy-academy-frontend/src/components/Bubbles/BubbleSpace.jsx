import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './bubbles.css';
import { useTranslation } from '../../translations';
import Bubble from './Bubble';
import { fetchBubbles, createBubble } from '../../api'; // We'll need to add these to api.js

const BubbleSpace = ({ onClose }) => {
  const { t } = useTranslation();
  const [bubbles, setBubbles] = useState([]);
  const [newBubbleText, setNewBubbleText] = useState("");
  const [isBlowing, setIsBlowing] = useState(false);
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Disable body scroll when open
    document.body.style.overflow = 'hidden';
    
    if (containerRef.current) {
      setContainerSize({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight
      });
    }

    const loadBubbles = async () => {
      try {
        const data = await fetchBubbles();
        
        // Assign random initial positions
        const positionedBubbles = data.map(b => ({
          ...b,
          initialX: Math.random() * (window.innerWidth - 150),
          initialY: Math.random() * (window.innerHeight - 250),
          size: 100 + Math.random() * 60 // 100px to 160px
        }));
        
        setBubbles(positionedBubbles);
      } catch (err) {
        console.error("Error loading bubbles:", err);
      }
    };

    loadBubbles();

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleBlowBubble = async (e) => {
    e.preventDefault();
    if (!newBubbleText.trim() || newBubbleText.length > 100) return;
    
    setIsBlowing(true);
    try {
      const savedBubble = await createBubble(newBubbleText);
      const bubbleWithSize = {
        ...savedBubble,
        initialX: containerSize.width / 2 - 60, // Start from center-ish
        initialY: containerSize.height - 150, // Start from bottom
        size: 100 + Math.random() * 60
      };
      setBubbles(prev => [...prev, bubbleWithSize]);
      setNewBubbleText("");
    } catch (err) {
      console.error("Error blowing bubble:", err);
    } finally {
      setIsBlowing(false);
    }
  };

  const handlePopBubble = (bubbleToPop) => {
    // Simulate popping (the Framer motion tap animation handles the visual scale down)
    // Then we remove it from state so it unmounts
    setTimeout(() => {
      setBubbles(prev => prev.filter(b => b._id !== bubbleToPop._id));
    }, 200);
  };

  return (
    <motion.div 
      className="bubble-space-overlay"
      initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
      animate={{ opacity: 1, backdropFilter: "blur(10px)" }}
      exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
      ref={containerRef}
    >
      <button className="bubble-close-btn" onClick={onClose}>
        <i className="fa-solid fa-xmark"></i>
      </button>

      <div className="bubble-space-canvas">
        <AnimatePresence>
          {bubbles.map(bubble => (
            <Bubble 
              key={bubble._id} 
              bubble={bubble} 
              size={bubble.size}
              initialPosition={{ x: bubble.initialX, y: bubble.initialY }}
              onClick={handlePopBubble}
            />
          ))}
        </AnimatePresence>
      </div>

      <div className="bubble-input-container">
        <form onSubmit={handleBlowBubble} className="bubble-form">
          <input 
            type="text" 
            placeholder={t('BUBBLES_PLACEHOLDER', "What's in your bubble?")} 
            value={newBubbleText}
            onChange={(e) => setNewBubbleText(e.target.value)}
            maxLength={100}
            className="bubble-input"
          />
          <button 
            type="submit" 
            className="bubble-blow-btn"
            disabled={!newBubbleText.trim() || isBlowing}
          >
            {isBlowing ? t('BUBBLES_BLOWING', "Blowing...") : t('BUBBLES_BLOW_BTN', "Blow Bubble 🫧")}
          </button>
        </form>
        <div className="bubble-character-count">
          {newBubbleText.length}/100
        </div>
      </div>
    </motion.div>
  );
};

export default BubbleSpace;
