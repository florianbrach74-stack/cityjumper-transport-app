export default function Logo({ size = 'md', showText = true, className = '' }) {
  const sizes = {
    sm: { icon: 'h-16 w-16', text: 'text-xl' },
    md: { icon: 'h-24 w-24', text: 'text-2xl' },
    lg: { icon: 'h-32 w-32', text: 'text-4xl' },
    xl: { icon: 'h-40 w-40', text: 'text-6xl' },
  };

  const currentSize = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center ${className}`}>
      {/* Courierly Logo - Use PNG image */}
      <img 
        src="/courierly-logo.png" 
        alt="Courierly Logo" 
        className={`${currentSize.icon} transition-all duration-300 hover:scale-105`}
        style={{ height: 'auto', objectFit: 'contain' }}
      />
    </div>
  );
}
