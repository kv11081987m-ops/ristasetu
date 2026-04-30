import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({ children, variant = 'primary', className = '', style = {}, loading = false, disabled = false, ...props }) => {
  const isButtonDisabled = loading || disabled;

  const baseStyle = {
    padding: '0.75rem 1.5rem',
    borderRadius: 'var(--radius-md)',
    fontWeight: '600',
    border: 'none',
    cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontFamily: 'inherit',
    opacity: isButtonDisabled ? 0.7 : 1,
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
    <button 
      style={combinedStyles} 
      className={className} 
      disabled={isButtonDisabled}
      onMouseOver={(e) => {
        if (!isButtonDisabled) {
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          if(variant !== 'outline') e.currentTarget.style.backgroundColor = 'var(--primary-hover)';
        }
      }}
      onMouseOut={(e) => {
        if (!isButtonDisabled) {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = 'none';
          if(variant !== 'outline') e.currentTarget.style.backgroundColor = combinedStyles.backgroundColor;
        }
      }}
      {...props}>
      {loading ? (
        <>
          <Loader2 className="animate-spin" size={18} />
          <span>Processing...</span>
        </>
      ) : children}
    </button>
  );
};

export default Button;
