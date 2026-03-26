const CATEGORY_MAP: Record<string, string> = {
  'feat': 'n', 'feature': 'n', 'enhancement': 'n', 'improvement': 'n', 'melhoria': 'n',
  'fix': 'f', 'bugfix': 'f', 'bug': 'f', 'hotfix': 'f', 'correcao': 'f', 'correção': 'f',
  'update': 'u', 'chore': 'u', 'refactor': 'u', 'atualizacao': 'u', 'atualização': 'u',
};

export function normalizeCommitMessage(rawText: string, lang: string = 'en'): string {
  let clean = rawText.replace(/```/g, '').replace(/commit:/gi, '').trim();
  
  const lines = clean.split('\n').filter(l => l.trim());
  
  if (lines.length === 0) {
    return lang === 'pt' ? 'atualização: mudanças gerais' : 'update: general changes';
  }
  
  let title = lines[0].slice(0, 50).trim();
  
  if (!/^(feat|fix|update|chore|refactor|docs|style|test|build|ci)/i.test(title)) {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('fix') || lowerTitle.includes('bug') || lowerTitle.includes('correç')) {
      title = `fix: ${title}`;
    } else if (lowerTitle.includes('add') || lowerTitle.includes('new') || lowerTitle.includes('novo')) {
      title = `feat: ${title}`;
    } else {
      title = `update: ${title}`;
    }
  }
  
  const bodyLines = lines.slice(1).map(line => {
    const trimmed = line.trim();
    const match = trimmed.match(/^(feat|fix|update|chore|refactor|feature|bug|melhoria|correç[aã]o)\s*[:\-]?\s*(.+)$/i);
    
    if (match) {
      const marker = CATEGORY_MAP[match[1].toLowerCase()] || 'u';
      return `- ${marker} ${match[2].trim()}`;
    }
    
    if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•')) {
      return `- u ${trimmed.replace(/^[-*•]\s*/, '').trim()}`;
    }
    
    return `- u ${trimmed}`;
  });
  
  if (bodyLines.length > 0) {
    return `${title}\n\n${bodyLines.join('\n')}`;
  }
  
  return title;
}
