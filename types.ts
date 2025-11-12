// FIX: Defined the Color interface to resolve a circular import error.
export interface Color {
  hex: string;
  name: string;
}

export interface MoodBoard {
  colors: Color[];
  emotions: string[];
  styles: string[];
  textures: string[];
}

export interface AnalysisResult {
  detailedDescription: string;
  moodBoard: MoodBoard;
}

export interface NodeAnalysis {
  analysis: any;
  isLoading: boolean;
  error: string | null;
}

export interface AnalyzedImage {
  id: string;
  imageDataUrl: string;
  base64: string;
  mimeType: string;
  results: Partial<Record<string, NodeAnalysis>>; // Key is CanvasNode.id
  position: { x: number; y: number; };
}

export interface Item {
  id: string;
  rawData: Record<string, string>;
  analyzedData: { keywords: string[] } | null;
  isAnalyzing: boolean;
  analysisError: string | null;
  position: { x: number; y: number; };
}

// FIX: Added missing ItemWithInspirations interface to resolve import error.
export interface ItemWithInspirations {
  item: Item;
  inspirations: Partial<Record<NodeType, any[]>>;
}

export interface OutputCard {
  id: string;
  prompt: string;
  type: 'positive' | 'negative' | 'consolidated';
  position: { x: number; y: number; };
  sourceNodeId: string; // The ID of the Output Node that created it
}

export interface OutputNodeState {
    mode: 'consolidated' | 'double-output';
    isLoading: boolean;
}

export interface ContextNodeData {
    text: string;
}

// Default node types are now only for concepts. Output is a special, instantiable type.
export const defaultNodeTypes = ['Color Palette', 'Style', 'Texture', 'Material', 'Aesthetic', 'Moodboard'] as const;
export type NodeType = string;

export interface CanvasNode {
    id: string; // Unique identifier, e.g., 'style', 'custom-node-1', 'output-1'
    name: string; // Display name, e.g., 'Style', 'My Concept', 'Output', 'Context'
    isOutput: boolean;
    position: { x: number; y: number; };
    // for output nodes only
    outputState?: OutputNodeState;
    // for context nodes only
    contextData?: ContextNodeData;
}

// Key is CanvasNode.id or AnalyzedImage.id or Item.id
// FIX: Corrected typo from 'record' to 'Record'.
export type NodeConnections = Partial<Record<string, string[]>>;

export interface SavableAnalyzedImage {
  id:string;
  base64: string;
  mimeType: string;
  results: Partial<Record<string, { analysis: any }>>; // Key is CanvasNode.id
  position: { x: number; y: number; };
}

export type AiProvider = 'local';

export interface Settings {
  provider: AiProvider;
  localUrl: string;
}

export interface SaveState {
  version: 9;
  analyzedImages: SavableAnalyzedImage[];
  connections: NodeConnections;
  nodes: CanvasNode[];
  settings?: Settings;
  items?: Item[];
  itemConnections?: Record<string, string[]>;
  outputCards?: OutputCard[];
}