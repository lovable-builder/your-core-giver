import React from 'react';
import { cn } from '@/lib/utils';

interface ConsoleButtonProps {
  label: string;
  zone: string;
  color: string;
  isActive?: boolean;
  description?: string;
  className?: string;
}

const ConsoleButton: React.FC<ConsoleButtonProps> = ({ 
  label, 
  zone, 
  color, 
  isActive = false, 
  description,
  className 
}) => {
  // Convert hex color to CSS custom property
  const buttonStyle = {
    '--button-color': color,
    '--button-glow': isActive ? `${color}80` : 'transparent'
  } as React.CSSProperties;

  return (
    <div className={cn("console-button-container", className)}>
      <div 
        className="console-button"
        style={buttonStyle}
        data-active={isActive}
      >
        <div className="console-button-face">
          <span className="console-button-label">{label}</span>
        </div>
        <div className="console-button-glow" />
      </div>
      {description && (
        <div className="console-button-description">
          {description}
        </div>
      )}
    </div>
  );
};

export default ConsoleButton;