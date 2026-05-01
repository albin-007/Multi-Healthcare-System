import React from 'react';
import { motion } from 'framer-motion';

const Logo = ({ size = 'md', className = '', showText = true, variant = 'dark', textVariants = {} }) => {
  const sizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20'
  };

  const containerSizes = {
    xs: 'p-0.5 rounded-lg',
    sm: 'p-1 rounded-xl',
    md: 'p-1.5 rounded-2xl',
    lg: 'p-2 rounded-3xl',
    xl: 'p-3 rounded-[2.5rem]'
  };

  const textSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-4xl'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`
        ${sizes[size]} 
        ${containerSizes[size]}
        bg-white shadow-xl shadow-brand-teal/10 
        flex items-center justify-center 
        border border-brand-teal/10
        overflow-hidden
        transition-transform hover:scale-105 duration-300
      `}>
        <svg viewBox="0 0 100 100" className="w-full h-full p-0 overflow-visible">
          {/* Massive 'AI Home Hub Pulse' silhouette - Black & Green */}
          <motion.g
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{ originX: '50px', originY: '50px' }}
          >
            {/* The House Base - Solid BLACK */}
            <path
              d="M 15,85 H 85 V 45 L 50,15 L 15,45 Z"
              fill="#000000"
            />
            {/* The House Roof Edge - Emerald Green High-Tech Glow */}
            <path
              d="M 15,45 L 50,15 L 85,45"
              fill="none"
              stroke="#10B981"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Clinical Pulse Wave 'Heartbeat' - Emerald Green */}
            <motion.path
              d="M 20,60 H 30 L 35,45 L 45,75 L 55,40 L 60,60 H 80"
              fill="none"
              stroke="#10B981"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Central Medical Cross (+) hub - White Detail */}
            <path
              d="M 50,45 V 65 M 40,55 H 60"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
            />
            
            {/* Glowing AI Home Core - Pulsating Green node */}
            <motion.circle
              cx="50" cy="55" r="5"
              fill="#10B981"
              animate={{ filter: "brightness(2)", opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </motion.g>
        </svg>
      </div>
      
      {showText && (
        <motion.span 
          variants={textVariants}
          className={`
            ${textSizes[size]} 
            font-black tracking-tight whitespace-nowrap
          `}
        >
          <span style={{ color: variant === 'dark' ? '#000000' : '#FFFFFF' }}>care</span>
          <span style={{ color: '#10B981' }}>N</span>
          <span style={{ color: '#10B981' }}>connect</span>
        </motion.span>
      )}
    </div>
  );
};

export default Logo;
