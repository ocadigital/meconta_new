import { ImageSize } from "../types";

// Helper function to call the backend AI API
const callAiApi = async (action: string, payload: any) => {
  const currentUserId = localStorage.getItem('finance_current_user_id');
  if (!currentUserId) throw new Error("Usuário não autenticado");

  // Use relative path to ensure we hit the same origin (local or deployed)
  const baseUrl = ''; 

  const response = await fetch(`${baseUrl}/api/ai`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': currentUserId
    },
    body: JSON.stringify({ action, payload })
  });

  if (!response.ok) {
    let errorMsg = "Erro na comunicação com IA";
    try {
        const errorData = await response.json();
        if (errorData.error === 'LIMIT_REACHED') {
           throw new Error(`LIMIT_REACHED:${errorData.plan}:${errorData.feature}`);
        }
        
        // Debugging Aid: If backend returns list of available vars, log it
        if (errorData.debug_available_env_vars) {
            console.error("DEBUG: Server Env Vars Available:", errorData.debug_available_env_vars);
            console.error("DEBUG: Expected 'API_KEY' or 'GOOGLE_API_KEY' but it was missing.");
        }

        errorMsg = errorData.error || errorMsg;
    } catch (e) {
        // If response is not JSON (e.g. HTML 500 page from Vercel), read text
        const text = await response.text();
        console.error("Non-JSON API Error:", text);
    }
    throw new Error(errorMsg);
  }

  const data = await response.json();
  return data.result;
};

/**
 * Analyzes a receipt image to extract financial data with context awareness.
 */
export const analyzeReceipt = async (
  base64Image: string, 
  mimeType: string,
  availableCategories: string[] = [],
  contextMapping: string = ""
): Promise<any> => {
  return callAiApi('analyze_receipt', {
    base64Image,
    mimeType,
    categories: availableCategories,
    context: contextMapping
  });
};

/**
 * Parses a PDF statement/bill to extract transaction list.
 */
export const parseStatementPDF = async (base64Pdf: string): Promise<{ date: string, description: string, amount: number, type: 'Entrada' | 'Saída' }[]> => {
    return callAiApi('analyze_pdf_statement', { base64Pdf });
};

/**
 * Batches categorize transactions based on description.
 */
export const categorizeBatch = async (
    transactions: { description: string, amount: number }[],
    availableCategories: string[]
): Promise<Record<string, string>> => {
    return callAiApi('categorize_batch', { transactions, categories: availableCategories });
};

/**
 * Chat with the AI Financial Assistant.
 */
export const chatWithFinancialAssistant = async (history: { role: string, parts: { text: string }[] }[], newMessage: string) => {
  return callAiApi('chat', {
    history,
    message: newMessage
  });
};

/**
 * Generate speech from text (TTS).
 */
export const generateSpeech = async (text: string): Promise<string | undefined> => {
  return callAiApi('tts', { text });
};

/**
 * Generate an image for visual goals.
 */
export const generateGoalImage = async (prompt: string, size: ImageSize): Promise<string | null> => {
  return callAiApi('generate_image', { prompt, size });
};