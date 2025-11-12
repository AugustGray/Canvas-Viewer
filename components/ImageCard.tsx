import React, { useState, useCallback, useRef } from 'react';
import { AnalyzedImage, NodeType } from '../types';
import { AnalysisDisplay } from './AnalysisDisplay';
import { Spinner } from './Spinner';

interface ImageCardProps {
  image: AnalyzedImage;
  onRemove: () => void;
  onPositionChange: (pos: { x: number; y: number }) => void;
  onStartConnection: (imageId: string, e: React.MouseEvent) => void;
  isCapturing: boolean;
  isViewer: boolean;
}

export const ImageCard = React.forwardRef<HTMLDivElement, ImageCardProps>(({ image, onRemove, onPositionChange, onStartConnection, isCapturing, isViewer }, ref) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const dragStartPos = useRef<{ x: number, y: number, mouseX: number, mouseY: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isViewer || (e.target as HTMLElement).closest('button, .connection-port, a, .no-drag')) {
        return;
    }
    e.preventDefault();
    e.stopPropagation();
    dragStartPos.current = {
      x: image.position.x,
      y: image.position.y,
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
  
  const keywordNodeTypes = ['Color Palette', 'Style', 'Texture'];
  const results = Object.keys(image.results)
      .map(nodeType => ({ nodeType, nodeAnalysis: image.results[nodeType as NodeType] }))
      .filter(item => item.nodeAnalysis && (item.nodeAnalysis.analysis || item.nodeAnalysis.isLoading || item.nodeAnalysis.error));

  const keywordAnalyses = results.filter(item => keywordNodeTypes.includes(item.nodeType));
  const descriptionAnalyses = results.filter(item => !keywordNodeTypes.includes(item.nodeType));

  const hasKeywords = keywordAnalyses.length > 0;
  const hasDescriptions = descriptionAnalyses.length > 0;

  const shouldBeFlipped = isCapturing ? false : isFlipped;

  return (
    <div 
        ref={ref}
        className="w-64 absolute select-none group/card"
        style={{ left: image.position.x, top: image.position.y, perspective: '1000px', cursor: isViewer ? 'default' : 'grab' }}
        onMouseDown={handleMouseDown}
    >
        <div 
            className={`relative w-full [transform-style:preserve-3d] ${!isCapturing ? 'transition-transform duration-500' : ''}`}
            style={{ transform: shouldBeFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
            {/* Front Face */}
            <div className="w-full [backface-visibility:hidden]">
                <div className="relative bg-[#f0f3f6] dark:bg-[#2a2e33] rounded-xl shadow-lg flex flex-col border border-[#CED2D9] dark:border-[#464D56] w-full overflow-hidden">
                    <div className="relative w-full bg-[#E0E5EC] dark:bg-[#212428] image-container-for-connection">
                        {!isViewer && (
                          <>
                            <div
                                className="connection-port absolute top-1/2 -left-2 transform -translate-y-1/2 w-4 h-4 bg-[#44A0D1] dark:bg-[#54C1FB] rounded-full border-2 border-white dark:border-[#2a2e33] shadow-md cursor-pointer hover:scale-125 transition-transform z-20"
                                onMouseDown={(e) => { e.stopPropagation(); onStartConnection(image.id, e); }}
                                title="Drag to connect"
                            />
                            <div
                                className="connection-port absolute top-1/2 -right-2 transform -translate-y-1/2 w-4 h-4 bg-[#44A0D1] dark:bg-[#54C1FB] rounded-full border-2 border-white dark:border-[#2a2e33] shadow-md cursor-pointer hover:scale-125 transition-transform z-20"
                                onMouseDown={(e) => { e.stopPropagation(); onStartConnection(image.id, e); }}
                                title="Drag to connect"
                            />
                          </>
                        )}

                        <img src={image.imageDataUrl} className="w-full h-auto block rounded-t-xl" alt="User upload" draggable="false"/>
                        
                        {!isViewer && (
                          <button
                              onClick={(e) => { e.stopPropagation(); onRemove(); }}
                              className="absolute top-2 left-2 bg-black/40 text-white rounded-full p-1.5 hover:bg-black/70 transition-colors focus:outline-none focus:ring-2 focus:ring-[#44A0D1] dark:focus:ring-[#54C1FB] z-10"
                              aria-label="Remove image"
                          >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                          </button>
                        )}
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsCollapsed(prev => !prev); }}
                            className="absolute bottom-2 right-2 bg-black/40 text-white rounded-full p-1 hover:bg-black/70 transition-colors focus:outline-none focus:ring-2 focus:ring-[#44A0D1] dark:focus:ring-[#54C1FB] z-10"
                            aria-label={isCollapsed ? "Expand card" : "Collapse card"}
                            title={isCollapsed ? "Expand" : "Collapse"}
                        >
                             {isCollapsed ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                                </svg>
                             ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                             )}
                        </button>
                    </div>
                    
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? 'max-h-0' : 'max-h-[500px]'}`}>
                        {hasKeywords && (
                            <div className="p-3 flex-grow space-y-3 no-drag">
                                {keywordAnalyses.map(({ nodeType, nodeAnalysis }) => (
                                    <div key={nodeType}>
                                        {nodeAnalysis.isLoading ? (
                                            <div className="flex items-center gap-2 p-2 bg-[#E0E5EC] dark:bg-[#212428] rounded-md">
                                                <Spinner className="h-4 w-4" />
                                                <span className="text-xs font-semibold text-[#464D56] dark:text-[#CED2D9]">Analyzing {nodeType}...</span>
                                            </div>
                                        ) : nodeAnalysis.error ? (
                                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-md">
                                                <p className="text-xs text-red-700 dark:text-red-400 font-bold">{nodeType} Error</p>
                                                <p className="text-xs text-red-600 dark:text-red-400/80">{nodeAnalysis.error}</p>
                                            </div>
                                        ) : nodeAnalysis.analysis ? (
                                            <AnalysisDisplay nodeType={nodeType} analysis={nodeAnalysis.analysis} />
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        )}

                        {hasDescriptions && (
                            <div className="text-center border-t border-[#CED2D9] dark:border-[#464D56] bg-[#E0E5EC]/70 dark:bg-[#2a2e33]/50 no-drag">
                                <button 
                                    onClick={() => setIsFlipped(true)}
                                    className="w-full px-3 py-1.5 text-xs text-[#464D56] hover:text-[#44A0D1] dark:text-[#CED2D9] dark:hover:text-[#54C1FB] flex items-center justify-center gap-1 mx-auto"
                                    title="View details"
                                >
                                    <span>View AI Descriptions</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Back Face */}
            <div className={`absolute top-0 left-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] no-drag ${isCapturing ? 'hidden' : ''}`}>
                <div className="bg-[#f0f3f6] dark:bg-[#2a2e33] rounded-xl shadow-lg flex flex-col border border-[#CED2D9] dark:border-[#464D56] w-full h-full">
                    <div className="p-3 flex-grow overflow-y-auto space-y-3">
                        <h3 className="text-sm font-bold text-center text-[#212428] dark:text-[#E0E5EC]">AI Descriptions</h3>
                        {descriptionAnalyses.map(({ nodeType, nodeAnalysis }) => (
                            <div key={nodeType}>
                                {nodeAnalysis.isLoading ? (
                                    <div className="flex items-center gap-2 p-2 bg-[#E0E5EC] dark:bg-[#212428] rounded-md">
                                        <Spinner className="h-4 w-4" />
                                        <span className="text-xs font-semibold text-[#464D56] dark:text-[#CED2D9]">Analyzing {nodeType}...</span>
                                    </div>
                                ) : nodeAnalysis.error ? (
                                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-md">
                                        <p className="text-xs text-red-700 dark:text-red-400 font-bold">{nodeType} Error</p>
                                        <p className="text-xs text-red-600 dark:text-red-400/80">{nodeAnalysis.error}</p>
                                    </div>
                                ) : nodeAnalysis.analysis ? (
                                    <AnalysisDisplay nodeType={nodeType} analysis={nodeAnalysis.analysis} />
                                ) : null}
                            </div>
                        ))}
                    </div>
                    <div className="text-center border-t border-[#CED2D9] dark:border-[#464D56] bg-[#E0E5EC]/70 dark:bg-[#2a2e33]/50 rounded-b-xl">
                        <button 
                            onClick={() => setIsFlipped(false)}
                            className="w-full px-3 py-1.5 text-xs text-[#464D56] hover:text-[#44A0D1] dark:text-[#CED2D9] dark:hover:text-[#54C1FB] flex items-center justify-center gap-1 mx-auto"
                            title="Return to image"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6-6m-6 6l6 6" /></svg>
                            <span>Return to Image</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
});
ImageCard.displayName = 'ImageCard';