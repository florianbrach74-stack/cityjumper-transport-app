export default function Logo({ size = 'md', showText = true, className = '' }) {
  const sizes = {
    sm: { icon: 'h-10 w-10', text: 'text-xl' },
    md: { icon: 'h-12 w-12', text: 'text-2xl' },
    lg: { icon: 'h-20 w-20', text: 'text-4xl' },
    xl: { icon: 'h-28 w-28', text: 'text-6xl' },
  };

  const currentSize = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Courierly Logo - Package with Speed Arrow */}
      <div className="relative group">
        <svg 
          className={`${currentSize.icon} transition-all duration-300 group-hover:scale-110 drop-shadow-lg`}
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Glow effects */}
            <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="glow-orange" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Package icon (black) */}
          <g>
            {/* Top line */}
            <rect x="40" y="20" width="20" height="3" rx="1.5" fill="#000000"/>
            
            {/* Package outline */}
            <rect x="25" y="15" width="50" height="50" rx="8" 
                  fill="none" stroke="#000000" strokeWidth="4" strokeLinecap="round"/>
            
            {/* Left lines (black) */}
            <rect x="30" y="35" width="15" height="3" rx="1.5" fill="#000000"/>
            <rect x="30" y="45" width="15" height="3" rx="1.5" fill="#000000"/>
            <rect x="30" y="55" width="15" height="3" rx="1.5" fill="#000000"/>
          </g>
          
          {/* Arrow (orange) */}
          <g filter="url(#glow-orange)">
            {/* Arrow shaft lines (orange) */}
            <rect x="45" y="35" width="25" height="3" rx="1.5" fill="#FF9500"/>
            <rect x="45" y="43" width="25" height="3" rx="1.5" fill="#FF9500"/>
            <rect x="45" y="51" width="25" height="3" rx="1.5" fill="#FF9500"/>
            
            {/* Arrow head */}
            <path d="M 68 35 L 80 43 L 68 51 Z" fill="#FF9500"/>
          </g>
          
          {/* Speed effect (black) */}
          <g opacity="0.6">
            <line x1="15" y1="75" x2="30" y2="75" stroke="#000000" strokeWidth="2" strokeLinecap="round"/>
            <line x1="10" y1="82" x2="28" y2="82" stroke="#000000" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
          </g>
        </svg>
      </div>
      
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={`${currentSize.text} font-display font-extrabold tracking-tight text-gray-900`}>
            Courierly
          </span>
          {size !== 'sm' && (
            <span className="text-xs text-gray-500 font-semibold tracking-wider uppercase mt-0.5">
              Express Delivery
            </span>
          )}
        </div>
      )}
    </div>
  );
}
