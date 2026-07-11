# Guia Completo de Utilização do Ollama para Aplicações Locais

## 1. Introdução ao Ollama

Ollama é uma plataforma para executar modelos de linguagem grandes localmente. Este guia cobre sua utilização em aplicações locais com foco no modelo padrão `qwen3.5:4b`.

## 2. Pré-requisitos e Inicialização

### Verificar Instalação
```bash
ollama --version
```

### Iniciar o Servidor Ollama
```bash
# Iniciar em segundo plano (Linux/Mac)
ollama serve &

# Windows (executar como aplicação)
# O Ollama inicia automaticamente como serviço
```

### Verificar Status
```bash
curl http://localhost:11434/api/tags
```

## 3. Gerenciamento de Modelos

### Baixar o Modelo Padrão
```bash
ollama pull qwen3.5:4b
```

### Listar Modelos Disponíveis
```bash
ollama list
```

### Executar Modelo via CLI
```bash
# Modo interativo
ollama run qwen3.5:4b

# Comando direto
ollama run qwen3.5:4b "Explique o que é inteligência artificial"
```

### Adicionar Novos Modelos
```bash
# Exemplo: adicionar outro modelo
ollama pull llama3.2:3b
ollama pull deepseek-r1:8b
```

### Remover Modelos
```bash
ollama rm qwen3.5:4b
```

## 4. Uso da API REST

### Endpoints Principais
- `GET /api/tags` - Listar modelos
- `POST /api/generate` - Geração de texto
- `POST /api/chat` - Chat com histórico
- `POST /api/embeddings` - Gerar embeddings

### Estrutura Básica da API
```javascript
const OLLAMA_HOST = 'http://localhost:11434';
const DEFAULT_MODEL = 'qwen3.5:4b';
```

## 5. API de Chat (Recomendada)

### Requisição Básica
```javascript
async function chatWithOllama(messages, options = {}) {
    const {
        model = DEFAULT_MODEL,
        temperature = 0.7,
        max_tokens = 1024,
        stream = false,
        think = false
    } = options;

    const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: model,
            messages: messages,
            options: {
                temperature: temperature,
                num_predict: max_tokens
            },
            stream: stream,
            think: think
        })
    });

    return stream ? response.body : response.json();
}
```

### Exemplo de Uso sem Streaming
```javascript
const messages = [
    { role: 'user', content: 'Qual é a capital do Brasil?' }
];

const response = await chatWithOllama(messages, {
    model: 'qwen3.5:4b',
    stream: false,
    think: false
});

console.log('Resposta:', response.message.content);
```

## 6. Controle do Modo de Pensamento (Thinking)

### Sobre o Modo Thinking
Alguns modelos suportam separação entre raciocínio e resposta final. Para `qwen3.5:4b`, use `think: true/false`.

### Com Thinking Ativado
```javascript
const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        model: 'qwen3.5:4b',
        messages: [
            { role: 'user', content: 'Quantas letras "r" tem em "strawberry"?' }
        ],
        think: true,
        stream: false
    })
});

const data = await response.json();
console.log('Raciocínio:', data.message.thinking);
console.log('Resposta:', data.message.content);
```

### Com Thinking Desativado
```javascript
const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        model: 'qwen3.5:4b',
        messages: [
            { role: 'user', content: 'Explique a teoria da relatividade' }
        ],
        think: false,
        stream: false
    })
});
```

## 7. Streaming de Respostas

### Streaming sem Thinking
```javascript
async function streamChat(messages, onChunk, onComplete) {
    const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'qwen3.5:4b',
            messages: messages,
            stream: true,
            think: false
        })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
            try {
                const parsed = JSON.parse(line);
                if (parsed.message && parsed.message.content) {
                    fullResponse += parsed.message.content;
                    onChunk(parsed.message.content);
                }
            } catch (e) {
                console.error('Erro ao parsear chunk:', e);
            }
        }
    }

    onComplete(fullResponse);
}
```

### Streaming com Thinking
```javascript
async function streamChatWithThinking(messages, onThinking, onContent) {
    const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'qwen3.5:4b',
            messages: messages,
            stream: true,
            think: true
        })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let isThinking = true;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
            try {
                const parsed = JSON.parse(line);
                
                if (parsed.message && parsed.message.thinking) {
                    onThinking(parsed.message.thinking);
                }
                
                if (parsed.message && parsed.message.content) {
                    if (isThinking) {
                        isThinking = false;
                        onContent('\n--- Resposta ---\n');
                    }
                    onContent(parsed.message.content);
                }
            } catch (e) {
                console.error('Erro ao parsear chunk:', e);
            }
        }
    }
}
```

## 8. API de Geração (Generate)

### Para Casos Simples sem Histórico
```javascript
async function generateText(prompt, options = {}) {
    const {
        model = DEFAULT_MODEL,
        temperature = 0.7,
        max_tokens = 1024
    } = options;

    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: model,
            prompt: prompt,
            options: {
                temperature: temperature,
                num_predict: max_tokens
            },
            stream: false
        })
    });

    return response.json();
}

// Uso
const result = await generateText("Escreva um poema sobre o mar");
console.log(result.response);
```

## 9. Gerenciamento de Contexto

### Manter Histórico de Conversa
```javascript
class OllamaChatSession {
    constructor(model = 'qwen3.5:4b') {
        this.model = model;
        this.messages = [];
    }

    addMessage(role, content) {
        this.messages.push({ role, content });
    }

    async sendMessage(content, think = false) {
        this.addMessage('user', content);
        
        const response = await chatWithOllama(this.messages, {
            model: this.model,
            think: think,
            stream: false
        });

        this.addMessage('assistant', response.message.content);
        
        return {
            thinking: response.message.thinking,
            content: response.message.content,
            fullResponse: response
        };
    }

    clearHistory() {
        this.messages = [];
    }

    getHistory() {
        return [...this.messages];
    }
}
```

## 10. Tratamento de Erros

### Implementação Robust
```javascript
async function safeOllamaCall(apiCall, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await apiCall();
        } catch (error) {
            console.error(`Tentativa ${attempt} falhou:`, error);
            
            if (attempt === retries) {
                throw new Error(`Falha após ${retries} tentativas: ${error.message}`);
            }
            
            // Esperar antes de tentar novamente
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
}

// Exemplo de uso
const response = await safeOllamaCall(() => 
    chatWithOllama(messages, { model: 'qwen3.5:4b' })
);
```

## 11. Configurações Avançadas

### Parâmetros do Modelo
```javascript
const advancedOptions = {
    temperature: 0.8,      // Criatividade (0.0-1.0)
    top_p: 0.9,           // Amostragem nucleus
    top_k: 40,            // Top-k sampling
    repeat_penalty: 1.1,  // Penalidade por repetição
    num_predict: 2048,    // Tokens máximos
    stop: ['\n', '###']   // Sequências de parada
};

const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        model: 'qwen3.5:4b',
        messages: messages,
        options: advancedOptions,
        stream: false
    })
});
```

## 12. Exemplo de Aplicação Completa

```javascript
// ollama-service.js
class OllamaService {
    constructor(host = 'http://localhost:11434') {
        this.host = host;
        this.defaultModel = 'qwen3.5:4b';
    }

    async healthCheck() {
        try {
            const response = await fetch(`${this.host}/api/tags`);
            return response.ok;
        } catch {
            return false;
        }
    }

    async chat({
        messages,
        model = this.defaultModel,
        think = false,
        stream = false,
        temperature = 0.7,
        maxTokens = 1024
    }) {
        const payload = {
            model,
            messages,
            stream,
            think,
            options: {
                temperature,
                num_predict: maxTokens
            }
        };

        const response = await fetch(`${this.host}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status}`);
        }

        return stream ? this.handleStream(response) : response.json();
    }

    async *handleStream(response) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim());

                for (const line of lines) {
                    try {
                        yield JSON.parse(line);
                    } catch (e) {
                        console.warn('Invalid JSON chunk:', line);
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    }

    async listModels() {
        const response = await fetch(`${this.host}/api/tags`);
        return response.json();
    }

    async pullModel(modelName) {
        // Nota: Esta operação pode demorar
        const response = await fetch(`${this.host}/api/pull`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: modelName })
        });

        return response.body;
    }
}

// Uso na aplicação
const ollama = new OllamaService();

// Verificar conexão
if (await ollama.healthCheck()) {
    console.log('Ollama está rodando');
    
    // Chat simples
    const result = await ollama.chat({
        messages: [{ role: 'user', content: 'Olá, como você está?' }],
        think: false
    });
    
    console.log('Resposta:', result.message.content);
} else {
    console.error('Ollama não está disponível');
}
```

## 13. Melhores Práticas

1. **Sempre verificar a saúde do servidor** antes de fazer chamadas
2. **Implementar timeout** para chamadas de API
3. **Usar streaming** para respostas longas
4. **Manter o histórico** limitado para evitar custo computacional
5. **Tratar erros de conexão** com retry exponencial
6. **Monitorar uso de memória** ao usar modelos grandes
7. **Considerar pensar (thinking)** apenas quando necessário para debug

## 14. Solução de Problemas

### Servidor não responde
```bash
# Reiniciar o Ollama
pkill ollama
ollama serve &

# Verificar porta
netstat -tulpn | grep 11434
```

### Modelo não carrega
```bash
# Verificar espaço em disco
df -h

# Recarregar modelo
ollama rm qwen3.5:4b
ollama pull qwen3.5:4b
```

### Erro de memória
- Reduza `num_predict` (max_tokens)
- Use modelos menores
- Aumente memória swap se necessário

## 15. Referências Rápidas

### Comandos CLI Úteis
```bash
# Executar com thinking
ollama run qwen3.5:4b --think "sua pergunta"

# Executar sem thinking
ollama run qwen3.5:4b --think=false "sua pergunta"

# Ver informações do modelo
ollama show qwen3.5:4b

# Criar modelo personalizado
ollama create meu-modelo -f ./Modelfile
```

### Códigos de Status HTTP
- `200`: Sucesso
- `400`: Requisição inválida
- `404`: Modelo não encontrado
- `500`: Erro interno do servidor

Este guia cobre os principais aspectos para integrar o Ollama em uma aplicação local usando o modelo `qwen3.5:4b` como padrão.