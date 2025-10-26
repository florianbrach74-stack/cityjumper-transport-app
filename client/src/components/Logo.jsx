import { Zap } from 'lucide-react';

export default function Logo({ size = 'md', showText = true, className = '' }) {
  const sizes = {
    sm: { icon: 'h-6 w-6', text: 'text-lg' },
    md: { icon: 'h-8 w-8', text: 'text-2xl' },
    lg: { icon: 'h-12 w-12', text: 'text-4xl' },
    xl: { icon: 'h-16 w-16', text: 'text-5xl' },
  };

  const currentSize = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Logo Icon - Lightning bolt in circle representing speed */}
      <div className="relative">
        <div className={`${currentSize.icon} rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg transform transition-transform hover:scale-110`}>
          <Zap className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-7 w-7' : size === 'xl' ? 'h-9 w-9' : 'h-5 w-5'} text-white fill-white`} />
        </div>
        {/* Decorative ring */}
        <div className="absolute inset-0 rounded-full border-2 border-primary-300 opacity-50 animate-ping"></div>
      </div>
      
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`${currentSize.text} font-display font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent`}>
            City<span className="text-secondary-500">Jumper</span>
          </span>
          {size !== 'sm' && (
            <span className="text-xs text-gray-500 font-medium tracking-wide">
              Express Transport
            </span>
          )}
        </div>
      )}
    </div>
  );
}
