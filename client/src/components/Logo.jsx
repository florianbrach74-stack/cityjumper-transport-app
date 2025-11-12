export default function Logo({ size = 'md', showText = true, className = '' }) {
  const sizes = {
    sm: { icon: 'h-12 w-auto', text: 'text-sm' },
    md: { icon: 'h-16 w-auto', text: 'text-base' },
    lg: { icon: 'h-24 w-auto', text: 'text-xl' },
    xl: { icon: 'h-32 w-auto', text: 'text-2xl' },
  };

  const currentSize = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Courierly Logo - Use PNG image */}
      <img 
        src="/courierly-logo.png" 
        alt="Courierly Logo" 
        className={`${currentSize.icon} transition-all duration-300 hover:scale-105`}
        style={{ objectFit: 'contain' }}
      />
      
      {/* Text next to logo */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={`${currentSize.text} font-bold text-gray-900 tracking-tight`}>
            Express Delivery
          </span>
        </div>
      )}
    </div>
  );
}
