import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "success" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
  isLoading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  isLoading = false,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#090e1a] disabled:opacity-50 disabled:pointer-events-none cursor-pointer";
  
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-900/20",
    secondary: "bg-[var(--muted-dark)] hover:bg-[#3d4d68] text-white",
    outline: "border border-[var(--card-border)] bg-transparent hover:bg-[var(--card-bg)] text-slate-300 hover:text-white",
    ghost: "bg-transparent hover:bg-[var(--card-bg)] text-slate-400 hover:text-white",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-950/20",
    danger: "bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-950/20",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="mr-2 h-4 w-4 animate-spin text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
