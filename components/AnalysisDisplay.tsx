import React, { useState } from 'react';
import { Color } from '../types';

const CopyIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2V10a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const CheckIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

const SectionHeader: React.FC<{ title: string; children?: React.ReactNode }> = ({ title, children }) => (
    <div className="flex justify-between items-center mb-1.5">
        <h4 className="text-xs font-semibold text-[#44A0D1] dark:text-[#54C1FB]">{title}</h4>
        {children}
    </div>
);

const ColorPaletteDisplay: React.FC<{ colors: Color[] }> = ({ colors }) => (
    <div>
        <SectionHeader title="Color Palette" />
        <div className="flex flex-wrap gap-2">
            {(colors || []).map((color, index) => (
                <div key={index} className="group" title={`${color.name} - ${color.hex}`}>
                    <div 
                        className="w-5 h-5 rounded-full shadow-sm border-2 border-[#E0E5EC] dark:border-[#464D56]"
                        style={{ backgroundColor: color.hex }}
                    ></div>
                </div>
            ))}
        </div>
    </div>
);

const TagsDisplay: React.FC<{ title: string; tags: string[] }> = ({ title, tags }) => (
    <div>
        <SectionHeader title={title} />
        <div className="flex flex-wrap gap-1.5">
            {(tags || []).map((tag, index) => (
                <span key={index} className="bg-[#E0E5EC] dark:bg-[#212428] text-[#212428] dark:text-[#E0E5EC] text-xs font-medium px-2 py-0.5 rounded-full">
                    {tag}
                </span>
            ))}
        </div>
    </div>
);

const DescriptionDisplay: React.FC<{ title: string; description: string }> = ({ title, description }) => {
    const [copied, setCopied] = useState(false);
    
    const handleCopy = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(description);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div>
            <SectionHeader title={title}>
                <button onClick={handleCopy} className="flex items-center gap-1.5 px-2 py-1 text-xs bg-[#CED2D9] dark:bg-[#464D56] hover:bg-[#c1c6cf] dark:hover:bg-[#5a626d] rounded-md transition-colors text-[#212428] dark:text-[#E0E5EC]">
                    {copied ? <CheckIcon/> : <CopyIcon/>}
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </SectionHeader>
            <p className="text-xs text-[#464D56] dark:text-[#CED2D9] leading-relaxed bg-[#E0E5EC] dark:bg-[#212428] p-2 rounded-md">
                {description}
            </p>
        </div>
    );
};

export const AnalysisDisplay: React.FC<{ nodeType: string; analysis: any; }> = ({ nodeType, analysis }) => {
    if (!analysis) return null;

    switch (nodeType) {
        case 'Color Palette':
            return <ColorPaletteDisplay colors={analysis.colors} />;
        case 'Style':
            return <TagsDisplay title="Styles" tags={analysis.styles} />;
        case 'Texture':
            return <TagsDisplay title="Textures" tags={analysis.textures} />;
        case 'Material':
        case 'Aesthetic':
        default:
            if (analysis.description) {
                return <DescriptionDisplay title={nodeType} description={analysis.description} />;
            }
            return null;
    }
};
