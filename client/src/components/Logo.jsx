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
      {/* CityJumper Logo - Modern Location Pin with Dynamic Arrow */}
      <div className="relative group">
        <svg 
          className={`${currentSize.icon} transition-all duration-300 group-hover:scale-110 drop-shadow-lg`}
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradient for Pin */}
            <linearGradient id="pinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
            
            {/* Gradient for Arrow */}
            <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
            
            {/* Glow effect */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Location Pin Shape */}
          <g filter="url(#glow)">
            {/* Pin Circle */}
            <circle 
              cx="50" 
              cy="35" 
              r="20" 
              fill="url(#pinGradient)"
              stroke="#0284c7"
              strokeWidth="2"
            />
            
            {/* Pin Point */}
            <path 
              d="M 50 55 L 40 42 Q 50 38 60 42 Z" 
              fill="url(#pinGradient)"
              stroke="#0284c7"
              strokeWidth="1.5"
            />
            
            {/* Inner Circle (white) */}
            <circle 
              cx="50" 
              cy="35" 
              r="12" 
              fill="white"
              opacity="0.9"
            />
            
            {/* Dynamic Arrow Inside Pin */}
            <path 
              d="M 45 38 L 50 28 L 55 38 M 50 28 L 50 42" 
              stroke="url(#arrowGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          
          {/* Speed Lines */}
          <g opacity="0.7">
            <line x1="20" y1="60" x2="35" y2="60" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round"/>
            <line x1="15" y1="68" x2="35" y2="68" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" opacity="0.7"/>
            <line x1="10" y1="76" x2="30" y2="76" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
          </g>
        </svg>
      </div>
      
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={`${currentSize.text} font-display font-extrabold tracking-tight`}>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-sky-600">
              City
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">
              Jumper
            </span>
          </span>
          {size !== 'sm' && (
            <span className="text-xs text-gray-500 font-semibold tracking-wider uppercase mt-0.5">
              Express Transport
            </span>
          )}
        </div>
      )}
    </div>
  );
}
