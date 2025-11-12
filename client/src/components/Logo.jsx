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
          className={`${currentSize.icon} transition-all duration-300 group-hover:scale-110`}
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Package Box - Black outline with rounded corners */}
          <rect x="20" y="20" width="50" height="50" rx="10" 
                fill="none" stroke="#000000" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
          
          {/* Top handle line on package */}
          <line x1="35" y1="25" x2="55" y2="25" stroke="#000000" strokeWidth="3" strokeLinecap="round"/>
          
          {/* Left speed lines - Black */}
          <line x1="15" y1="40" x2="30" y2="40" stroke="#000000" strokeWidth="3" strokeLinecap="round"/>
          <line x1="15" y1="50" x2="30" y2="50" stroke="#000000" strokeWidth="3" strokeLinecap="round"/>
          <line x1="15" y1="60" x2="30" y2="60" stroke="#000000" strokeWidth="3" strokeLinecap="round"/>
          
          {/* Right speed lines - Orange */}
          <line x1="50" y1="40" x2="70" y2="40" stroke="#FF9500" strokeWidth="3" strokeLinecap="round"/>
          <line x1="50" y1="50" x2="70" y2="50" stroke="#FF9500" strokeWidth="3" strokeLinecap="round"/>
          <line x1="50" y1="60" x2="70" y2="60" stroke="#FF9500" strokeWidth="3" strokeLinecap="round"/>
          
          {/* Arrow head - Orange */}
          <path d="M 70 35 L 85 50 L 70 65 Z" fill="#FF9500"/>
          
          {/* Bottom speed lines - Black */}
          <line x1="10" y1="80" x2="25" y2="80" stroke="#000000" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
          <line x1="5" y1="88" x2="22" y2="88" stroke="#000000" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
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
