import React, { useState } from 'react';

const EnhancedButton = ({ 
    children, 
    onClick, 
    className = '', 
    scaleDown = 0.95,
    duration = 150,
    disabled = false,
    style = {},
    ...props 
}) => {
    const [isPressed, setIsPressed] = useState(false);

    const handlePressStart = () => {
        if (!disabled) setIsPressed(true);
    };

    const handlePressEnd = () => {
        setIsPressed(false);
    };

    const combinedClasses = `
        ${className}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        select-none
    `.trim();

    return (
        <button
            onClick={disabled ? undefined : onClick}
            onMouseDown={handlePressStart}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            onTouchStart={handlePressStart}
            onTouchEnd={handlePressEnd}
            disabled={disabled}
            className={combinedClasses}
            style={{
                ...style,
                outline: 'none',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                transform: isPressed ? `scale(${scaleDown})` : undefined,
                transition: `transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`
            }}
            {...props}
        >
            {children}
        </button>
    );
};

export default EnhancedButton;
