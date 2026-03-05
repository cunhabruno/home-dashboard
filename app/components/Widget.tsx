import { ReactNode } from 'react';

interface WidgetContainerProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export default function WidgetContainer({ title, children, className = '' }: WidgetContainerProps) {
  return (
    <div className={`h-full flex flex-col bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-6 border border-zinc-200 dark:border-zinc-800 ${className}`}>
      <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-zinc-100 flex-shrink-0">
        {title}
      </h2>
      <div className="text-zinc-700 dark:text-zinc-300 flex-1 min-h-0 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
