
import React, { useState, useRef, useEffect } from 'react';
import { AnalyzedImage, NodeConnections, SaveState, SavableAnalyzedImage, Item, OutputCard, CanvasNode, defaultNodeTypes } from './types';
import { Canvas } from './components/NodeCanvas';
import { PrivacyModal } from './components/PrivacyModal';

const defaultSettings = {
  provider: 'local',
  localUrl: 'http://localhost:1234'
};

const LoadMoodboardPrompt: React.FC<{
  onLoadClick: () => void;
  onLoadDemoClick: () => void;
}> = ({ onLoadClick, onLoadDemoClick }) => (
    <div className="text-center bg-[#CED2D9]/50 dark:bg-[#464D56]/50 rounded-xl border-2 border-dashed border-[#464D56] dark:border-[#CED2D9] p-8 md:p-12">
        <div className="flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="text-[#464D56] dark:text-[#CED2D9] mb-4 h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <h2 className="text-xl font-bold text-[#212428] dark:text-[#E0E5EC] mb-2">Moodboard Viewer</h2>
            <p className="text-[#464D56] dark:text-[#CED2D9] mb-6">Load a saved moodboard `.json` file, or try the demo to see what's possible.</p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={onLoadClick}
                className="px-6 py-2 bg-[#44A0D1] dark:bg-[#54C1FB] text-white font-semibold rounded-lg shadow-md hover:bg-[#44A0D1]/90 dark:hover:bg-[#54C1FB]/90 focus:outline-none focus:ring-2 focus:ring-[#44A0D1] dark:focus:ring-[#54C1FB] focus:ring-opacity-75 transition-transform transform hover:scale-105 flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Load Moodboard File
              </button>
              <button
                onClick={onLoadDemoClick}
                className="px-6 py-2 bg-transparent border-2 border-[#44A0D1] dark:border-[#54C1FB] text-[#44A0D1] dark:text-[#54C1FB] font-semibold rounded-lg hover:bg-[#44A0D1]/10 dark:hover:bg-[#54C1FB]/10 focus:outline-none focus:ring-2 focus:ring-[#44A0D1] dark:focus:ring-[#54C1FB] focus:ring-opacity-75 transition-transform transform hover:scale-105 flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  Load Demo
              </button>
            </div>
        </div>
    </div>
);


export default function App() {
  const [analyzedImages, setAnalyzedImages] = useState<AnalyzedImage[]>([]);
  const [connections, setConnections] = useState<NodeConnections>({});
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [itemConnections, setItemConnections] = useState<Record<string, string[]>>({});
  const [outputCards, setOutputCards] = useState<OutputCard[]>([]);
  
  const loadInputRef = useRef<HTMLInputElement>(null);
  const [zoom, setZoom] = useState(1);
  const canvasContentRef = useRef<HTMLDivElement>(null);
  
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedTheme = window.localStorage.getItem('theme');
      if (storedTheme === 'dark' || storedTheme === 'light') {
        return storedTheme;
      }
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const handleReset = () => {
    setAnalyzedImages([]);
    setConnections({});
    setNodes([]);
    setZoom(1);
    setItems([]);
    setItemConnections({});
    setOutputCards([]);
  };

  const parseAndLoadState = (loadedData: any) => {
    const loadImages = (images: SavableAnalyzedImage[]) => images.map((img, index) => {
        const newResults: AnalyzedImage['results'] = {};
        if (img.results) {
            for (const nodeId in img.results) {
                const resultItem = img.results[nodeId];
                if (resultItem) {
                    newResults[nodeId] = { analysis: resultItem.analysis, isLoading: false, error: null };
                }
            }
        }
        return {
            id: img.id,
            base64: img.base64,
            mimeType: img.mimeType,
            imageDataUrl: `data:${img.mimeType};base64,${img.base64}`,
            results: newResults,
            position: img.position || { x: 50 + (index % 5) * 20, y: 50 + (index % 5) * 20 },
        }
    });
    
    if (loadedData.version >= 7 && loadedData.version <= 11) {
        const state = loadedData as any; // Use 'any' for flexibility with different versions
        setAnalyzedImages(loadImages(state.analyzedImages || []));
        setConnections(state.connections || {});
        
        const loadedNodes = (state.nodes || []).map(node => ({
            ...node,
            name: String(node.name || '') 
        }));
        setNodes(loadedNodes);

        const loadedItems = (state.items || []).map(item => ({
            ...item,
            rawData: item.rawData || (item as any).data || {},
            analyzedData: item.analyzedData || null,
            isAnalyzing: false, 
            analysisError: item.analysisError || null,
        }));
        setItems(loadedItems);

        // Handle legacy 'itemConnections' and new 'productConnections' (from v10)
        setItemConnections(state.productConnections || state.itemConnections || {});
        setOutputCards(state.outputCards || []);
    } else {
        const version = loadedData.version ?? 'unknown';
        const errorMsg = `Unsupported file version. This viewer supports versions 7-11, but the file is version ${version}.`;
        console.error(errorMsg, loadedData);
        alert(errorMsg);
    }
  };
  
  const handleLoadCanvas = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) throw new Error("File is empty.");
        const loadedData = JSON.parse(text);
        parseAndLoadState(loadedData);
      } catch (error) {
        console.error("Failed to load canvas:", error);
        alert("Failed to load canvas. The file might be corrupted or in an unsupported format.");
      } finally {
          if (event.target) event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleLoadDemo = async () => {
    try {
      const response = await fetch('./demo.json');
      if (!response.ok) {
        throw new Error(`Failed to fetch demo data: ${response.statusText}`);
      }
      const demoData = await response.json();
      parseAndLoadState(demoData);
    } catch (error) {
      console.error("Failed to load demo file:", error);
      alert("Failed to load demo file. The file might be corrupted or in an unsupported format.");
    }
  };

  const handleImagePositionChange = (id: string, position: { x: number; y: number }) => {
    setAnalyzedImages(prev => prev.map(img => img.id === id ? { ...img, position } : img));
  };
  const handleItemPositionChange = (id: string, position: { x: number; y: number }) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, position } : item));
  };
  const handleOutputCardPositionChange = (id: string, position: { x: number; y: number }) => {
    setOutputCards(prev => prev.map(card => card.id === id ? { ...card, position } : card));
  };
  const handleNodePositionChange = (id: string, position: { x: number; y: number }) => {
    setNodes(prev => prev.map(node => node.id === id ? { ...node, position } : node));
  };
  const handleZoom = (delta: number) => setZoom(prevZoom => Math.max(0.2, Math.min(2, prevZoom + delta)));

  const hasContent = analyzedImages.length > 0 || nodes.length > 0 || items.length > 0;

  return (
    <div className="w-screen h-screen flex flex-col font-sans overflow-hidden bg-[#E0E5EC] text-[#212428] dark:bg-[#212428] dark:text-[#E0E5EC]">
        <input type="file" ref={loadInputRef} onChange={handleLoadCanvas} accept=".json" className="hidden"/>
        <PrivacyModal isOpen={isPrivacyModalOpen} onClose={() => setIsPrivacyModalOpen(false)} />
        <header className="flex-shrink-0 border-b border-[#CED2D9] dark:border-[#464D56] bg-[#E0E5EC]/80 dark:bg-[#212428]/80 backdrop-blur-lg z-10">
            <div className="container mx-auto px-4 py-3">
               <div className="flex items-center justify-between gap-3 relative">
                 <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-[#44A0D1] dark:text-[#54C1FB]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.61 6.39L12 11.17l-3.61-2.78-1.89 2.47L12 15l5.5-4.25-1.89-2.36zM12 4c.83 0 1.5.67 1.5 1.5S12.83 7 12 7s-1.5-.67-1.5-1.5S11.17 4 12 4z"/></svg>
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#212428] dark:text-[#E0E5EC]">AI Moodboard Viewer</h1>
                 </div>
               </div>
            </div>
        </header>

      <main className="flex-grow relative">
        {hasContent ? (
          <Canvas
              ref={canvasContentRef}
              isViewer={true}
              analyzedImages={analyzedImages}
              connections={connections}
              nodes={nodes}
              items={items}
              itemConnections={itemConnections}
              outputCards={outputCards}
              onImagePositionChange={handleImagePositionChange}
              onNodePositionChange={handleNodePositionChange}
              onItemPositionChange={handleItemPositionChange}
              onOutputCardPositionChange={handleOutputCardPositionChange}
              zoom={zoom}
              setZoom={setZoom}
              onZoomIn={() => handleZoom(0.1)}
              onZoomOut={() => handleZoom(-0.1)}
              onZoomReset={() => setZoom(1)}
              // Pass empty/dummy functions for props that are not used in viewer mode
              onConnect={() => {}}
              onConnectNodeToItem={() => {}}
              onDisconnect={() => {}}
              onRemoveImage={() => {}}
              onRemoveItem={() => {}}
              onRemoveOutputCard={() => {}}
              onImageUpload={() => {}}
              onRemoveNode={() => {}}
              onGenerateOutput={() => {}}
              onSetOutputNodeMode={() => {}}
              onUpdateNodeContext={() => {}}
              isSelectingForExport={false}
              onCancelSelection={() => {}}
              onAreaSelectedForExport={() => {}}
              isCapturing={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-4">
              <LoadMoodboardPrompt 
                onLoadClick={() => loadInputRef.current?.click()} 
                onLoadDemoClick={handleLoadDemo}
              />
          </div>
        )}
      </main>
      
      <footer className="flex-shrink-0 bg-[#E0E5EC]/80 dark:bg-[#212428]/80 backdrop-blur-lg border-t border-[#CED2D9] dark:border-[#464D56] p-3 z-10">
        <div className="container mx-auto px-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
                 <button
                    onClick={() => loadInputRef.current?.click()}
                    className="px-4 py-2 bg-[#44A0D1] dark:bg-[#54C1FB] text-white font-semibold rounded-lg shadow-md hover:bg-[#44A0D1]/90 dark:hover:bg-[#54C1FB]/90 focus:outline-none focus:ring-2 focus:ring-[#44A0D1] dark:focus:ring-[#54C1FB] focus:ring-opacity-75 transition-transform transform hover:scale-105 flex items-center justify-center gap-2"
                    title="Load a moodboard file"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    Load Moodboard
                </button>
            </div>
             <div className="flex items-center gap-1">
                <button title="Reset Canvas" onClick={handleReset} className="p-2 rounded-md hover:bg-[#CED2D9] dark:hover:bg-[#464D56] transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#464D56] dark:text-[#CED2D9]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l16 16" /></svg></button>
                <div className="border-l border-[#CED2D9] dark:border-[#464D56] h-6 mx-1"></div>
                <button title="Privacy Information" onClick={() => setIsPrivacyModalOpen(true)} className="p-2 rounded-md hover:bg-[#CED2D9] dark:hover:bg-[#464D56] transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#464D56] dark:text-[#CED2D9]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </button>
                <button title="Toggle Theme" onClick={toggleTheme} className="p-2 rounded-md hover:bg-[#CED2D9] dark:hover:bg-[#464D56] transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#464D56] dark:text-[#CED2D9] block dark:hidden" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#464D56] dark:text-[#CED2D9] hidden dark:block" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg></button>
             </div>
        </div>
      </footer>
    </div>
  );
}