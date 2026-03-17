import React from 'react';

export default function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background Circle */}
      <circle cx="50" cy="50" r="45" fill="#001F3F" />
      
      {/* Target Rings */}
      <circle cx="50" cy="50" r="30" stroke="white" strokeWidth="2" />
      <circle cx="50" cy="50" r="20" stroke="white" strokeWidth="2" />
      <circle cx="50" cy="50" r="10" stroke="#FFA500" strokeWidth="4" fill="#FFA500" />
      
      {/* Arrow */}
      <line x1="80" y1="20" x2="55" y2="45" stroke="#FFA500" strokeWidth="4" strokeLinecap="round" />
      <path d="M80 20 L70 20 L80 30 Z" fill="#FFA500" />
      <path d="M55 45 L58 38 L62 42 Z" fill="#FFA500" />
    </svg>
  );
}
