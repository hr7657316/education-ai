
import React from 'react';

interface ControlButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  color?: 'green' | 'red' | 'gray';
  disabled?: boolean;
}

export const ControlButton: React.FC<ControlButtonProps> = ({
  onClick,
  children,
  color = 'green',
  disabled = false
}) => {
  const colorClasses = {
    green: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
    red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    gray: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500',
  };

  const baseClasses = "w-full text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors duration-200";
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${colorClasses[color]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
};
