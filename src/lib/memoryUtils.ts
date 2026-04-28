
interface Memory {
  id: string;
  personaId: string;
  content: string;
  type: 'short' | 'mid' | 'long';
  importance: 'low' | 'medium' | 'high';
  timestamp: number;
}

export function addMemory(personaId: string, content: string, type: 'short' | 'mid' | 'long' = 'short', importance: 'low' | 'medium' | 'high' = 'medium') {
  try {
    const saved = localStorage.getItem('memory_center_data');
    const memories: Memory[] = saved ? JSON.parse(saved) : [];
    
    // Check for duplicates in recent memories
    const isDuplicate = memories.some(m => m.personaId === personaId && m.content === content);
    if (isDuplicate) return;

    const newMemory: Memory = {
      id: Date.now().toString(),
      personaId,
      content,
      type,
      importance,
      timestamp: Date.now()
    };
    
    localStorage.setItem('memory_center_data', JSON.stringify([newMemory, ...memories]));
    
    // Protocol: Automation Feedback
    console.log(`[Action: Save_Memory | Persona: ${personaId} | Content: "${content}"]`);
  } catch (e) {
    console.error("Failed to add memory:", e);
  }
}

export function getPersonaMemories(personaId: string): string {
  try {
    const saved = localStorage.getItem('memory_center_data');
    if (!saved) return "";
    
    const memories: Memory[] = JSON.parse(saved);
    const related = memories.filter(m => m.personaId === personaId);
    
    if (related.length === 0) return "";
    
    const longTerm = related.filter(m => m.type === 'long').map(m => `• ${m.content}`).join('\n');
    const midTerm = related.filter(m => m.type === 'mid').map(m => `• ${m.content}`).join('\n');
    const shortTerm = related.filter(m => m.type === 'short').map(m => `• ${m.content}`).join('\n');
    
    let context = "\n\n【记忆中枢 - 检索到的相关记忆】\n";
    if (longTerm) context += `长期记忆：\n${longTerm}\n`;
    if (midTerm) context += `中期记忆：\n${midTerm}\n`;
    if (shortTerm) context += `短期记忆：\n${shortTerm}\n`;
    
    return context;
  } catch (e) {
    console.error("Failed to get memories:", e);
    return "";
  }
}
