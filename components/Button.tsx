import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'normal' | 'large';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'normal',
  className = '', 
  ...props 
}) => {
  const baseStyles = "font-bold rounded-xl transition-colors duration-200 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-offset-2";
  
  const variants = {
    primary: "bg-emerald-700 hover:bg-emerald-800 text-white focus:ring-emerald-500 shadow-md",
    secondary: "bg-blue-700 hover:bg-blue-800 text-white focus:ring-blue-500 shadow-md",
    outline: "border-2 border-slate-400 hover:bg-slate-100 text-slate-700 focus:ring-slate-400",
  };

  const sizes = {
    normal: "px-6 py-3 text-lg",
    large: "px-8 py-5 text-xl",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className} disabled:opacity-50 disabled:cursor-not-allowed`}
      {...props}
    >
      {children}
    </button>
  );
};
