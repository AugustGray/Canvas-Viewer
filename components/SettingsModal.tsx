import React, { useState, useEffect } from 'react';
import { Settings } from '../types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (settings: Settings) => void;
    currentSettings: Settings;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, currentSettings }) => {
    const [localUrl, setLocalUrl] = useState(currentSettings.localUrl);

    useEffect(() => {
        if (isOpen) {
            setLocalUrl(currentSettings.localUrl);
        }
    }, [isOpen, currentSettings]);

    const handleSubmit = () => {
        onSave({ provider: 'local', localUrl });
        onClose();
    };

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
                <h2 className="text-xl font-bold text-[#212428] dark:text-[#E0E5EC] mb-4">Local LLM Server Settings</h2>
                <p className="text-sm text-[#464D56] dark:text-[#CED2D9] mb-6">Configure the URL for your local, OpenAI-compatible server (e.g., from LM Studio).</p>
                
                <div className="space-y-4">
                    <div>
                        <label htmlFor="localUrl" className="block text-sm font-medium text-[#212428] dark:text-[#E0E5EC] mb-1">Local Server URL</label>
                        <input
                            id="localUrl"
                            type="text"
                            value={localUrl}
                            onChange={(e) => setLocalUrl(e.target.value)}
                            className="w-full bg-[#f0f3f6] dark:bg-[#2a2e33] border-2 border-[#CED2D9] dark:border-[#464D56] rounded-lg text-[#212428] dark:text-[#E0E5EC] placeholder-[#464D56] dark:placeholder-[#CED2D9]/60 p-2 focus:ring-2 focus:ring-[#44A0D1] dark:focus:ring-[#54C1FB] focus:border-[#44A0D1] dark:focus:border-[#54C1FB] transition-colors"
                            placeholder="http://localhost:1234"
                        />
                        <div className="text-xs text-[#464D56] dark:text-[#CED2D9] mt-2 bg-[#E0E5EC] dark:bg-[#212428] p-3 rounded-md border border-[#CED2D9] dark:border-[#464D56]">
                            <h4 className="font-bold text-sm text-[#212428] dark:text-[#E0E5EC] mb-1 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                Fixing Network Errors
                            </h4>
                            <p>
                                If you see a "NetworkError" or "Failed to fetch" message, it's likely a CORS issue.
                                <strong> For LM Studio users:</strong>
                            </p>
                            <ol className="list-decimal list-inside pl-2 mt-1 space-y-1">
                                <li>Go to the <strong className="font-semibold">Server</strong> tab ( <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline-block" viewBox="0 0 20 20" fill="currentColor"><path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 2.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg> ) in LM Studio.</li>
                                <li>Under "Server Settings", find the <strong>CORS</strong> option.</li>
                                <li>Check the box to <strong>Allow Cross-Origin Resource Sharing</strong>.</li>
                                <li><strong>Restart your local server</strong> from LM Studio.</li>
                            </ol>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-transparent text-[#464D56] dark:text-[#CED2D9] font-semibold rounded-lg hover:bg-[#CED2D9] dark:hover:bg-[#464D56] focus:outline-none focus:ring-2 focus:ring-[#464D56] dark:focus:ring-[#CED2D9] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-6 py-2 bg-[#44A0D1] dark:bg-[#54C1FB] text-white font-bold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#5AC549] dark:focus:ring-[#6DFB54] focus:ring-opacity-75 transition-all transform hover:scale-105"
                    >
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
};