
import React from 'react';

interface PrivacyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={onClose}
        >
            <div 
                className="bg-[#f0f3f6] dark:bg-[#2a2e33] rounded-xl shadow-2xl w-full max-w-lg border border-[#CED2D9]/50 dark:border-[#464D56]/50 p-6 relative"
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
                <h2 className="text-xl font-bold text-[#212428] dark:text-[#E0E5EC] mb-4">Privacy & Data Handling</h2>
                <div className="text-sm text-[#464D56] dark:text-[#CED2D9] space-y-4">
                    <p>This app is designed with your privacy and control in mind. Here’s how your data is handled.</p>
                    <div>
                        <h3 className="font-semibold text-[#212428] dark:text-[#E0E5EC] mb-1">File Upload</h3>
                        <p>When you upload a file, you grant the app permission to read only that single file. The app cannot access any other files on your system.</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-[#212428] dark:text-[#E0E5EC] mb-1">Hardware Permissions</h3>
                        <p>This app does not request access to your camera, microphone, or location.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};