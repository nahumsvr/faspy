import React, { ButtonHTMLAttributes, forwardRef } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'inverted' | 'outlined';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white shadow-sm hover:opacity-90',
  secondary: 'bg-secondary text-white shadow-sm hover:opacity-90',
  inverted: 'bg-gray-900 text-white shadow-sm hover:bg-gray-800', // Fondo oscuro con texto claro
  outlined: 'bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-white',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`font-sans inline-flex items-center justify-center px-6 py-2.5 rounded-full font-medium transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
