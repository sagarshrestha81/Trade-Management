import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
}

export function Card({ children, className = "", glass = false, ...props }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-lg ${
        glass ? "glass-card" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`mb-4 flex items-center justify-between ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "", ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`text-lg font-semibold tracking-tight text-white ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = "", ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-sm text-[var(--muted)] ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`${className}`} {...props}>{children}</div>;
}
