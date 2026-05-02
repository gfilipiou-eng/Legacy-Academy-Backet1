import { useState, useCallback, useRef } from 'react';
import { playSound } from '../utils/sounds';

export const useTouchFeedback = (options = {}) => {
  const {
    sound = 'tap',
    scaleDown = 0.95,
    duration = 150,
    onClick,
    disabled = false
  } = options;

  const [isPressed, setIsPressed] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const timeoutRef = useRef(null);

  const handleMouseDown = useCallback((e) => {
    if (disabled) return;
    setIsPressed(true);
    setIsTouch(false);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [disabled]);

  const handleMouseUp = useCallback(() => {
    setIsPressed(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPressed(false);
  }, []);

  const handleTouchStart = useCallback((e) => {
    if (disabled) return;
    setIsPressed(true);
    setIsTouch(true);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Play sound on touch start for better feedback
    if (sound) {
      playSound(sound);
    }
  }, [disabled, sound]);

  const handleTouchEnd = useCallback((e) => {
    setIsPressed(false);
    
    // Small delay to prevent double triggers
    timeoutRef.current = setTimeout(() => {
      setIsTouch(false);
    }, 50);
  }, []);

  const handleClick = useCallback((e) => {
    if (disabled) return;
    
    // Play sound on click if not already played on touch
    if (!isTouch && sound) {
      playSound(sound);
    }
    
    if (onClick) {
      onClick(e);
    }
  }, [disabled, isTouch, sound, onClick]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const transform = (isPressed && scaleDown !== 1) 
    ? `scale(${scaleDown})` 
    : undefined;

  const transition = (scaleDown !== 1 && duration !== 0)
    ? `transform ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1), background-color 200ms ease`
    : undefined;

  return {
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
      onClick: handleClick,
    },
    styles: {
      transform,
      transition,
      WebkitTapHighlightColor: 'transparent',
      WebkitTouchCallout: 'none',
      WebkitUserSelect: 'none',
      userSelect: 'none',
    },
    isPressed,
    isTouch,
    cleanup
  };
};

export default useTouchFeedback;