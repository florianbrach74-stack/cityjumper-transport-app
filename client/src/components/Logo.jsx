export default function Logo({ size = 'md', showText = true, className = '' }) {
  const sizes = {
    sm: { icon: 'h-14 w-auto', text: 'text-base', subtitle: 'text-xs' },
    md: { icon: 'h-20 w-auto', text: 'text-xl', subtitle: 'text-sm' },
    lg: { icon: 'h-28 w-auto', text: 'text-3xl', subtitle: 'text-base' },
    xl: { icon: 'h-36 w-auto', text: 'text-4xl', subtitle: 'text-lg' },
  };

  const currentSize = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center space-x-4 ${className} group`}>
      {/* Courierly Logo with glow effect */}
      <div className="relative">
        <img 
          src="/courierly-logo.png" 
          alt="Courierly Logo" 
          className={`${currentSize.icon} transition-all duration-300 group-hover:scale-110 drop-shadow-lg`}
          style={{ objectFit: 'contain' }}
        />
        {/* Subtle glow on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-400/0 via-secondary-400/20 to-primary-400/0 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
      </div>
      
      {/* Text next to logo with gradient */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={`${currentSize.text} font-extrabold bg-gradient-to-r from-gray-900 via-primary-700 to-gray-900 bg-clip-text text-transparent tracking-tight`}>
            Courierly
          </span>
          <span className={`${currentSize.subtitle} font-semibold text-secondary-600 tracking-wide uppercase`}>
            Express Delivery
          </span>
        </div>
      )}
    </div>
  );
}
