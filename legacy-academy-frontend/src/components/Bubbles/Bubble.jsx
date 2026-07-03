import React from 'react';
import { motion } from 'framer-motion';

const Bubble = ({ bubble, onClick, size = 120, initialPosition = { x: 0, y: 0 } }) => {
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
      <div className="bubble-content">
        <p className="bubble-text">{bubble.text}</p>
        {bubble.creator && (
          <div className="bubble-creator">
            <img 
              src={bubble.creator.profilePic || "/default-avatar.png"} 
              alt={bubble.creator.username} 
              className="bubble-avatar" 
            />
            <span className="bubble-username">{bubble.creator.username}</span>
          </div>
        )}
      </div>
      <div className="bubble-glare"></div>
    </motion.div>
  );
};

export default Bubble;
