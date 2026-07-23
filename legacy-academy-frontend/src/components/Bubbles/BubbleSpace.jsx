import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './bubbles.css';
import { useTranslation } from '../../translations';
import { Icons } from '../Icons';
import Bubble from './Bubble';
import { fetchBubbles, createBubble, deleteBubble } from '../../api';

const BubbleInputForm = ({ onBlow, isBlowing, t }) => {
  const [newBubbleText, setNewBubbleText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onBlow(newBubbleText, selectedImage, () => {
      setNewBubbleText("");
      setSelectedImage(null);
    });
  };

  return (
    <div className="bubble-input-container">
      {selectedImage && (
        <div className="bubble-image-preview">
          <img src={URL.createObjectURL(selectedImage)} alt="Preview" />
          <button onClick={() => setSelectedImage(null)} type="button">
            <Icons.X className="w-4 h-4" />
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="bubble-form">
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
  );
};

const BubbleSpace = ({ user: currentUser, onClose }) => {
  const { t } = useTranslation();
  const [bubbles, setBubbles] = useState([]);
  const [isBlowing, setIsBlowing] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
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
        const positionedBubbles = data.map(b => ({
          ...b,
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
    setBubbles(prev => prev.filter(b => b._id !== id));
    try {
      await deleteBubble(id);
    } catch (err) {
      console.error("Error deleting bubble:", err);
    }
  };

  const handleBlowBubble = async (text, image, resetForm) => {
    if (!text.trim() || isBlowing) return;
    
    setIsBlowing(true);
    
    const tempId = Date.now().toString();
    const bubbleSize = image ? (160 + Math.random() * 40) : (110 + Math.random() * 50);
    
    const optimisticBubble = {
      _id: tempId,
      text: text,
      image: image ? URL.createObjectURL(image) : "",
      fromUsername: currentUser?.username || "user",
      fromProfilePic: currentUser?.profilePic || "",
      creator: currentUser?._id,
      isOptimistic: true,
      size: bubbleSize
    };

    setBubbles(prev => [...prev, optimisticBubble]);
    resetForm();

    try {
      const newB = await createBubble(text, image);
      
      setBubbles(prev => prev.map(b => b._id === tempId ? { 
        ...b, 
        ...newB, 
        _id: newB._id, 
        isOptimistic: false 
      } : b));
    } catch (err) {
      console.error("Error blowing bubble:", err);
      setBubbles(prev => prev.filter(b => b._id !== tempId));
    } finally {
      setIsBlowing(false);
    }
  };

  const handleBubbleClick = (bubble) => {
    if (deleteMode) {
      if ((bubble.creator?._id || bubble.creator) === currentUser?._id) {
        handleDeleteBubble(bubble._id);
      }
      return;
    }
    
    setTimeout(() => {
      setBubbles(prev => prev.filter(b => b._id !== bubble._id));
    }, 400);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md bubble-space-overlay"
      ref={containerRef}
    >
      <div className="absolute top-5 right-5 z-[60] flex flex-col gap-3">
        <button className="bubble-close-btn" style={{position: 'static'}} onClick={onClose} title="Close">
          <Icons.X className="w-6 h-6 text-white" />
        </button>
        <button 
          className="bubble-close-btn" 
          style={{
            position: 'static', 
            background: deleteMode ? 'rgba(255, 50, 50, 0.9)' : 'rgba(255, 255, 255, 0.1)',
            boxShadow: deleteMode ? '0 0 20px rgba(255, 0, 0, 0.6)' : 'none',
            color: deleteMode ? 'white' : 'white'
          }} 
          onClick={() => setDeleteMode(!deleteMode)}
          title="Delete Mode"
        >
          <Icons.Trash className="w-5 h-5" />
        </button>
      </div>

      <div className="bubble-space-canvas">
        <AnimatePresence>
          {bubbles.map(bubble => (
            <Bubble 
              key={bubble._id} 
              bubble={bubble} 
              currentUser={currentUser}
              size={bubble.size}
              isDeleteMode={deleteMode}
              onClick={() => handleBubbleClick(bubble)}
            />
          ))}
        </AnimatePresence>
      </div>

      <BubbleInputForm onBlow={handleBlowBubble} isBlowing={isBlowing} t={t} />
    </div>
  );
};

export default BubbleSpace;
