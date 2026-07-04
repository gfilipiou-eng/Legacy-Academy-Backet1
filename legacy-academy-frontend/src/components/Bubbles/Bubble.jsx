import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '../Icons';

const Bubble = ({ bubble, currentUser, onClick, size = 120, isDeleteMode = false }) => {
  const isOwner = (bubble.creator?._id || bubble.creator) === currentUser?._id;
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

        )}
      </div>
      <div className="bubble-glare"></div>
    </motion.div>
  );
};

export default Bubble;
