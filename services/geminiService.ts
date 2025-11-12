// FIX: Corrected import from 'nodeTypes as defaultNodeTypes' to 'defaultNodeTypes' to match the export from ../types.
import { NodeType, Settings, ItemWithInspirations } from '../types';

const getLocalNodeSpecificPrompt = (nodeType: NodeType) => {
    switch (nodeType) {
        case 'Color Palette':
            return `Analyze this image and extract a color palette of 5-7 colors. Provide the output strictly as a JSON object that follows this exact schema: {"colors":[{"hex":"string","name":"string"}]}`;
        case 'Style':
            return `Analyze this image and identify 2-4 artistic or photographic styles. Provide the output strictly as a JSON object that follows this exact schema: {"styles":["string"]}`;
        case 'Texture':
            return `Analyze this image and identify 2-4 prominent textures. Provide the output strictly as a JSON object that follows this exact schema: {"textures":["string"}]}`;
        case 'Material':
        case 'Aesthetic':
        default:
            return `Analyze this image focusing on the concept of "${nodeType}". Provide a detailed description. Provide the output strictly as a JSON object that follows this exact schema: {"description":"string"}`;
    }
};

async function analyzeNodeConceptLocal(base64ImageData: string, mimeType: string, nodeType: NodeType, apiUrl: string): Promise<any> {
    const prompt = getLocalNodeSpecificPrompt(nodeType);
    try {
        const endpoint = new URL('/v1/chat/completions', apiUrl).toString();
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llava',
                messages: [{
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64ImageData}` } }
                    ]
                }],
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Local LLM server error: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        let jsonString = data.choices[0].message.content;

        const jsonMatch = jsonString.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
            jsonString = jsonMatch[1];
        } else {
            const jsonStart = jsonString.indexOf('{');
            const jsonEnd = jsonString.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
                jsonString = jsonString.substring(jsonStart, jsonEnd + 1);
            }
        }
        
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("Failed to communicate with local LLM server:", e);
        throw new Error("Failed to get a valid response from the local LLM server. Ensure it's running and CORS is configured.");
    }
}

async function analyzeCsvRowLocal(rowData: Record<string, string>, apiUrl: string): Promise<{ keywords: string[] }> {
    const prompt = `You are an expert product analyst. Analyze the following product data and extract a concise list of 5-7 key descriptive keywords or short phrases that capture its essence. Focus on visual and thematic attributes. Crucially, if you find any information regarding the item's size, dimensions, or scale (e.g., "large", "50cm x 30cm", "compact"), you must include it in the keywords. Provide the output strictly as a JSON object that follows this exact schema: {"keywords":["string"]}. Data: ${JSON.stringify(rowData)}`;

    try {
        const endpoint = new URL('/v1/chat/completions', apiUrl).toString();
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'mixtral',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Local LLM server error for CSV analysis: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        let jsonString = data.choices[0].message.content;

        const jsonMatch = jsonString.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
            jsonString = jsonMatch[1];
        }
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("Failed to analyze CSV row:", e);
        throw new Error("Failed to get a valid analysis for the CSV data from the local LLM server.");
    }
}


async function generateOutputPromptsLocal(
  globalInspirations: Partial<Record<NodeType, any[]>>,
  itemsWithInspirations: ItemWithInspirations[],
  contextText: string,
  mode: 'consolidated' | 'double-output',
  apiUrl: string
): Promise<any> {
    const MAX_DESC_LENGTH = 80;
    const MAX_ITEMS_PER_CATEGORY = 5;
    const MAX_DESCRIPTIONS = 2;
    const truncate = (s: string) => s.length > MAX_DESC_LENGTH ? s.substring(0, MAX_DESC_LENGTH) + '...' : s;

    let systemPrompt = `You are an expert AI prompt engineer. Your task is to synthesize a final, detailed AI image generation prompt based on a combination of overall concepts and specific product details.`;
    let userPrompt = `Synthesize a prompt based on the following elements:\n`;

    if (contextText) {
        userPrompt += `\n**Primary Goal & Theme:** The user has provided the following guidance, which should be the main driver for the final prompt: "${contextText}"\n`;
    }

    const hasGlobalInspirations = Object.keys(globalInspirations).some(key => globalInspirations[key]?.length > 0);
    if (hasGlobalInspirations) {
        userPrompt += `\n**Overall Moodboard Concepts (apply to all items unless specified otherwise):**\n`;
        if (globalInspirations['Color Palette']?.length > 0) {
            const items = [...new Set(globalInspirations['Color Palette'].flatMap(r => r.colors || []).map((c: any) => c.name))].slice(0, MAX_ITEMS_PER_CATEGORY).join(', ');
            if (items) userPrompt += `- General Colors: ${items}\n`;
        }
        if (globalInspirations['Style']?.length > 0) {
            const items = [...new Set(globalInspirations['Style'].flatMap(r => r.styles || []))].slice(0, MAX_ITEMS_PER_CATEGORY).join(', ');
            if (items) userPrompt += `- General Styles: ${items}\n`;
        }
        if (globalInspirations['Texture']?.length > 0) {
            const items = [...new Set(globalInspirations['Texture'].flatMap(r => r.textures || []))].slice(0, MAX_ITEMS_PER_CATEGORY).join(', ');
            if (items) userPrompt += `- General Textures: ${items}\n`;
        }
        if (globalInspirations['Material']?.length > 0) {
            const items = globalInspirations['Material'].slice(0, MAX_DESCRIPTIONS).map(r => `"${truncate(r.description)}"`).join('; ');
            if (items) userPrompt += `- General Materials inspired by: ${items}\n`;
        }
        if (globalInspirations['Aesthetic']?.length > 0) {
            const items = globalInspirations['Aesthetic'].slice(0, MAX_DESCRIPTIONS).map(r => `"${truncate(r.description)}"`).join('; ');
            if (items) userPrompt += `- General Aesthetics inspired by: ${items}\n`;
        }
    }

    const hasItems = itemsWithInspirations.length > 0;
    if (hasItems) {
        userPrompt += `\n**Specific Product Details:**\n`;
        itemsWithInspirations.forEach((itemInfo, index) => {
            const itemName = itemInfo.item.rawData.Name || itemInfo.item.rawData.Product || `Item ${index + 1}`;
            const itemKeywords = itemInfo.item.analyzedData?.keywords?.join(', ');

            if (itemKeywords) {
                userPrompt += `\n--- Item: ${itemName} ---\n`;
                userPrompt += `  - Key Characteristics: ${itemKeywords}\n`;
            } else {
                 const itemDetails = Object.entries(itemInfo.item.rawData).map(([key, value]) => `${key}: ${value}`).join(', ');
                 userPrompt += `\n--- Item ${index + 1}: ${itemDetails} ---\n`;
            }
            
            const itemInspirationKeys = Object.keys(itemInfo.inspirations);
            if (itemInspirationKeys.length > 0) {
                userPrompt += `  This item should also be specifically influenced by:\n`;
                 if (itemInfo.inspirations['Color Palette']?.length > 0) {
                     const items = [...new Set(itemInfo.inspirations['Color Palette'].flatMap(r => r.colors || []).map((c: any) => c.name))].slice(0, MAX_ITEMS_PER_CATEGORY).join(', ');
                     if (items) userPrompt += `  - Colors: ${items}\n`;
                 }
                 if (itemInfo.inspirations['Style']?.length > 0) {
                     const items = [...new Set(itemInfo.inspirations['Style'].flatMap(r => r.styles || []))].slice(0, MAX_ITEMS_PER_CATEGORY).join(', ');
                     if (items) userPrompt += `  - Styles: ${items}\n`;
                 }
                 if (itemInfo.inspirations['Texture']?.length > 0) {
                     const items = [...new Set(itemInfo.inspirations['Texture'].flatMap(r => r.textures || []))].slice(0, MAX_ITEMS_PER_CATEGORY).join(', ');
                     if (items) userPrompt += `  - Textures: ${items}\n`;
                 }
                 if (itemInfo.inspirations['Material']?.length > 0) {
                     const items = itemInfo.inspirations['Material'].slice(0, MAX_DESCRIPTIONS).map(r => `"${truncate(r.description)}"`).join('; ');
                     if (items) userPrompt += `  - Materials: ${items}\n`;
                 }
                 if (itemInfo.inspirations['Aesthetic']?.length > 0) {
                     const items = itemInfo.inspirations['Aesthetic'].slice(0, MAX_DESCRIPTIONS).map(r => `"${truncate(r.description)}"`).join('; ');
                     if (items) userPrompt += `  - Aesthetics: ${items}\n`;
                 }
            } else if (hasGlobalInspirations) {
                userPrompt += `  This item should follow the overall moodboard concepts.\n`;
            }
        });
        userPrompt += `\n--- End of Items ---\n`;
    }
    
    if (mode === 'consolidated') {
        userPrompt += `\nNow, combine all these elements into a single, masterful, and detailed prompt paragraph describing a new, specific scene or product shot that cohesively represents all the inputs. If multiple items are listed, create a single scene that features them together.`;
    } else { // double-output
        systemPrompt += ` Your task is to create a "positive" prompt (what to include) and a "negative" prompt (what to avoid) for a Stable Diffusion model. Provide the output strictly as a JSON object that follows this exact schema: {"positivePrompt":"string", "negativePrompt":"string"}.`;
        userPrompt += `\nBased on these elements, generate a detailed positive prompt and a concise negative prompt. The positive prompt should be a rich, descriptive paragraph for a single cohesive scene. The negative prompt should list undesirable elements like "blurry, ugly, deformed, text, watermark, bad art, extra limbs".`;
    }
    
    try {
        const endpoint = new URL('/v1/chat/completions', apiUrl).toString();
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'mixtral',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                temperature: 0.7,
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Local LLM server error: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        let content = data.choices[0].message.content;

        if (mode === 'double-output') {
             const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch && jsonMatch[1]) {
                content = jsonMatch[1];
            }
            return JSON.parse(content);
        }
        return { consolidatedPrompt: content.trim() };

    } catch(e) {
        console.error("Failed to communicate with local LLM server for output generation:", e);
        throw new Error("Failed to get a valid response from the local LLM server for output generation.");
    }
}


// --- Dispatcher Functions ---

export async function analyzeNodeConcept(base64ImageData: string, mimeType: string, nodeType: NodeType, settings: Settings): Promise<any> {
    return analyzeNodeConceptLocal(base64ImageData, mimeType, nodeType, settings.localUrl);
}

export async function analyzeCsvRow(rowData: Record<string, string>, settings: Settings): Promise<{ keywords: string[] }> {
    return analyzeCsvRowLocal(rowData, settings.localUrl);
}

export async function generateOutputPrompts(
  globalInspirations: Partial<Record<NodeType, any[]>>,
  itemsWithInspirations: ItemWithInspirations[],
  contextText: string,
  mode: 'consolidated' | 'double-output',
  settings: Settings
): Promise<any> {
  return generateOutputPromptsLocal(globalInspirations, itemsWithInspirations, contextText, mode, settings.localUrl);
}