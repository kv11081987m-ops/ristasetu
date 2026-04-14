import React from 'react';

const Button = ({ children, variant = 'primary', className = '', style = {}, ...props }) => {
  const baseStyle = {
    padding: '0.75rem 1.5rem',
    borderRadius: 'var(--radius-md)',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    transition: 'opacity 0.2s, background-color 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontFamily: 'inherit',
    ...style
  };

  const variants = {
    primary: {
      backgroundColor: 'var(--primary)',
      color: 'white',
    },
    secondary: {
      backgroundColor: 'var(--secondary)',
      color: 'white',
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--primary)',
      border: '1px solid var(--primary)',
    },
    danger: {
      backgroundColor: '#DC2626',
      color: 'white',
    }
  };

  const combinedStyles = { ...baseStyle, ...variants[variant] };

  return (
    <button style={combinedStyles} className={className} 
      onMouseOver={(e) => {
        if(variant !== 'outline') e.currentTarget.style.opacity = 0.9;
      }}
      onMouseOut={(e) => {
        if(variant !== 'outline') e.currentTarget.style.opacity = 1;
      }}
      {...props}>
      {children}
    </button>
  );
};

export default Button;
