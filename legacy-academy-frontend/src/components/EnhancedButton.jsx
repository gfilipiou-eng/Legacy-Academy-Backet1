import React from 'react';
import { useTouchFeedback } from '../hooks/useTouchFeedback';

/**
 * EnhancedButton - Βελτιωμένο button με καλύτερο touch feedback
 * 
 * Χρήση:
 * <EnhancedButton 
 *   onClick={handleClick}
 *   sound="nav_click"  // ή "tap", "click", "pop"
 *   scaleDown={0.9}    // πόσο θα συρρικνωθεί (0.9 = 90%)
 *   duration={150}     // διάρκεια animation σε ms
 *   className="your-classes"
 * >
 *   Button Text
 * </EnhancedButton>
 */
const EnhancedButton = ({ 
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

  // Combine classes for better touch feedback
  const combinedClasses = `
    ${className}
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    select-none
  `.trim();

  return (
    <button
      {...handlers}
      {...props}
      disabled={disabled}
      className={combinedClasses}
      style={{
        ...style,
        ...styles,
        outline: 'none',
        border: 'none',
      }}
    >
      {children}
    </button>
  );
};

export default EnhancedButton;