export default function Logo({ size = 'md', showText = true, className = '' }) {
  const sizes = {
    sm: { icon: 'h-24 w-24', text: 'text-xl' },
    md: { icon: 'h-48 w-48', text: 'text-2xl' },
    lg: { icon: 'h-64 w-64', text: 'text-4xl' },
    xl: { icon: 'h-80 w-80', text: 'text-6xl' },
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
