/**
 * Error Solutions - Database of solutions for each error type
 * Single Responsibility: Provide actionable solutions for errors
 */

import {
  ErrorCategory,
  ErrorSubtype,
  GitErrorSubtype,
  AIErrorSubtype,
  NetworkErrorSubtype,
  ConfigErrorSubtype,
} from './error-classifier';

export interface ErrorSolution {
  title: string;
  cause: string;
  explanation: string;
  solutions: Array<{
    description: string;
    command?: string;
    docs?: string;
  }>;
  docs?: string;
}

/**
 * Git error solutions
 */
const GIT_SOLUTIONS: Record<GitErrorSubtype, ErrorSolution> = {
  SUBMODULE_EMPTY: {
    title: 'Submódulo ou repositório aninhado sem commits',
    cause: 'O diretório "{directory}" contém um repositório Git inicializado mas sem nenhum commit. O Git não consegue indexar um repositório vazio.',
    explanation: 'Isso acontece quando você executa "git init" dentro de um subdiretório mas não faz nenhum commit, ou quando um submódulo não foi inicializado corretamente.',
    solutions: [
      {
        description: 'Remover o diretório problemático:',
        command: 'rm -rf {directory}',
      },
      {
        description: 'Adicionar ao .gitignore para ignorar:',
        command: 'echo "{directory}/" >> .gitignore',
      },
      {
        description: 'Se for um submódulo válido, inicializar com um commit:',
        command: 'cd {directory} && git commit --allow-empty -m "Initial commit"',
      },
    ],
  },

  NOT_REPO: {
    title: 'Não é um repositório Git',
    cause: 'O diretório atual não contém um repositório Git inicializado.',
    explanation: 'O comando executado requer um repositório Git, mas o diretório atual não possui a pasta .git necessária.',
    solutions: [
      {
        description: 'Inicializar um novo repositório Git:',
        command: 'git init',
      },
      {
        description: 'Ou clonar um repositório existente:',
        command: 'git clone <url>',
      },
    ],
  },

  NO_CHANGES: {
    title: 'Nenhuma mudança para commitar',
    cause: 'Não há arquivos modificados ou novos arquivos para adicionar ao commit.',
    explanation: 'Todas as mudanças já foram commitadas ou não há arquivos modificados no diretório de trabalho.',
    solutions: [
      {
        description: 'Verificar status dos arquivos:',
        command: 'git status',
      },
      {
        description: 'Criar ou modificar um arquivo para commitar:',
        command: 'echo "content" > file.txt',
      },
    ],
  },

  PUSH_REJECTED: {
    title: 'Push rejeitado (non-fast-forward)',
    cause: 'O repositório remoto possui commits que você não tem localmente.',
    explanation: 'Outra pessoa (ou você em outra máquina) fez push de commits para o remoto. Você precisa integrar essas mudanças antes de fazer push.',
    solutions: [
      {
        description: 'Puxar as mudanças do remoto e fazer rebase:',
        command: 'git pull --rebase',
      },
      {
        description: 'Ou fazer merge das mudanças:',
        command: 'git pull',
      },
      {
        description: 'Após resolver conflitos, tentar push novamente:',
        command: 'git push',
      },
    ],
  },

  CONFLICT: {
    title: 'Conflito de merge detectado',
    cause: 'Existem conflitos entre as mudanças locais e remotas no arquivo "{file}".',
    explanation: 'O Git não consegue mesclar automaticamente as mudanças porque ambas as versões modificaram as mesmas linhas.',
    solutions: [
      {
        description: 'Verificar arquivos em conflito:',
        command: 'git status',
      },
      {
        description: 'Editar o arquivo conflitante e resolver manualmente',
      },
      {
        description: 'Após resolver, adicionar o arquivo:',
        command: 'git add {file}',
      },
      {
        description: 'Continuar o rebase ou merge:',
        command: 'git rebase --continue  # ou git commit',
      },
    ],
  },

  MERGE_CONFLICT: {
    title: 'Conflito de merge',
    cause: 'Múltiplos arquivos possuem conflitos que precisam ser resolvidos manualmente.',
    explanation: 'Durante o merge, foram detectadas mudanças conflitantes que o Git não consegue resolver automaticamente.',
    solutions: [
      {
        description: 'Listar arquivos conflitantes:',
        command: 'git diff --name-only --diff-filter=U',
      },
      {
        description: 'Abrir cada arquivo e resolver os conflitos (marcados com <<<<<<< e >>>>>>>)',
      },
      {
        description: 'Após resolver todos, finalizar o merge:',
        command: 'git add . && git commit',
      },
    ],
  },

  UNTRACKED_FILES: {
    title: 'Arquivos não rastreados',
    cause: 'Existem arquivos no diretório que não estão sendo rastreados pelo Git.',
    explanation: 'Arquivos novos não são automaticamente adicionados ao controle de versão.',
    solutions: [
      {
        description: 'Adicionar todos os arquivos novos:',
        command: 'git add .',
      },
      {
        description: 'Ou adicionar arquivos específicos:',
        command: 'git add <arquivo>',
      },
    ],
  },

  PERMISSION_DENIED: {
    title: 'Permissão negada',
    cause: 'Você não tem permissão para acessar o repositório ou arquivo.',
    explanation: 'O usuário atual não possui as credenciais necessárias para a operação.',
    solutions: [
      {
        description: 'Verificar se você tem acesso ao repositório remoto',
      },
      {
        description: 'Configurar credenciais SSH:',
        command: 'ssh-keygen -t ed25519 -C "seu@email.com"',
      },
      {
        description: 'Ou usar HTTPS com token de acesso:',
        command: 'git remote set-url origin https://<token>@github.com/user/repo.git',
      },
    ],
  },

  HOOK_FAILED: {
    title: 'Hook do Git falhou',
    cause: 'Um hook pre-commit ou pre-push falhou e impediu a operação.',
    explanation: 'Hooks são scripts que rodam automaticamente antes de certas operações. Um deles retornou erro.',
    solutions: [
      {
        description: 'Verificar qual hook está falhando:',
        command: 'ls -la .git/hooks/',
      },
      {
        description: 'Corrigir os problemas apontados pelo hook',
      },
      {
        description: 'Ou pular hooks temporariamente (não recomendado):',
        command: 'git commit --no-verify',
      },
    ],
  },

  LFS_ERROR: {
    title: 'Erro no Git LFS',
    cause: 'Problemas com arquivos grandes gerenciados pelo Git LFS.',
    explanation: 'O Git LFS não conseguiu processar um ou mais arquivos grandes.',
    solutions: [
      {
        description: 'Verificar status do LFS:',
        command: 'git lfs status',
      },
      {
        description: 'Puxar arquivos LFS:',
        command: 'git lfs pull',
      },
    ],
  },

  UNKNOWN: {
    title: 'Erro Git desconhecido',
    cause: 'Ocorreu um erro Git não catalogado.',
    explanation: 'O erro não foi reconhecido pelo sistema de classificação.',
    solutions: [
      {
        description: 'Verificar mensagem de erro completa',
      },
      {
        description: 'Consultar documentação do Git:',
        docs: 'https://git-scm.com/docs',
      },
    ],
  },
};

/**
 * AI error solutions
 */
const AI_SOLUTIONS: Record<AIErrorSubtype, ErrorSolution> = {
  NO_PROVIDER: {
    title: 'Nenhum provedor de IA disponível',
    cause: 'Nenhuma API key foi configurada no arquivo .env.',
    explanation: 'O Cogit precisa de pelo menos uma chave de API para gerar mensagens de commit inteligentes.',
    solutions: [
      {
        description: 'Criar arquivo .env na raiz do projeto:',
        command: 'cp .env.example .env',
      },
      {
        description: 'Adicionar pelo menos uma API key no .env:',
        command: 'OPENROUTER_API_KEY=sua_chave_aqui',
      },
      {
        description: 'Verificar provedores disponíveis:',
        command: 'cogit check-ai',
      },
    ],
    docs: 'https://openrouter.ai/keys',
  },

  CONNECTION_FAILED: {
    title: 'Falha na conexão com provedor de IA',
    cause: 'Não foi possível conectar ao servidor {provider} em {url}.',
    explanation: 'O servidor de IA não está respondendo. Pode ser problema de rede, servidor offline, ou firewall bloqueando a conexão.',
    solutions: [
      {
        description: 'Verificar conexão com a internet',
      },
      {
        description: 'Se usando Ollama local, iniciar o servidor:',
        command: 'ollama serve',
      },
      {
        description: 'Verificar se o modelo está instalado (Ollama):',
        command: 'ollama list',
      },
      {
        description: 'Baixar modelo se necessário:',
        command: 'ollama pull qwen3.5:4b',
      },
    ],
  },

  MODEL_NOT_FOUND: {
    title: 'Modelo não encontrado',
    cause: 'O modelo "{model}" não está disponível ou não foi instalado.',
    explanation: 'O modelo especificado no .env não existe no provedor ou não foi baixado (Ollama).',
    solutions: [
      {
        description: 'Para Ollama, baixar o modelo:',
        command: 'ollama pull {model}',
      },
      {
        description: 'Listar modelos disponíveis:',
        command: 'ollama list',
      },
      {
        description: 'Verificar nome do modelo no .env',
      },
    ],
  },

  RATE_LIMIT: {
    title: 'Limite de requisições excedido',
    cause: 'O provedor de IA limitou o número de requisições.',
    explanation: 'Você excedeu o limite gratuito ou o limite por minuto do provedor.',
    solutions: [
      {
        description: 'Aguardar alguns segundos e tentar novamente',
      },
      {
        description: 'Verificar plano e limites no site do provedor',
      },
      {
        description: 'Considerar usar outro provedor (fallback automático)',
      },
    ],
  },

  AUTH_INVALID: {
    title: 'Chave de API inválida',
    cause: 'A chave de API configurada não é válida ou expirou.',
    explanation: 'A API key foi rejeitada pelo servidor. Pode estar incorreta, expirada, ou revogada.',
    solutions: [
      {
        description: 'Verificar se a chave está correta no .env',
      },
      {
        description: 'Gerar nova chave no painel do provedor',
      },
      {
        description: 'Para OpenRouter: https://openrouter.ai/keys',
        docs: 'https://openrouter.ai/keys',
      },
    ],
  },

  TIMEOUT: {
    title: 'Timeout na requisição',
    cause: 'O servidor demorou muito para responder.',
    explanation: 'A conexão foi interrompida por demorar mais que o tempo limite configurado.',
    solutions: [
      {
        description: 'Verificar conexão com a internet',
      },
      {
        description: 'Tentar novamente em alguns instantes',
      },
      {
        description: 'Se persistir, usar provedor alternativo',
      },
    ],
  },

  RESPONSE_INVALID: {
    title: 'Resposta inválida da IA',
    cause: 'A IA retornou uma resposta em formato inesperado.',
    explanation: 'O modelo pode ter gerado uma resposta que não pode ser processada.',
    solutions: [
      {
        description: 'Tentar regenerar a mensagem',
      },
      {
        description: 'Usar outro provedor de IA',
      },
    ],
  },

  ALL_FAILED: {
    title: 'Todas as IAs falharam',
    cause: 'Nenhum dos provedores de IA configurados conseguiu gerar uma mensagem.',
    explanation: 'Todos os provedores tentados retornaram erro. Isso pode indicar problemas de rede ou configuração.',
    solutions: [
      {
        description: 'Verificar conexão com a internet:',
        command: 'ping google.com',
      },
      {
        description: 'Verificar status dos provedores:',
        command: 'cogit check-ai',
      },
      {
        description: 'Você pode optar por:',
      },
      {
        description: '  - Digitar sua própria mensagem de commit',
      },
      {
        description: '  - Usar uma mensagem genérica automática',
      },
      {
        description: '  - Abortar e corrigir o problema',
      },
    ],
  },

  UNKNOWN: {
    title: 'Erro de IA desconhecido',
    cause: 'Ocorreu um erro não catalogado com o provedor de IA.',
    explanation: 'O erro não foi reconhecido pelo sistema de classificação.',
    solutions: [
      {
        description: 'Verificar mensagem de erro completa',
      },
      {
        description: 'Executar diagnóstico:',
        command: 'cogit check-ai',
      },
    ],
  },
};

/**
 * Network error solutions
 */
const NETWORK_SOLUTIONS: Record<NetworkErrorSubtype, ErrorSolution> = {
  NO_INTERNET: {
    title: 'Sem conexão com a internet',
    cause: 'Não foi possível estabelecer conexão com a internet.',
    explanation: 'Seu computador não está conectado à internet ou a conexão está instável.',
    solutions: [
      {
        description: 'Verificar cabo de rede ou Wi-Fi',
      },
      {
        description: 'Testar conexão:',
        command: 'ping google.com',
      },
      {
        description: 'Verificar se há proxy ou VPN interferindo',
      },
    ],
  },

  GITHUB_UNREACHABLE: {
    title: 'GitHub inacessível',
    cause: 'Não foi possível conectar ao GitHub.',
    explanation: 'O servidor do GitHub pode estar temporariamente indisponível ou bloqueado pela sua rede.',
    solutions: [
      {
        description: 'Verificar status do GitHub:',
        docs: 'https://www.githubstatus.com/',
      },
      {
        description: 'Verificar se há firewall bloqueando',
      },
      {
        description: 'Tentar novamente em alguns minutos',
      },
    ],
  },

  TIMEOUT: {
    title: 'Timeout de conexão',
    cause: 'A operação demorou muito e foi cancelada.',
    explanation: 'A rede está lenta ou o servidor não está respondendo.',
    solutions: [
      {
        description: 'Verificar velocidade da conexão',
      },
      {
        description: 'Tentar novamente',
      },
    ],
  },

  DNS_FAILED: {
    title: 'Falha na resolução DNS',
    cause: 'Não foi possível resolver o nome do servidor.',
    explanation: 'O servidor DNS não conseguiu traduzir o domínio para um endereço IP.',
    solutions: [
      {
        description: 'Verificar configuração de DNS',
      },
      {
        description: 'Tentar usar DNS alternativo (8.8.8.8)',
      },
    ],
  },

  PROXY_ERROR: {
    title: 'Erro de proxy',
    cause: 'O proxy configurado está interferindo na conexão.',
    explanation: 'Configurações de proxy corporativo podem estar bloqueando o acesso.',
    solutions: [
      {
        description: 'Verificar variáveis de ambiente HTTP_PROXY e HTTPS_PROXY',
      },
      {
        description: 'Configurar proxy no Git:',
        command: 'git config --global http.proxy http://proxy:porta',
      },
    ],
  },

  SSL_ERROR: {
    title: 'Erro de SSL/Certificado',
    cause: 'O certificado SSL não pôde ser verificado.',
    explanation: 'A conexão HTTPS falhou devido a problemas com certificado.',
    solutions: [
      {
        description: 'Verificar data/hora do sistema',
      },
      {
        description: 'Atualizar certificados CA',
      },
    ],
  },

  UNKNOWN: {
    title: 'Erro de rede desconhecido',
    cause: 'Ocorreu um erro de rede não catalogado.',
    explanation: 'O erro não foi reconhecido pelo sistema de classificação.',
    solutions: [
      {
        description: 'Verificar conexão com a internet',
      },
      {
        description: 'Tentar novamente',
      },
    ],
  },
};

/**
 * Config error solutions
 */
const CONFIG_SOLUTIONS: Record<ConfigErrorSubtype, ErrorSolution> = {
  NO_API_KEY: {
    title: 'Chave de API não configurada',
    cause: 'Nenhuma chave de API foi encontrada no arquivo .env.',
    explanation: 'O Cogit precisa de pelo menos uma chave de API para funcionar.',
    solutions: [
      {
        description: 'Criar arquivo .env na raiz do projeto:',
        command: 'cp .env.example .env',
      },
      {
        description: 'Adicionar sua chave de API:',
        command: 'OPENROUTER_API_KEY=sua_chave_aqui',
      },
      {
        description: 'Obter chaves gratuitas em:',
        docs: 'https://openrouter.ai/keys (gratuito com limites)',
      },
    ],
  },

  INVALID_CONFIG: {
    title: 'Configuração inválida',
    cause: 'O arquivo de configuração possui erros de sintaxe.',
    explanation: 'O arquivo .env ou outro arquivo de configuração não pode ser lido corretamente.',
    solutions: [
      {
        description: 'Verificar sintaxe do arquivo .env',
      },
      {
        description: 'Não usar aspas em valores simples:',
        command: 'API_KEY=valor  # correto',
      },
      {
        description: 'Usar aspas apenas em valores com espaços:',
        command: 'NOME="Valor com espacos"  # correto',
      },
    ],
  },

  FILE_NOT_FOUND: {
    title: 'Arquivo não encontrado',
    cause: 'Um arquivo necessário não foi encontrado.',
    explanation: 'O arquivo de configuração ou recurso solicitado não existe.',
    solutions: [
      {
        description: 'Verificar se o arquivo existe',
      },
      {
        description: 'Criar o arquivo necessário',
      },
    ],
  },

  PERMISSION_ERROR: {
    title: 'Erro de permissão',
    cause: 'Não há permissão para ler ou escrever o arquivo.',
    explanation: 'O usuário atual não tem permissões necessárias para acessar o arquivo.',
    solutions: [
      {
        description: 'Verificar permissões do arquivo:',
        command: 'ls -la arquivo',
      },
      {
        description: 'Corrigir permissões:',
        command: 'chmod 644 arquivo',
      },
    ],
  },

  UNKNOWN: {
    title: 'Erro de configuração desconhecido',
    cause: 'Ocorreu um erro de configuração não catalogado.',
    explanation: 'O erro não foi reconhecido pelo sistema de classificação.',
    solutions: [
      {
        description: 'Verificar arquivo .env',
      },
      {
        description: 'Consultar documentação',
      },
    ],
  },
};

/**
 * Get solution for a classified error
 */
export function getSolution(
  category: ErrorCategory,
  subtype: ErrorSubtype
): ErrorSolution {
  switch (category) {
    case 'GIT':
      return GIT_SOLUTIONS[subtype as GitErrorSubtype] || GIT_SOLUTIONS.UNKNOWN;
    case 'AI':
      return AI_SOLUTIONS[subtype as AIErrorSubtype] || AI_SOLUTIONS.UNKNOWN;
    case 'NETWORK':
      return NETWORK_SOLUTIONS[subtype as NetworkErrorSubtype] || NETWORK_SOLUTIONS.UNKNOWN;
    case 'CONFIG':
      return CONFIG_SOLUTIONS[subtype as ConfigErrorSubtype] || CONFIG_SOLUTIONS.UNKNOWN;
    default:
      return CONFIG_SOLUTIONS.UNKNOWN;
  }
}

/**
 * Format solution with context variables
 */
export function formatSolution(solution: ErrorSolution, context?: Record<string, string>): ErrorSolution {
  if (!context) return solution;

  const formatString = (str: string): string => {
    return Object.entries(context).reduce(
      (acc, [key, value]) => acc.replace(new RegExp(`\\{${key}\\}`, 'g'), value),
      str
    );
  };

  return {
    ...solution,
    cause: formatString(solution.cause),
    solutions: solution.solutions.map(s => ({
      ...s,
      description: formatString(s.description),
      command: s.command ? formatString(s.command) : undefined,
    })),
  };
}
