export default function Logo({ size = 'md', showText = true, className = '' }) {
  const sizes = {
    sm: { icon: 'h-10 w-10', text: 'text-xl' },
    md: { icon: 'h-12 w-12', text: 'text-2xl' },
    lg: { icon: 'h-20 w-20', text: 'text-4xl' },
    xl: { icon: 'h-28 w-28', text: 'text-6xl' },
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
