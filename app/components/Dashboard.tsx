import { ReactNode } from 'react';
import DashboardHeader from './DashboardHeader';

interface DashboardProps {
  children: ReactNode;
}

export default function Dashboard({ children }: DashboardProps) {
  return (
    <div className="h-dvh bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black flex flex-col overflow-hidden">
      <DashboardHeader />
      
      <div className="flex-1 min-h-0 flex flex-col">
        {children}
      </div>
    </div>
  );
}
