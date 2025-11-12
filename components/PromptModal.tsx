import React, { useState, useEffect } from 'react';
import { Spinner } from './Spinner';

interface PromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    prompt: string;
    isLoading: boolean;
}

const CopyIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2V10a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const CheckIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

export const PromptModal: React.FC<PromptModalProps> = ({ isOpen, onClose, prompt, isLoading }) => {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setCopied(false);
        }
    }, [isOpen]);

    const handleCopy = () => {
        navigator.clipboard.writeText(prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={onClose}
        >
            <div 
                className="bg-[#f0f3f6] dark:bg-[#2a2e33] rounded-xl shadow-2xl w-full max-w-2xl border border-[#CED2D9]/50 dark:border-[#464D56]/50 p-6 relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button 
                    onClick={onClose}
                    className="absolute top-3 right-3 text-[#464D56] hover:text-[#212428] dark:text-[#CED2D9] dark:hover:text-[#E0E5EC] transition-colors"
                    aria-label="Close modal"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <h2 className="text-xl font-bold text-[#212428] dark:text-[#E0E5EC] mb-4">Synthesized AI Prompt</h2>
                {isLoading ? (
                    <div className="min-h-[150px] flex flex-col items-center justify-center">
                        <Spinner />
                        <p className="mt-3 text-[#464D56] dark:text-[#CED2D9]">Crafting your prompt...</p>
                    </div>
                ) : (
                    <div className="bg-[#E0E5EC] dark:bg-[#212428]/50 p-4 rounded-lg max-h-96 overflow-y-auto">
                        <p className="text-[#212428] dark:text-[#E0E5EC] leading-relaxed whitespace-pre-wrap">{prompt}</p>
                    </div>
                )}
                {!isLoading && (
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-2 px-4 py-2 bg-[#44A0D1] dark:bg-[#54C1FB] text-white font-semibold rounded-lg shadow-md hover:bg-[#5AC549] dark:hover:bg-[#6DFB54] focus:outline-none focus:ring-2 focus:ring-[#44A0D1] dark:focus:ring-[#54C1FB] focus:ring-opacity-75 transition-all"
                        >
                            {copied ? <CheckIcon/> : <CopyIcon/>}
                            {copied ? 'Copied to Clipboard!' : 'Copy Prompt'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};