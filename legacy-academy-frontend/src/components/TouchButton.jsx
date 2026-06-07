import React from 'react';
import { useTouchFeedback } from '../hooks/useTouchFeedback';

const TouchButton = ({ 
  children, 
  onClick, 
  className = '', 
  sound = 'tap',
  scaleDown = 0.95,
  duration = 150,
  disabled = false,
  style = {},
  ...props 
}) => {
  const { handlers, styles, isPressed } = useTouchFeedback({
    onClick,
    sound,
    scaleDown,
    duration,
    disabled
  });

  return (
    <button
      {...handlers}
      {...props}
      disabled={disabled}
      className={`${className}`}
      style={{
        ...style,
        ...styles,
        outline: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
    </button>
  );
};

export default TouchButton;