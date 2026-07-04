import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../Icons';

const Bubble = ({ bubble, currentUser, onClick, onDelete, size = 120, initialPosition = { x: 0, y: 0 } }) => {
  // Randomize floating animation a bit so they don't all move the same
  const durationX = 10 + Math.random() * 10;
  const durationY = 8 + Math.random() * 8;
  const delay = Math.random() * 2;

  // Float randomly around initial position
  const floatVariants = {
    initial: {
      x: initialPosition.x,
      y: initialPosition.y,
      scale: 0,
      opacity: 0,
    },
    animate: {
      x: [initialPosition.x - 20, initialPosition.x + 20, initialPosition.x - 10, initialPosition.x],
      y: [initialPosition.y - 20, initialPosition.y + 10, initialPosition.y - 30, initialPosition.y - 10],
      scale: 1,
      opacity: 1,
      transition: {
        x: {
          duration: durationX,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
          delay: delay,
        },
        y: {
          duration: durationY,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
          delay: delay,
        },
        scale: {
          duration: 0.5,
          ease: "backOut",
        },
        opacity: {
          duration: 0.5,
        }
      }
    },
    hover: {
      scale: 1.1,
      rotate: [0, -5, 5, -5, 0],
      transition: {
        rotate: {
          duration: 0.3,
          repeat: Infinity
        }
      }
    },
    tap: {
      scale: 1.2,
      opacity: 0,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <motion.div
      className="bubble-container"
      style={{
        width: size,
        height: size,
        position: 'absolute',
      }}
      variants={floatVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
      onClick={() => onClick(bubble)}
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

        {bubble.creator === currentUser?._id && onDelete && (
          <button 
            className="bubble-delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(bubble._id);
            }}
            title="Delete Bubble"
          >
            <Icons.Trash className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="bubble-glare"></div>
    </motion.div>
  );
};

export default Bubble;
