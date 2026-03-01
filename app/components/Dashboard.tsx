import { ReactNode } from 'react';

interface DashboardProps {
  children: ReactNode;
}

export default function Dashboard({ children }: DashboardProps) {
  return (
    <div className="h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black flex flex-col">
      <div className="flex-1 flex flex-col px-4 py-4 overflow-hidden">
        <header className="mb-3 flex-shrink-0">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Home Dashboard
          </h1>
        </header>
        
        <div className="flex-1 min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
}
