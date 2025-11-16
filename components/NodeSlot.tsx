import React, { useRef, useState, useEffect } from 'react';
import { OutputNodeState, ContextNodeData } from '../types';
import { Spinner } from './Spinner';

interface NodeProps {
    nodeId: string;
    nodeName: string;
    isOutput: boolean;
    position: { x: number; y: number; };
    onPositionChange: (pos: { x: number; y: number; }) => void;
    onEndConnection: () => void;
    onStartConnection: (nodeId: string, e: React.MouseEvent | React.TouchEvent) => void;
    connectedIds: string[];
    onDisconnect: (fromId: string) => void;
    onRemove: () => void;
    outputState?: OutputNodeState;
    onGenerateOutput?: (nodeId: string) => void;
    onSetOutputNodeMode?: (nodeId: string, mode: 'consolidated' | 'double-output') => void;
    contextData?: ContextNodeData;
    onUpdateNodeContext?: (nodeId: string, text: string) => void;
    isViewer: boolean;
}

const ConnectionPort: React.FC<{position: string; onMouseDown?: (e: React.MouseEvent) => void; onTouchStart?: (e: React.TouchEvent) => void; title: string}> = ({ position, onMouseDown, onTouchStart, title }) => (
    <div 
        className={`connection-port absolute w-4 h-4 bg-[#CED2D9] dark:bg-[#464D56] rounded-full border-2 border-[#f0f3f6] dark:border-[#2a2e33] shadow-md cursor-pointer hover:bg-[#44A0D1] dark:hover:bg-[#54C1FB] transition-colors ${position}`} 
        title={title}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
    />
);

export const Node = React.forwardRef<HTMLDivElement, NodeProps>(({ nodeId, nodeName, isOutput, position, onPositionChange, onEndConnection, onStartConnection, connectedIds, onDisconnect, onRemove, outputState, onGenerateOutput, onSetOutputNodeMode, contextData, onUpdateNodeContext, isViewer }, ref) => {
    const dragStartPos = useRef<{ x: number, y: number, mouseX: number, mouseY: number } | null>(null);
    const [isFlipped, setIsFlipped] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleDragStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        if (isViewer || (e.target as HTMLElement).closest('.connection-port, button, textarea, .no-drag')) return;
        e.preventDefault();
        e.stopPropagation();

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        dragStartPos.current = { x: position.x, y: position.y, mouseX: clientX, mouseY: clientY };

        if ('touches' in e) {
            document.addEventListener('touchmove', handleDragMove);
            document.addEventListener('touchend', handleDragEnd);
        } else {
            document.addEventListener('mousemove', handleDragMove);
            document.addEventListener('mouseup', handleDragEnd);
        }
    };
    const handleDragMove = (e: MouseEvent | TouchEvent) => {
        if (!dragStartPos.current) return;
        
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        const dx = clientX - dragStartPos.current.mouseX;
        const dy = clientY - dragStartPos.current.mouseY;
        onPositionChange({ x: dragStartPos.current.x + dx, y: dragStartPos.current.y + dy });
    };
    const handleDragEnd = () => {
        dragStartPos.current = null;
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
        document.removeEventListener('touchmove', handleDragMove);
        document.removeEventListener('touchend', handleDragEnd);
    };

     useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            const scrollHeight = textarea.scrollHeight;
            const maxHeight = 150;

            if (scrollHeight > maxHeight) {
                textarea.style.height = `${maxHeight}px`;
                textarea.style.overflowY = 'auto';
            } else {
                textarea.style.height = `${scrollHeight}px`;
                textarea.style.overflowY = 'hidden';
            }
        }
    }, [contextData?.text]);

    const handleModeToggle = () => {
        if (onSetOutputNodeMode && outputState) {
            const newMode = outputState.mode === 'consolidated' ? 'double-output' : 'consolidated';
            onSetOutputNodeMode(nodeId, newMode);
        }
    };

    const handleNodeMouseUp = () => onEndConnection();
    const handleNodeTouchEnd = () => onEndConnection();

    if (nodeName === 'Context' && contextData && onUpdateNodeContext) {
        return (
            <div ref={ref} className="absolute select-none group/card w-64" style={{ left: position.x, top: position.y, cursor: isViewer ? 'default' : 'grab' }} onMouseDown={handleDragStart} onTouchStart={handleDragStart} onMouseUp={handleNodeMouseUp} onTouchEnd={handleNodeTouchEnd}>
                {!isViewer && (
                  <>
                    <div onMouseUp={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
                        <ConnectionPort position="-top-2 left-1/2 -translate-x-1/2" title="Connect a concept or item here" />
                    </div>
                     <ConnectionPort 
                        position="-bottom-2 left-1/2 -translate-x-1/2"
                        title="Drag to connect to an output node"
                        onMouseDown={(e) => { e.stopPropagation(); onStartConnection(nodeId, e); }}
                        onTouchStart={(e) => { e.stopPropagation(); onStartConnection(nodeId, e); }}
                    />
                    <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="absolute -top-2 -right-2 z-20 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg opacity-0 group-hover/card:opacity-100" title="Remove Node"><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </>
                )}
                <div className="w-full bg-[#f0f3f6] dark:bg-[#2a2e33] rounded-lg shadow-lg border-2 border-dashed border-amber-500 dark:border-amber-400 flex flex-col p-3">
                    <h3 className="font-bold text-center text-amber-600 dark:text-amber-400">{nodeName}</h3>
                     <textarea
                        ref={textareaRef}
                        value={contextData.text}
                        onChange={(e) => onUpdateNodeContext(nodeId, e.target.value)}
                        readOnly={isViewer}
                        rows={1}
                        onWheel={e => e.stopPropagation()}
                        className="mt-2 w-full bg-[#E0E5EC] dark:bg-[#212428] border border-[#CED2D9] dark:border-[#464D56] rounded-md text-sm text-[#2128] dark:text-[#E0E5EC] placeholder:text-xs p-2 focus:ring-1 focus:ring-amber-500 dark:focus:ring-amber-400 focus:border-amber-500 dark:focus:border-amber-400 transition-colors resize-none overflow-hidden no-drag"
                        placeholder="Add a guiding theme or objective... (e.g., A cinematic shot for a luxury perfume ad)"
                    />
                </div>
            </div>
        )
    }

    if (isOutput && outputState && onSetOutputNodeMode && onGenerateOutput) {
        const isGeneratorDisabled = (connectedIds.length === 0) || outputState?.isLoading;
        return (
            <div ref={ref} className="absolute select-none group/card" style={{ left: position.x, top: position.y, perspective: '1000px', cursor: isViewer ? 'default' : 'grab', width: '18rem' }} onMouseDown={handleDragStart} onTouchStart={handleDragStart} onMouseUp={handleNodeMouseUp} onTouchEnd={handleNodeTouchEnd}>
                <div className="relative w-full [transform-style:preserve-3d] transition-transform duration-500" style={{ transform: isFlipped && !isViewer ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                    {/* Front Face */}
                    <div className="w-full [backface-visibility:hidden]">
                        <div className="relative w-full bg-[#f0f3f6] dark:bg-[#2a2e33] rounded-lg shadow-lg border-2 border-dashed border-green-500 dark:border-green-400 flex flex-col p-3">
                            {!isViewer && (
                                <>
                                    <div onMouseUp={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
                                        <ConnectionPort position="top-1/2 -left-2 -translate-y-1/2" title="Connect an item or context here" />
                                        <ConnectionPort position="top-1/2 -right-2 -translate-y-1/2" title="Connect an item or context here" />
                                        <ConnectionPort position="-top-2 left-1/2 -translate-x-1/2" title="Connect an item or context here" />
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="absolute -top-2 -right-2 z-20 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg opacity-0 group-hover/card:opacity-100" title="Remove Node"><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                                    <button onClick={() => setIsFlipped(prev => !prev)} className="absolute top-2 right-2 z-10 p-1 text-[#464D56] dark:text-[#CED2D9] rounded-full hover:bg-[#CED2D9] dark:hover:bg-[#464D56] transition-colors no-drag" title="Configure"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>
                                </>
                            )}
                            <div className="text-center w-full">
                                <h3 className="font-bold text-green-600 dark:text-green-400">{nodeName}</h3>
                                <p className="text-xs text-[#464D56] dark:text-[#CED2D9]">{connectedIds.length} connection(s)</p>
                            </div>
                            {!isViewer && (
                                <div className="mt-3 pt-3 border-t border-[#CED2D9] dark:border-[#464D56] w-full space-y-3 no-drag">
                                    <button onClick={() => onGenerateOutput(nodeId)} disabled={isGeneratorDisabled} className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-75 transition-all transform hover:scale-105 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed disabled:scale-100 disabled:opacity-60 flex items-center justify-center gap-2">
                                        {outputState.isLoading ? <Spinner className="h-5 w-5" /> : (<><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 10-2 0v1.158a1 1 0 01-1.82.559l-.6-1.039a1 1 0 00-1.732 1l.6 1.039A1 1 0 014.84 6.84l-1.04-.6a1 1 0 00-1 1.732l1.04.6A1 1 0 013.16 9.16l-1.04.6a1 1 0 001 1.732l1.04-.6a1 1 0 011.68 1.158l-.6 1.04a1 1 0 001.732 1l.6-1.039a1 1 0 011.82.559V17a1 1 0 102 0v-1.158a1 1 0 011.82-.559l.6 1.039a1 1 0 001.732-1l-.6-1.039a1 1 0 01-1.158-1.68l1.04.6a1 1 0 001-1.732l-1.04-.6a1 1 0 01.559-1.82l1.039-.6a1 1 0 00-1-1.732l-1.039.6a1 1 0 01-1.68-1.158l.6-1.04a1 1 0 00-1.732-1l-.6 1.039A1 1 0 0112.16 6.84l1.039.6a1 1 0 101-1.732l-1.039-.6a1 1 0 01-.559-1.82V3z" /></svg><span>Generate</span></>)}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                     {/* Back Face */}
                    <div className="absolute top-0 left-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] no-drag">
                        <div className="relative w-full h-full bg-[#f0f3f6] dark:bg-[#2a2e33] rounded-lg shadow-lg border-2 border-dashed border-green-500 dark:border-green-400 flex flex-col p-3 justify-between">
                             <button onClick={() => setIsFlipped(prev => !prev)} className="absolute top-2 right-2 z-10 p-1 text-[#464D56] dark:text-[#CED2D9] rounded-full hover:bg-[#CED2D9] dark:hover:bg-[#464D56] transition-colors no-drag" title="Back to main view"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>
                            <div>
                                <h3 className="font-bold text-center text-green-600 dark:text-green-400">Configuration</h3>
                                <div className="mt-4 w-full space-y-3">
                                    <p className="text-xs text-center text-[#464D56] dark:text-[#CED2D9]">Select prompt generation mode.</p>
                                    <div className="flex items-center justify-between text-xs p-2 bg-[#E0E5EC] dark:bg-[#212428] rounded-lg">
                                        <span className={`font-medium ${outputState.mode === 'consolidated' ? 'text-[#212428] dark:text-[#E0E5EC]' : 'text-gray-400'}`}>Consolidated</span>
                                        <button onClick={handleModeToggle} className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${outputState.mode === 'double-output' ? 'bg-green-500' : 'bg-gray-400'}`}>
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${outputState.mode === 'double-output' ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                        </button>
                                        <span className={`font-medium ${outputState.mode === 'double-output' ? 'text-[#212428] dark:text-[#E0E5EC]' : 'text-gray-400'}`}>Double-Output</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Default concept node
    const isSpecialMoodboard = nodeName === 'Moodboard';
    return (
        <div ref={ref} className="absolute select-none group/card w-48" style={{ left: position.x, top: position.y, cursor: isViewer ? 'default' : 'grab' }} onMouseDown={handleDragStart} onTouchStart={handleDragStart} onMouseUp={handleNodeMouseUp} onTouchEnd={handleNodeTouchEnd}>
            {!isViewer && (
                <>
                    <div onMouseUp={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
                        <ConnectionPort position="top-1/2 -left-2 -translate-y-1/2" title="Connect an image here"/>
                        <ConnectionPort position="top-1/2 -right-2 -translate-y-1/2" title="Connect an image here"/>
                        <ConnectionPort position="-top-2 left-1/2 -translate-x-1/2" title="Connect an image here"/>
                        <ConnectionPort position="-bottom-2 left-1/2 -translate-x-1/2" title="Connect an image here"/>
                    </div>
                    
                    <div className="absolute top-0 right-0 bottom-0 left-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
                        <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="absolute -top-2 -right-2 z-10 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg" title="Remove Node"><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                        <div 
                            className="connection-port absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-gradient-to-r from-[#44A0D1] to-[#5AC549] dark:from-[#54C1FB] dark:to-[#6DFB54] rounded-full border-2 border-white dark:border-[#2a2e33] shadow-md cursor-pointer hover:scale-125 transition-transform z-20" 
                            onMouseDown={(e) => { e.stopPropagation(); onStartConnection(nodeId, e); }} 
                            onTouchStart={(e) => { e.stopPropagation(); onStartConnection(nodeId, e); }} 
                            title="Drag to connect to another node or item" 
                        />
                    </div>
                </>
            )}
            <div className={`w-full bg-[#f0f3f6] dark:bg-[#2a2e33] rounded-lg shadow-lg border border-[#CED2D9] dark:border-[#464D56] flex flex-col p-3 overflow-hidden ${isSpecialMoodboard ? 'border-2 border-[#44A0D1] dark:border-[#54C1FB]' : ''}`}>
                <div className="text-center w-full">
                    <h3 className={`font-bold text-[#212428] dark:text-[#E0E5EC] ${isSpecialMoodboard ? 'text-[#44A0D1] dark:text-[#54C1FB]' : ''}`}>{nodeName}</h3>
                    <p className="text-xs text-[#464D56] dark:text-[#CED2D9]">{connectedIds.length} connection(s)</p>
                </div>
            </div>
        </div>
    );
});
Node.displayName = 'Node';