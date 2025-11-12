import React from 'react';

interface ZoomControlsProps {
    zoom: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomReset: () => void;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({ zoom, onZoomIn, onZoomOut, onZoomReset }) => {
    return (
        <div className="absolute bottom-4 left-4 z-10 bg-[#f0f3f6]/80 dark:bg-[#2a2e33]/80 backdrop-blur-sm rounded-lg shadow-md flex items-center border border-[#CED2D9] dark:border-[#464D56] text-[#212428] dark:text-[#E0E5EC]">
            <button title="Zoom Out" onClick={onZoomOut} className="p-2 hover:bg-[#CED2D9] dark:hover:bg-[#464D56] rounded-l-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={zoom <= 0.2}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                </svg>
            </button>
            <button title="Reset Zoom" onClick={onZoomReset} className="px-3 py-2 text-sm font-semibold border-x border-[#CED2D9] dark:border-[#464D56] hover:bg-[#CED2D9] dark:hover:bg-[#464D56] transition-colors whitespace-nowrap">
                {Math.round(zoom * 100)}%
            </button>
            <button title="Zoom In" onClick={onZoomIn} className="p-2 hover:bg-[#CED2D9] dark:hover:bg-[#464D56] rounded-r-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={zoom >= 2}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
            </button>
        </div>
    );
};
