import React, { useState, useRef } from 'react';
import { Item } from '../types';
import { Spinner } from './Spinner';

interface ItemCardProps {
  item: Item;
  onRemove: () => void;
  onPositionChange: (pos: { x: number; y: number }) => void;
  onStartConnection: (itemId: string, e: React.MouseEvent) => void;
  onEndConnection: (itemId: string) => void;
  isCapturing: boolean;
  isViewer: boolean;
}

const ConnectionPort: React.FC<{
    position: string; 
    onMouseDown?: (e: React.MouseEvent) => void;
    onMouseUp?: (e: React.MouseEvent) => void;
    title: string;
}> = ({ position, onMouseDown, onMouseUp, title }) => (
    <div
        className={`connection-port absolute w-4 h-4 bg-[#CED2D9] dark:bg-[#464D56] rounded-full border-2 border-[#f0f3f6] dark:border-[#2a2e33] shadow-md cursor-pointer group-hover/card:opacity-100 opacity-0 transition-opacity z-20 ${position}`}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        title={title}
    />
);

export const ItemCard = React.forwardRef<HTMLDivElement, ItemCardProps>(({ item, onRemove, onPositionChange, onStartConnection, onEndConnection, isCapturing, isViewer }, ref) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const dragStartPos = useRef<{ x: number, y: number, mouseX: number, mouseY: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isViewer || (e.target as HTMLElement).closest('button, a, .no-drag, .connection-port')) {
        return;
    }
    e.preventDefault();
    e.stopPropagation();
    dragStartPos.current = {
      x: item.position.x,
      y: item.position.y,
      mouseX: e.clientX,
      mouseY: e.clientY,
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragStartPos.current) return;
    const dx = e.clientX - dragStartPos.current.mouseX;
    const dy = e.clientY - dragStartPos.current.mouseY;
    onPositionChange({
      x: dragStartPos.current.x + dx,
      y: dragStartPos.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    dragStartPos.current = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const shouldBeFlipped = isCapturing ? false : isFlipped;
  
  const name = item.rawData.Product || item.rawData.product || item.rawData.Name || item.rawData.name || 'Unnamed Item';
  const type = item.rawData.Type || item.rawData.type;
  
  const handlePortMouseUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEndConnection(item.id);
  };

  const renderFrontContent = () => {
    if (item.isAnalyzing) {
        return (
            <div className="flex flex-col items-center justify-center p-4 min-h-[80px]">
                <Spinner className="h-6 w-6" />
                <p className="text-xs text-center text-[#464D56] dark:text-[#CED2D9] mt-2">Analyzing item...</p>
            </div>
        );
    }
    if (item.analysisError) {
        return (
            <div className="p-3 text-center min-h-[80px] flex flex-col justify-center">
                <p className="text-xs text-red-700 dark:text-red-400 font-bold">Analysis Error</p>
                <p className="text-xs text-red-600 dark:text-red-400/80 mt-1" title={item.analysisError}>Could not extract keywords.</p>
            </div>
        );
    }
    if (item.analyzedData) {
        return (
            <div className="p-3 min-h-[80px]">
                <h4 className="text-xs font-semibold text-[#464D56] dark:text-[#CED2D9] mb-1.5">AI Keywords</h4>
                <div className="flex flex-wrap gap-1.5">
                    {item.analyzedData.keywords.map((kw, idx) => (
                        <span key={idx} className="bg-[#E0E5EC] dark:bg-[#212428] text-[#212428] dark:text-[#E0E5EC] text-xs font-medium px-2 py-0.5 rounded-full">
                            {kw}
                        </span>
                    ))}
                </div>
            </div>
        );
    }
    return <div className="p-3 min-h-[80px] text-center text-xs text-gray-400">No analysis available.</div>;
  };

  return (
    <div 
        ref={ref}
        className="w-64 absolute select-none group/card"
        style={{ left: item.position.x, top: item.position.y, perspective: '1000px', cursor: isViewer ? 'default' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseUp={() => onEndConnection(item.id)}
    >
        {!isViewer && (
            <>
                <ConnectionPort position="top-1/2 -left-2 -translate-y-1/2" title="Connect a node here" onMouseUp={handlePortMouseUp}/>
                <ConnectionPort position="top-1/2 -right-2 -translate-y-1/2" title="Connect a node here" onMouseUp={handlePortMouseUp}/>
                <ConnectionPort position="-top-2 left-1/2 -translate-x-1/2" title="Connect a node here" onMouseUp={handlePortMouseUp}/>
                <ConnectionPort 
                    position="-bottom-2 left-1/2 -translate-x-1/2" 
                    title="Drag to connect"
                    onMouseDown={(e) => { e.stopPropagation(); onStartConnection(item.id, e); }}
                />
            </>
        )}


        <div 
            className={`relative w-full [transform-style:preserve-3d] ${!isCapturing ? 'transition-transform duration-500' : ''}`}
            style={{ transform: shouldBeFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
            {/* Front Face */}
            <div className="w-full [backface-visibility:hidden]">
                <div className="relative bg-[#f0f3f6] dark:bg-[#2a2e33] rounded-xl shadow-lg flex flex-col border border-[#CED2D9] dark:border-[#464D56] w-full overflow-hidden">
                    <div className="p-3 bg-[#E0E5EC] dark:bg-[#212428] relative">
                         <h3 className="font-bold text-base text-[#212428] dark:text-[#E0E5EC] truncate" title={String(name)}>{String(name)}</h3>
                         {type && <p className="text-xs text-[#464D56] dark:text-[#CED2D9] uppercase tracking-wider">{String(type)}</p>}
                         {!isViewer && (
                             <button
                                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                                className="absolute top-2 right-2 bg-black/40 text-white rounded-full p-1.5 hover:bg-black/70 transition-colors focus:outline-none focus:ring-2 focus:ring-[#44A0D1] dark:focus:ring-[#54C1FB] z-10"
                                aria-label="Remove item"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                         )}
                    </div>
                    <div className="no-drag">
                        {renderFrontContent()}
                    </div>

                    <div className="text-center border-t border-[#CED2D9] dark:border-[#464D56] bg-[#E0E5EC]/70 dark:bg-[#2a2e33]/50 no-drag">
                        <button 
                            onClick={() => setIsFlipped(true)}
                            className="w-full px-3 py-1.5 text-xs text-[#464D56] hover:text-[#44A0D1] dark:text-[#CED2D9] dark:hover:text-[#54C1FB] flex items-center justify-center gap-1 mx-auto"
                            title="View raw data"
                        >
                            <span>View Raw Data</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Back Face */}
            <div className={`absolute top-0 left-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] no-drag ${isCapturing ? 'hidden' : ''}`}>
                <div className="bg-[#f0f3f6] dark:bg-[#2a2e33] rounded-xl shadow-lg flex flex-col border border-[#CED2D9] dark:border-[#464D56] w-full h-full">
                    <div className="p-3 flex-grow overflow-y-auto space-y-3">
                        <h3 className="text-sm font-bold text-center text-[#212428] dark:text-[#E0E5EC]">Raw CSV Data</h3>
                        {Object.entries(item.rawData).map(([key, value]) => (
                            <div key={key}>
                                <h4 className="text-xs font-semibold text-[#44A0D1] dark:text-[#54C1FB]">{key}</h4>
                                <p className="text-xs text-[#464D56] dark:text-[#CED2D9] leading-relaxed bg-[#E0E5EC] dark:bg-[#212428] p-2 rounded-md whitespace-pre-wrap">{String(value)}</p>
                            </div>
                        ))}
                    </div>
                    <div className="text-center border-t border-[#CED2D9] dark:border-[#464D56] bg-[#E0E5EC]/70 dark:bg-[#2a2e33]/50 rounded-b-xl">
                        <button 
                            onClick={() => setIsFlipped(false)}
                            className="w-full px-3 py-1.5 text-xs text-[#464D56] hover:text-[#44A0D1] dark:text-[#CED2D9] dark:hover:text-[#54C1FB] flex items-center justify-center gap-1 mx-auto"
                            title="Return to summary"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6-6m-6 6l6 6" /></svg>
                            <span>Return to Summary</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
});
ItemCard.displayName = 'ItemCard';