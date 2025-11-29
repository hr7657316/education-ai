import React from 'react';

interface CollapsiblePanelProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({
  isOpen,
  onClose,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Sliding Panel - No backdrop */}
      <div
        className={`fixed left-24 top-0 bottom-0 w-96 bg-white shadow-lg z-[95] transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Close Button - Small arrow tab on RIGHT edge, aligned with top header */}
        <button
          onClick={onClose}
          className="absolute right-0 top-0 w-8 h-10 bg-gray-200 flex items-center justify-center transition-all duration-200 rounded-l-md z-20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Panel Content - Added top padding to prevent content from hiding behind controls */}
        <div className="h-full overflow-y-auto pt-16 px-3 pb-24">
          {children}
        </div>
      </div>
    </>
  );
};
