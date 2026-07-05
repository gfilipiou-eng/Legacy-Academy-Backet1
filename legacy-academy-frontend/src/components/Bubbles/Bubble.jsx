import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../Icons';

const Bubble = ({ bubble, currentUser, onClick, size = 120, isDeleteMode = false }) => {
  const isOwner = (bubble.creator?._id || bubble.creator) === currentUser?._id;
  const [isPopped, setIsPopped] = useState(false);
  // Gentle floating animation
  const durationY = 3 + Math.random() * 2;
  const delay = Math.random() * 2;

  const floatVariants = {
    initial: {
      scale: 0,
      opacity: 0,
      y: 20,
    },
    animate: {
      y: [0, -10, 0],
      scale: 1,
      opacity: 1,
      transition: {
        y: {
          duration: durationY,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
          delay: delay
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

  let finalVariants = floatVariants;
  if (isDeleteMode && isOwner) {
    finalVariants = {
      ...floatVariants,
      animate: {
        ...floatVariants.animate,
        rotate: [-2, 2, -2],
        transition: {
          ...floatVariants.animate.transition,
          rotate: {
            duration: 0.2,
            repeat: Infinity,
            repeatType: "mirror"
          }
        }
      }
    };
  }

  if (isPopped) {
    return (
      <div style={{ width: size, height: size, position: 'relative' }}>
        {/* Shockwave Ring */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0.8, borderWidth: 4 }}
          animate={{ scale: 1.6, opacity: 0, borderWidth: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            borderRadius: '50%',
            borderColor: 'rgba(255,255,255,0.8)',
            borderStyle: 'solid'
          }}
        />
        {/* Droplets */}
        {[...Array(12)].map((_, i) => {
          const angle = (i * Math.PI * 2) / 12;
          const distance = size * 0.7;
          return (
            <motion.div
              key={i}
              initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
              animate={{ 
                x: Math.cos(angle) * distance, 
                y: Math.sin(angle) * distance,
                scale: 0,
                opacity: 0
              }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              style={{
                position: 'absolute',
                top: '50%', left: '50%',
                width: 8, height: 8,
                backgroundColor: 'rgba(255,255,255,0.9)',
                borderRadius: '50%',
                boxShadow: '0 0 8px rgba(255,255,255,0.8)',
                marginTop: -4, marginLeft: -4
              }}
            />
          );
        })}
      </div>
    );
  }

  return (
    <motion.div
      className={`bubble-container ${isDeleteMode && isOwner ? 'ring-4 ring-red-500 shadow-[0_0_20px_rgba(255,0,0,0.8)]' : ''}`}
      style={{
        width: size,
        height: size,
      }}
      variants={finalVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap={isDeleteMode && isOwner ? "tap" : undefined}
      onClick={() => {
        if (isDeleteMode && isOwner) {
          onClick(bubble);
          return;
        }
        setIsPopped(true);
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
    </motion.div>
  );
};

export default Bubble;
