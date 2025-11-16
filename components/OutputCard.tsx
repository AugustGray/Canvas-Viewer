import React, { useState, useRef } from 'react';
// FIX: Rename imported OutputCard type to avoid name collision with the component.
import { OutputCard as OutputCardType } from '../types';

interface OutputCardProps {
  // FIX: Use the aliased type name.
  card: OutputCardType;
  onRemove: () => void;
  onPositionChange: (pos: { x: number; y: number }) => void;
  isViewer: boolean;
}

const CopyIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2V10a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const CheckIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);


export const OutputCard = React.forwardRef<HTMLDivElement, OutputCardProps>(({ card, onRemove, onPositionChange, isViewer }, ref) => {
  const [copied, setCopied] = useState(false);
  const dragStartPos = useRef<{ x: number, y: number, mouseX: number, mouseY: number } | null>(null);

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (isViewer || (e.target as HTMLElement).closest('button, a, .no-drag')) {
        return;
    }
    e.preventDefault();
    e.stopPropagation();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    dragStartPos.current = {
      x: card.position.x,
      y: card.position.y,
      mouseX: clientX,
      mouseY: clientY,
    };
    
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
    onPositionChange({
      x: dragStartPos.current.x + dx,
      y: dragStartPos.current.y + dy,
    });
  };

  const handleDragEnd = () => {
    dragStartPos.current = null;
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('touchmove', handleDragMove);
    document.removeEventListener('touchend', handleDragEnd);
  };
  
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(card.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cardStyles = {
    positive: 'border-green-500/80 dark:border-green-400/80',
    negative: 'border-red-500/80 dark:border-red-400/80',
    consolidated: 'border-teal-500/80 dark:border-teal-400/80',
  };

  const headerStyles = {
    positive: 'text-green-700 dark:text-green-300',
    negative: 'text-red-700 dark:text-red-400',
    consolidated: 'text-teal-700 dark:text-teal-300',
  };
  
  const title = {
    positive: 'Positive Prompt',
    negative: 'Negative Prompt',
    consolidated: 'Generated Prompt',
  }[card.type];
  
  return (
    <div 
        ref={ref}
        className="w-80 absolute select-none group/card"
        style={{ left: card.position.x, top: card.position.y, cursor: isViewer ? 'default' : 'grab' }}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
    >
        <div className={`relative bg-[#f0f3f6] dark:bg-[#2a2e33] rounded-xl shadow-lg flex flex-col border-2 ${cardStyles[card.type]} w-full`}>
            <div className={`p-3 border-b-2 ${cardStyles[card.type]} flex justify-between items-center`}>
                <h3 className={`font-bold text-base ${headerStyles[card.type]}`}>{title}</h3>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2 py-1 text-xs bg-[#CED2D9] dark:bg-[#464D56] hover:bg-[#c1c6cf] dark:hover:bg-[#5a626d] rounded-md transition-colors text-[#212428] dark:text-[#E0E5EC] no-drag"
                >
                    {copied ? <CheckIcon/> : <CopyIcon/>}
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </div>
            <div className="p-3 max-h-60 overflow-y-auto no-drag" onWheel={e => e.stopPropagation()}>
                <p className="text-sm text-[#212428] dark:text-[#E0E5EC] leading-relaxed whitespace-pre-wrap">{card.prompt}</p>
            </div>
            {!isViewer && (
                <button
                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 z-10 opacity-0 group-hover/card:opacity-100 no-drag"
                    aria-label="Remove prompt"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </div>
    </div>
  );
});
OutputCard.displayName = 'OutputCard';