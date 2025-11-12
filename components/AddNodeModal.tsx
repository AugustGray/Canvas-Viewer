import React, { useState, useEffect } from 'react';

interface AddNodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddNode: (name: string) => void;
    existingNodeNames: string[];
}

export const AddNodeModal: React.FC<AddNodeModalProps> = ({ isOpen, onClose, onAddNode, existingNodeNames }) => {
    const [nodeName, setNodeName] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setNodeName('');
            setError('');
        }
    }, [isOpen]);

    const handleSubmit = () => {
        const trimmedName = nodeName.trim();
        if (!trimmedName) {
            setError('Node name cannot be empty.');
            return;
        }
        if (existingNodeNames.some(name => name.toLowerCase() === trimmedName.toLowerCase())) {
            setError('A node with this name already exists.');
            return;
        }
        onAddNode(trimmedName);
    };

    const handleClose = () => {
        onClose();
    };
    
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={handleClose}
        >
            <div 
                className="bg-[#f0f3f6] dark:bg-[#2a2e33] rounded-xl shadow-2xl w-full max-w-md border border-[#CED2D9]/50 dark:border-[#464D56]/50 p-6 relative"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold text-[#212428] dark:text-[#E0E5EC] mb-4">Add Custom Node</h2>
                <p className="text-sm text-[#464D56] dark:text-[#CED2D9] mb-4">Create a new concept node to connect your images to. This helps in generating more specific prompts.</p>
                <div>
                    <label htmlFor="nodeName" className="block text-sm font-medium text-[#212428] dark:text-[#E0E5EC] mb-1">Node Name</label>
                    <input
                        id="nodeName"
                        type="text"
                        value={nodeName}
                        onChange={(e) => {
                            setNodeName(e.target.value);
                            if (error) setError('');
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        className="w-full bg-[#f0f3f6] dark:bg-[#2a2e33] border-2 border-[#CED2D9] dark:border-[#464D56] rounded-lg text-[#212428] dark:text-[#E0E5EC] placeholder-[#464D56] dark:placeholder-[#CED2D9]/60 p-2 focus:ring-2 focus:ring-[#44A0D1] dark:focus:ring-[#54C1FB] focus:border-[#44A0D1] dark:focus:border-[#54C1FB] transition-colors"
                        placeholder="e.g., Character Design, Cinematography"
                        autoFocus
                    />
                    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 bg-transparent text-[#464D56] dark:text-[#CED2D9] font-semibold rounded-lg hover:bg-[#CED2D9] dark:hover:bg-[#464D56] focus:outline-none focus:ring-2 focus:ring-[#464D56] dark:focus:ring-[#CED2D9] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-6 py-2 bg-[#44A0D1] dark:bg-[#54C1FB] text-white font-bold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#5AC549] dark:focus:ring-[#6DFB54] focus:ring-opacity-75 transition-all transform hover:scale-105"
                    >
                        Create Node
                    </button>
                </div>
            </div>
        </div>
    );
};