import React, { useState } from 'react';
import { motion } from 'framer-motion';

const Bubble = ({ bubble, currentUser, onClick, size = 120, isDeleteMode = false }) => {
  const isOwner = (bubble.creator?._id || bubble.creator) === currentUser?._id;
  
  const [isNew] = useState(() => Date.now() - new Date(bubble.createdAt).getTime() < 5000);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.1 } }}
      style={{ width: size, height: size }}
    >
      <div
        className={`bubble-container ${isNew ? 'new-bubble-effect' : ''} ${isDeleteMode && isOwner ? 'ring-4 ring-red-500 shadow-[0_0_20px_rgba(255,0,0,0.8)]' : ''} transition-transform duration-200 hover:scale-105 active:scale-95`}
        style={{
          width: '100%',
          height: '100%',
          cursor: 'pointer'
        }}
        onClick={() => {
          onClick(bubble);
        }}
      >
        <div className={`bubble-content ${bubble.image ? 'bubble-has-image' : ''}`}>
          <p className="bubble-text">{bubble.text}</p>
          {bubble.creator && (
            <div className="bubble-creator">
            {bubble.fromProfilePic || (bubble.creator && bubble.creator.profilePic) ? (
              <img src={bubble.fromProfilePic || bubble.creator.profilePic} alt="creator" className="bubble-avatar" />
            ) : (
              <div className="bubble-avatar" style={{ background: '#333' }} />
            )}
            <span className="bubble-username">@{bubble.fromUsername || (bubble.creator && bubble.creator.username) || 'user'}</span>
          </div>
          )}
          {bubble.image && (
            <div className="mt-1 w-[80%] flex items-center justify-center">
              <img src={bubble.image} alt="bubble" className="max-w-full max-h-[60px] object-contain rounded-md drop-shadow-md" />
            </div>
          )}
        </div>
        <div className="bubble-glare"></div>
      </div>
    </motion.div>
  );
};

export default Bubble;
