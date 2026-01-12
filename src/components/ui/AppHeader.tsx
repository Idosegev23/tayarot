interface AppHeaderProps {
  guideName?: string;
  location?: string;
  day?: number;
  showBadge?: boolean;
}

export function AppHeader({ guideName, location, day, showBadge = true }: AppHeaderProps) {
  return (
    <header className="bg-primary text-white px-4 py-4 shadow-md">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center overflow-hidden p-2 flex-shrink-0 shadow-md">
              <img 
                src="/Logo.png" 
                alt="Agent Mary" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              {guideName && (
                <h1 className="text-lg font-semibold">{guideName}</h1>
              )}
              {location && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm opacity-90">{location}</span>
                  {day && (
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                      Day {day}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          {showBadge && (
            <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium">
              Agent Mary
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
