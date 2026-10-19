import Header from '../components/dashboard/Header';
import PomodoroCard from '../components/dashboard/PomodoroCard';
import SyllabusCard from '../components/dashboard/SyllabusCard';
import TargetsCard from '../components/dashboard/TargetsCard';
import MediaCard from '../components/dashboard/MediaCard';

interface DashboardProps {
  onNavigateRevise: () => void;
}

export default function Dashboard({ onNavigateRevise }: DashboardProps) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Header onNavigateRevise={onNavigateRevise} />
      <div className="flex-1 p-4 grid grid-cols-2 grid-rows-2 gap-4 overflow-hidden">
        <PomodoroCard />
        <SyllabusCard />
        <TargetsCard />
        <MediaCard />
      </div>
    </div>
  );
}
