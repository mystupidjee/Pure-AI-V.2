/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


export async function bringToLife(prompt: string, fileBase64?: string, mimeType?: string): Promise<string> {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ promptText: prompt, imageBase64: fileBase64, mimeType })
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate content from backend');
    }
    
    const data = await response.json();
    return data.html;
  } catch (error) {
    console.error("Backend API Error:", error);
    throw error;
  }
}