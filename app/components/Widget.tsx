import { ReactNode } from 'react';

interface WidgetContainerProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export default function WidgetContainer({ title, children, className = '' }: WidgetContainerProps) {
  return (
    <div className={`bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-6 border border-zinc-200 dark:border-zinc-800 ${className}`}>
      <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-zinc-100">
        {title}
      </h2>
      <div className="text-zinc-700 dark:text-zinc-300">
        {children}
      </div>
    </div>
  );
}
