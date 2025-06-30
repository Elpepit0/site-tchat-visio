import '../../../index.css';
interface ActiveVisitorsIndicatorProps {
  activeVisitors: number;
}

function ActiveVisitorsIndicator({ activeVisitors }: ActiveVisitorsIndicatorProps) {
  return (
    <div className="flex items-center space-x-2 mt-4 animate-fade-in w-full sm:w-auto">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
      </span>
      <p className="text-sm text-gray-300 font-medium">
        {activeVisitors} visiteur{activeVisitors > 1 ? 's' : ''} actuellement sur le site
      </p>
    </div>
  );
}

export default ActiveVisitorsIndicator;