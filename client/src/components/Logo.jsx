export default function Logo({ size = 'md', showText = true, className = '' }) {
  const sizes = {
    sm: { icon: 'h-8 w-8', text: 'text-lg' },
    md: { icon: 'h-12 w-12', text: 'text-2xl' },
    lg: { icon: 'h-16 w-16', text: 'text-4xl' },
    xl: { icon: 'h-24 w-24', text: 'text-5xl' },
  };

  const currentSize = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* CityJumper Logo - Location Pin with Arrow */}
      <div className="relative">
        <svg 
          className={`${currentSize.icon} transition-transform hover:scale-110`}
          viewBox="0 0 200 200" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Glow effect */}
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Location Pin - Outer Circle (Light Blue) */}
          <circle 
            cx="100" 
            cy="85" 
            r="50" 
            fill="none" 
            stroke="#7dd3fc" 
            strokeWidth="8"
            strokeLinecap="round"
            filter="url(#glow)"
          />
          
          {/* Location Pin - Bottom Point */}
          <path 
            d="M 100 135 L 85 110 A 50 50 0 0 1 115 110 Z" 
            fill="#7dd3fc"
            filter="url(#glow)"
          />
          
          {/* Arrow (Orange) - Curved upward representing speed/jump */}
          <path 
            d="M 75 95 Q 90 70 110 80 L 120 70 L 115 85 L 130 80 L 110 90 Q 85 100 75 95 Z" 
            fill="#f59e0b"
            filter="url(#glow)"
          />
          
          {/* Speed Lines (Light Blue) */}
          <line x1="50" y1="120" x2="70" y2="120" stroke="#7dd3fc" strokeWidth="4" strokeLinecap="round" opacity="0.8"/>
          <line x1="45" y1="130" x2="70" y2="130" stroke="#7dd3fc" strokeWidth="4" strokeLinecap="round" opacity="0.6"/>
          <line x1="40" y1="140" x2="65" y2="140" stroke="#7dd3fc" strokeWidth="4" strokeLinecap="round" opacity="0.4"/>
        </svg>
      </div>
      
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`${currentSize.text} font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-600`}>
            CITY<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">JUMPER</span>
          </span>
          {size !== 'sm' && (
            <span className="text-xs text-gray-500 font-medium tracking-wide mt-1">
              Express Transport
            </span>
          )}
        </div>
      )}
    </div>
  );
}
