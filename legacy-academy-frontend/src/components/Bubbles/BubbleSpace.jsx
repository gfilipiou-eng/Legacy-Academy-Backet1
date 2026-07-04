import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './bubbles.css';
import { useTranslation } from '../../translations';
import { Icons } from '../Icons';
import Bubble from './Bubble';
import { fetchBubbles, createBubble, deleteBubble } from '../../api';
import { useSelector } from 'react-redux';

const BubbleSpace = ({ onClose }) => {
  const { currentUser } = useSelector(state => state.user);
  const { t } = useTranslation();
  const [bubbles, setBubbles] = useState([]);
  const [newBubbleText, setNewBubbleText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [isBlowing, setIsBlowing] = useState(false);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
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
        
        // Add random size and position
        const positionedBubbles = data.map(b => ({
          ...b,
          initialX: Math.random() * (window.innerWidth - 150),
          initialY: window.innerHeight - 150 + Math.random() * 50,
          size: b.image ? (160 + Math.random() * 40) : (110 + Math.random() * 50)
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

  const handleDeleteBubble = async (id) => {
    try {
      await deleteBubble(id);
      setBubbles(prev => prev.filter(b => b._id !== id));
    } catch (err) {
      console.error("Error deleting bubble:", err);
    }
  };

  const handleBlowBubble = async (e) => {
    e.preventDefault();
    if (!newBubbleText.trim() || isBlowing) return;
    
    setIsBlowing(true);
    
    const tempId = Date.now().toString();
    const bubbleSize = selectedImage ? (160 + Math.random() * 40) : (110 + Math.random() * 50);
    const textToSave = newBubbleText;
    const imgToSave = selectedImage;
    
    const optimisticBubble = {
      _id: tempId,
      text: textToSave,
      image: imgToSave ? URL.createObjectURL(imgToSave) : "",
      fromUsername: currentUser?.username || "user",
      fromProfilePic: currentUser?.profilePic || "",
      creator: currentUser?._id,
      isOptimistic: true,
      x: Math.random() * (containerSize.width - bubbleSize),
      y: Math.random() * (containerSize.height - bubbleSize),
      velocity: {
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2,
      },
      size: bubbleSize,
      initialX: Math.random() * (containerSize.width - bubbleSize),
      initialY: Math.random() * (containerSize.height - bubbleSize)
    };

    setBubbles(prev => [...prev, optimisticBubble]);
    setNewBubbleText("");
    setSelectedImage(null);

    try {
      const newB = await createBubble(textToSave, imgToSave);
      
      setBubbles(prev => prev.map(b => b._id === tempId ? { 
        ...b, 
        ...newB, 
        _id: newB._id, 
        isOptimistic: false 
      } : b));
    } catch (err) {
      console.error("Error blowing bubble:", err);
      // Remove optimistic bubble on error
      setBubbles(prev => prev.filter(b => b._id !== tempId));
    } finally {
      setIsBlowing(false);
    }
  };

  const handlePopBubble = (bubbleToPop) => {
    // Simulate popping
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
        <Icons.X className="w-6 h-6 text-white" />
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
              onDelete={handleDeleteBubble}
            />
          ))}
        </AnimatePresence>
      </div>

      <div className="bubble-input-container">
        {selectedImage && (
          <div className="bubble-image-preview">
            <img src={URL.createObjectURL(selectedImage)} alt="Preview" />
            <button onClick={() => setSelectedImage(null)} type="button">
              <Icons.X className="w-4 h-4" />
            </button>
          </div>
        )}
        <form onSubmit={handleBlowBubble} className="bubble-form">
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setSelectedImage(e.target.files[0]);
              }
            }}
          />
          <button
            type="button"
            className="bubble-img-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Add Image"
          >
            <Icons.Image className="w-5 h-5 text-white/70" />
          </button>
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
