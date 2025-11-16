import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NodeConnections, AnalyzedImage, Item, OutputCard, CanvasNode } from '../types';
import { ImageCard } from './ImageCard';
import { Node } from './NodeSlot';
import { ItemCard } from './ItemCard';
import { OutputCard as OutputCardComponent } from './OutputCard';
import { ZoomControls } from './ZoomControls';

interface CanvasProps {
    isViewer: boolean;
    analyzedImages: AnalyzedImage[];
    connections: NodeConnections;
    nodes: CanvasNode[];
    items: Item[];
    itemConnections: Record<string, string[]>;
    outputCards: OutputCard[];
    onConnect: (nodeId: string, fromId: string) => void;
    onConnectNodeToItem: (itemId: string, nodeId: string) => void;
    onDisconnect: (nodeId: string, fromId: string) => void;
    onImagePositionChange: (id: string, position: { x: number; y: number }) => void;
    onNodePositionChange: (id: string, position: { x: number; y: number }) => void;
    onItemPositionChange: (id: string, position: { x: number; y: number; }) => void;
    onOutputCardPositionChange: (id: string, position: { x: number; y: number; }) => void;
    onRemoveImage: (id: string) => void;
    onRemoveItem: (id: string) => void;
    onRemoveOutputCard: (id: string) => void;
    onImageUpload: (file: File) => void;
    onRemoveNode: (nodeId: string) => void;
    onGenerateOutput: (nodeId: string) => void;
    onSetOutputNodeMode: (nodeId: string, mode: 'consolidated' | 'double-output') => void;
    onUpdateNodeContext: (nodeId: string, text: string) => void;
    zoom: number;
    setZoom: (zoom: number) => void;
    isSelectingForExport: boolean;
    onCancelSelection: () => void;
    onAreaSelectedForExport: (rect: { x: number, y: number, width: number, height: number }) => void;
    isCapturing: boolean;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomReset: () => void;
}

const getLinePath = (x1: number, y1: number, x2: number, y2: number) => {
    return `M ${x1} ${y1} L ${x2} ${y2}`;
};

const getClosestConnectionPoints = (elementA: HTMLElement, elementB: HTMLElement) => {
    const rectA = elementA.getBoundingClientRect();
    const rectB = elementB.getBoundingClientRect();

    const portsA = elementA.querySelectorAll('.connection-port');
    let pointsA;
    
    if (portsA.length > 0) {
        pointsA = Array.from(portsA).map(port => {
            const portRect = port.getBoundingClientRect();
            return {
                x: portRect.left + portRect.width / 2,
                y: portRect.top + portRect.height / 2
            };
        });
    } else {
        pointsA = [
            { x: rectA.left, y: rectA.top + rectA.height / 2 },
            { x: rectA.right, y: rectA.top + rectA.height / 2 },
            { x: rectA.left + rectA.width/2, y: rectA.top },
            { x: rectA.left + rectA.width/2, y: rectA.bottom },
        ];
    }

    const pointsB = [
        { x: rectB.left + rectB.width / 2, y: rectB.top },
        { x: rectB.left + rectB.width / 2, y: rectB.bottom },
        { x: rectB.left, y: rectB.top + rectB.height / 2 },
        { x: rectB.right, y: rectB.top + rectB.height / 2 }
    ];

    let minDistance = Infinity;
    let bestPair = { from: pointsA[0], to: pointsB[0] };

    for (const pA of pointsA) {
        for (const pB of pointsB) {
            const distance = Math.sqrt(Math.pow(pA.x - pB.x, 2) + Math.pow(pA.y - pB.y, 2));
            if (distance < minDistance) {
                minDistance = distance;
                bestPair = { from: pA, to: pB };
            }
        }
    }
    return bestPair;
}

const AUTO_PAN_SPEED = 10;
const AUTO_PAN_MARGIN = 60;


export const Canvas = React.forwardRef<HTMLDivElement, CanvasProps>(({ 
    isViewer,
    analyzedImages,
    connections,
    nodes,
    items,
    itemConnections,
    outputCards,
    onConnect,
    onConnectNodeToItem,
    onDisconnect,
    onImagePositionChange,
    onNodePositionChange,
    onItemPositionChange,
    onOutputCardPositionChange,
    onRemoveImage,
    onRemoveItem,
    onRemoveOutputCard,
    onImageUpload,
    onRemoveNode,
    onGenerateOutput,
    onSetOutputNodeMode,
    onUpdateNodeContext,
    zoom,
    setZoom,
    isSelectingForExport,
    onCancelSelection,
    onAreaSelectedForExport,
    isCapturing,
    onZoomIn,
    onZoomOut,
    onZoomReset,
}, ref) => {
    const [drawingLine, setDrawingLine] = useState<{ fromId: string; fromType: 'image' | 'node' | 'item'; fromPos: { x: number, y: number }, toMouse: { x: number; y: number; } } | null>(null);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const isPanning = useRef(false);
    const lastMousePos = useRef({ x: 0, y: 0 });
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const dragCounter = useRef(0);
    
    const [selectionStart, setSelectionStart] = useState<{x: number, y: number} | null>(null);
    const [selectionRect, setSelectionRect] = useState<{x: number, y: number, width: number, height: number} | null>(null);
    const autoPanRequestRef = useRef<number | null>(null);
    const pinchStartDistance = useRef<number | null>(null);
    const pinchStartZoom = useRef<number | null>(null);


    const canvasRef = useRef<HTMLDivElement>(null);
    const imageRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const outputCardRefs = useRef<Record<string, HTMLDivElement | null>>({});


    const screenToCanvasCoords = useCallback((screenX: number, screenY: number) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const canvasRect = canvasRef.current.getBoundingClientRect();
        return {
            x: (screenX - canvasRect.left - pan.x) / zoom,
            y: (screenY - canvasRect.top - pan.y) / zoom
        };
    }, [pan.x, pan.y, zoom]);

    const handleStartConnection = useCallback((id: string, type: 'image' | 'node' | 'item', e: React.MouseEvent | React.TouchEvent) => {
        if (isViewer) return;
        e.preventDefault();
        e.stopPropagation();
        
        const portElement = e.currentTarget as HTMLElement;
        const portRect = portElement.getBoundingClientRect();
        
        const portCenterX = portRect.left + portRect.width / 2;
        const portCenterY = portRect.top + portRect.height / 2;

        const fromPos = screenToCanvasCoords(portCenterX, portCenterY);
        
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        
        const toMouse = screenToCanvasCoords(clientX, clientY);

        setDrawingLine({ fromId: id, fromType: type, fromPos, toMouse });
    }, [screenToCanvasCoords, isViewer]);

    useEffect(() => {
        const handleDragMove = (e: MouseEvent | TouchEvent) => {
            if (drawingLine) {
                const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
                const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
                const { x, y } = screenToCanvasCoords(clientX, clientY);
                setDrawingLine(prev => prev ? { ...prev, toMouse: { x, y } } : null);
            }
        };

        const handleDragEnd = () => setDrawingLine(null);
        
        if (drawingLine) {
            document.addEventListener('mousemove', handleDragMove);
            document.addEventListener('mouseup', handleDragEnd);
            document.addEventListener('touchmove', handleDragMove);
            document.addEventListener('touchend', handleDragEnd);
        }

        return () => {
            document.removeEventListener('mousemove', handleDragMove);
            document.removeEventListener('mouseup', handleDragEnd);
            document.removeEventListener('touchmove', handleDragMove);
            document.removeEventListener('touchend', handleDragEnd);
        };
    }, [drawingLine, screenToCanvasCoords]);
    
    const handleEndConnectionOnNode = (nodeId: string) => {
        if (drawingLine && !isViewer) onConnect(nodeId, drawingLine.fromId);
    };

    const handleEndConnectionOnItem = (itemId: string) => {
        if (drawingLine && drawingLine.fromType === 'node' && !isViewer) onConnectNodeToItem(itemId, drawingLine.fromId);
    };

    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        if (isSelectingForExport) {
            const { x, y } = screenToCanvasCoords(e.clientX, e.clientY);
            setSelectionStart({ x, y });
            setSelectionRect({ x, y, width: 0, height: 0 });
            return;
        }
        if ((e.target as HTMLElement).closest('.select-none')) return;
        isPanning.current = true;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const stopAutoPan = useCallback(() => {
        if (autoPanRequestRef.current) {
            cancelAnimationFrame(autoPanRequestRef.current);
            autoPanRequestRef.current = null;
        }
    }, []);

    const handleCanvasMouseMove = (e: React.MouseEvent) => {
        if (isSelectingForExport) {
            if (!selectionStart) return;
            const canvasEl = canvasRef.current;
            if (!canvasEl) return;
            const canvasRect = canvasEl.getBoundingClientRect();
            let panX = 0, panY = 0;
            if (e.clientX < canvasRect.left + AUTO_PAN_MARGIN) panX = AUTO_PAN_SPEED;
            if (e.clientX > canvasRect.right - AUTO_PAN_MARGIN) panX = -AUTO_PAN_SPEED;
            if (e.clientY < canvasRect.top + AUTO_PAN_MARGIN) panY = AUTO_PAN_SPEED;
            if (e.clientY > canvasRect.bottom - AUTO_PAN_MARGIN) panY = -AUTO_PAN_SPEED;
            
            const { x: currentX, y: currentY } = screenToCanvasCoords(e.clientX, e.clientY);
            setSelectionRect({
                x: Math.min(selectionStart.x, currentX),
                y: Math.min(selectionStart.y, currentY),
                width: Math.abs(currentX - selectionStart.x),
                height: Math.abs(currentY - selectionStart.y)
            });
            stopAutoPan();
            if (panX !== 0 || panY !== 0) {
                const autoPan = () => {
                    setPan(prev => ({ x: prev.x + panX, y: prev.y + panY }));
                    autoPanRequestRef.current = requestAnimationFrame(autoPan);
                };
                autoPanRequestRef.current = requestAnimationFrame(autoPan);
            }
            return;
        }
        if (!isPanning.current) return;
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleCanvasMouseUp = () => {
        if (isSelectingForExport) {
            stopAutoPan();
            if (selectionRect && selectionRect.width > 5 && selectionRect.height > 5) {
                onAreaSelectedForExport(selectionRect);
            }
            setSelectionStart(null);
            setSelectionRect(null);
            return;
        }
        isPanning.current = false;
    };
    
    const handleWheel = (e: React.WheelEvent) => {
        if (isSelectingForExport) { e.preventDefault(); return; }
        if (e.ctrlKey) {
            e.preventDefault();
            const delta = e.deltaY * -0.001;
            setZoom(Math.max(0.2, Math.min(2, zoom + delta)));
        } else {
            e.preventDefault();
            setPan(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
        }
    };
    
    const handleCanvasTouchStart = (e: React.TouchEvent) => {
        if ((e.target as HTMLElement).closest('.select-none')) return;
    
        if (e.touches.length === 1) {
            e.preventDefault();
            isPanning.current = true;
            lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        } else if (e.touches.length === 2) {
            e.preventDefault();
            isPanning.current = false; // Disable panning when zooming
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            pinchStartDistance.current = Math.sqrt(dx * dx + dy * dy);
            pinchStartZoom.current = zoom;
        }
    };

    const handleCanvasTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 1 && isPanning.current) {
            e.preventDefault();
            const touch = e.touches[0];
            const dx = touch.clientX - lastMousePos.current.x;
            const dy = touch.clientY - lastMousePos.current.y;
            setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            lastMousePos.current = { x: touch.clientX, y: touch.clientY };
        } else if (e.touches.length === 2 && pinchStartDistance.current !== null && pinchStartZoom.current !== null) {
            e.preventDefault();
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const dx = touch1.clientX - touch2.clientX;
            const dy = touch1.clientY - touch2.clientY;
            const newDistance = Math.sqrt(dx * dx + dy * dy);
            const scale = newDistance / pinchStartDistance.current;
            const newZoom = pinchStartZoom.current * scale;
            setZoom(Math.max(0.2, Math.min(2, newZoom)));
        }
    };

    const handleCanvasTouchEnd = () => {
        isPanning.current = false;
        pinchStartDistance.current = null;
        pinchStartZoom.current = null;
    };
    
    const getConnectionPath = useCallback((fromId: string, toId: string) => {
        const fromElement = imageRefs.current[fromId] || nodeRefs.current[fromId] || itemRefs.current[fromId];
        const toElement = nodeRefs.current[toId];
        if (!fromElement || !toElement || !canvasRef.current) return null;
        
        const points = getClosestConnectionPoints(fromElement, toElement);
        const canvasRect = canvasRef.current.getBoundingClientRect();
        
        const fromCanvas = { x: (points.from.x - canvasRect.left - pan.x) / zoom, y: (points.from.y - canvasRect.top - pan.y) / zoom };
        const toCanvas = { x: (points.to.x - canvasRect.left - pan.x) / zoom, y: (points.to.y - canvasRect.top - pan.y) / zoom };
        
        return getLinePath(fromCanvas.x, fromCanvas.y, toCanvas.x, toCanvas.y);
    }, [pan, zoom]);

    const getNodeToItemConnectionPath = useCallback((nodeId: string, itemId: string) => {
        const fromElement = nodeRefs.current[nodeId];
        const toElement = itemRefs.current[itemId];
        if (!fromElement || !toElement || !canvasRef.current) return null;
        
        const points = getClosestConnectionPoints(fromElement, toElement);
        const canvasRect = canvasRef.current.getBoundingClientRect();

        const fromCanvas = { x: (points.from.x - canvasRect.left - pan.x) / zoom, y: (points.from.y - canvasRect.top - pan.y) / zoom };
        const toCanvas = { x: (points.to.x - canvasRect.left - pan.x) / zoom, y: (points.to.y - canvasRect.top - pan.y) / zoom };
        
        return getLinePath(fromCanvas.x, fromCanvas.y, toCanvas.x, toCanvas.y);
    }, [pan, zoom]);
    
    const getOutputConnectionPath = useCallback((sourceNodeId: string, outputCardId: string) => {
        const fromElement = nodeRefs.current[sourceNodeId];
        const toElement = outputCardRefs.current[outputCardId];
        if (!fromElement || !toElement || !canvasRef.current) return null;
        
        const points = getClosestConnectionPoints(fromElement, toElement);
        const canvasRect = canvasRef.current.getBoundingClientRect();

        const fromCanvas = { x: (points.from.x - canvasRect.left - pan.x) / zoom, y: (points.from.y - canvasRect.top - pan.y) / zoom };
        const toCanvas = { x: (points.to.x - canvasRect.left - pan.x) / zoom, y: (points.to.y - canvasRect.top - pan.y) / zoom };
        
        return getLinePath(fromCanvas.x, fromCanvas.y, toCanvas.x, toCanvas.y);
    }, [pan, zoom]);

    const getDrawingLinePath = useCallback(() => {
        if (!drawingLine) return null;
        return getLinePath(drawingLine.fromPos.x, drawingLine.fromPos.y, drawingLine.toMouse.x, drawingLine.toMouse.y);
    }, [drawingLine]);

    const handleDragEnter = (e: React.DragEvent) => {
        if (isViewer) return;
        e.preventDefault(); e.stopPropagation();
        dragCounter.current++;
        if (e.dataTransfer.items?.length > 0) setIsDraggingOver(true);
    };
    const handleDragLeave = (e: React.DragEvent) => {
        if (isViewer) return;
        e.preventDefault(); e.stopPropagation();
        dragCounter.current--;
        if (dragCounter.current === 0) setIsDraggingOver(false);
    };
    const handleDragOver = (e: React.DragEvent) => { if (!isViewer) { e.preventDefault(); e.stopPropagation(); }};
    const handleDrop = (e: React.DragEvent) => {
        if (isViewer) return;
        e.preventDefault(); e.stopPropagation();
        dragCounter.current = 0;
        setIsDraggingOver(false);
        if (e.dataTransfer.files?.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file?.type.startsWith('image/')) onImageUpload(file);
            e.dataTransfer.items ? e.dataTransfer.items.clear() : e.dataTransfer.clearData();
        }
    };


    return (
        <div 
            ref={canvasRef} 
            className="w-full h-full relative overflow-hidden bg-[#E0E5EC] dark:bg-[#212428] bg-[radial-gradient(#CED2D9_1px,transparent_1px)] dark:bg-[radial-gradient(#464D56_1px,transparent_1px)] [background-size:16px_16px]"
            style={{ cursor: isPanning.current ? 'grabbing' : 'grab' }}
            onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp} onMouseLeave={handleCanvasMouseUp}
            onWheel={handleWheel}
            onTouchStart={handleCanvasTouchStart} onTouchMove={handleCanvasTouchMove} onTouchEnd={handleCanvasTouchEnd}
            onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
        >
             {isDraggingOver && <div className="absolute inset-0 bg-[#44A0D1]/20 dark:bg-[#54C1FB]/20 backdrop-blur-sm border-4 border-dashed border-[#44A0D1] dark:border-[#54C1FB] flex items-center justify-center pointer-events-none z-50 transition-all duration-300"><div className="text-center text-[#212428] dark:text-[#E0E5EC]"><svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><p className="mt-4 text-2xl font-bold">Drop image to add to canvas</p></div></div>}
             <ZoomControls zoom={zoom} onZoomIn={onZoomIn} onZoomOut={onZoomOut} onZoomReset={onZoomReset} />
            <div ref={ref} className="absolute top-0 left-0" style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`, transformOrigin: '0 0' }}>
                <svg className="absolute top-0 left-0 w-[5000px] h-[5000px] pointer-events-none">
                    {Object.entries(connections).flatMap(([toId, fromIds]) => 
                        Array.isArray(fromIds) ? fromIds.map(fromId => {
                            const path = getConnectionPath(fromId, toId);
                            return path ? <path key={`${fromId}-${toId}`} d={path} className="stroke-[#CED2D9] dark:stroke-[#464D56]" strokeWidth="2" fill="none" /> : null;
                        }) : []
                    )}
                    {Object.entries(itemConnections).flatMap(([itemId, nodeIds]) => 
                        Array.isArray(nodeIds) ? nodeIds.map(nodeId => {
                            const path = getNodeToItemConnectionPath(nodeId, itemId);
                            return path ? <path key={`${nodeId}-${itemId}`} d={path} className="stroke-[#CED2D9] dark:stroke-[#464D56]" strokeWidth="2" fill="none" /> : null;
                        }) : []
                    )}
                     {outputCards.map(card => {
                        if (!card.sourceNodeId) return null;
                        const path = getOutputConnectionPath(card.sourceNodeId, card.id);
                        return path ? <path key={`output-${card.id}`} d={path} className="stroke-green-500/50 dark:stroke-green-400/50" strokeWidth="2" strokeDasharray="4,4" fill="none" /> : null;
                    })}
                    {drawingLine && <path d={getDrawingLinePath() || ''} className="stroke-[#44A0D1] dark:stroke-[#54C1FB]" strokeWidth="2" fill="none" strokeDasharray="5,5" />}
                </svg>

                {/* FIX: Changed ref callback to a block statement to ensure it doesn't return a value, which is required for ref callbacks. */}
                {analyzedImages.map(image => <ImageCard key={image.id} isViewer={isViewer} ref={el => { imageRefs.current[image.id] = el; }} image={image} onRemove={() => onRemoveImage(image.id)} onPositionChange={(pos) => onImagePositionChange(image.id, pos)} onStartConnection={(imageId, e) => handleStartConnection(imageId, 'image', e)} isCapturing={isCapturing} />)}
                {/* FIX: Changed ref callback to a block statement to ensure it doesn't return a value, which is required for ref callbacks. */}
                {items.map(item => <ItemCard key={item.id} isViewer={isViewer} ref={el => { itemRefs.current[item.id] = el; }} item={item} onRemove={() => onRemoveItem(item.id)} onPositionChange={(pos) => onItemPositionChange(item.id, pos)} onStartConnection={(itemId, e) => handleStartConnection(itemId, 'item', e)} onEndConnection={handleEndConnectionOnItem} isCapturing={isCapturing} />)}
                {/* FIX: Changed ref callback to a block statement to ensure it doesn't return a value, which is required for ref callbacks. */}
                {outputCards.map(card => <OutputCardComponent key={card.id} isViewer={isViewer} ref={el => { outputCardRefs.current[card.id] = el; }} card={card} onRemove={() => onRemoveOutputCard(card.id)} onPositionChange={(pos) => onOutputCardPositionChange(card.id, pos)} />)}
                
                {nodes.map(node => (
                    <Node 
                        key={node.id}
                        isViewer={isViewer}
                        ref={el => { if (el) nodeRefs.current[node.id] = el; }}
                        nodeId={node.id}
                        nodeName={node.name}
                        isOutput={node.isOutput}
                        position={node.position}
                        onPositionChange={(pos) => onNodePositionChange(node.id, pos)}
                        onEndConnection={() => handleEndConnectionOnNode(node.id)}
                        onStartConnection={(nodeId, e) => handleStartConnection(nodeId, 'node', e)}
                        connectedIds={connections[node.id] || []}
                        onDisconnect={(fromId) => onDisconnect(node.id, fromId)}
                        onRemove={() => onRemoveNode(node.id)}
                        outputState={node.outputState}
                        onGenerateOutput={onGenerateOutput}
                        onSetOutputNodeMode={onSetOutputNodeMode}
                        contextData={node.contextData}
                        onUpdateNodeContext={onUpdateNodeContext}
                    />
                ))}
            </div>
        </div>
    );
});
Canvas.displayName = 'Canvas';