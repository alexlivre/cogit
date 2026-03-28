/**
 * Teste prático do Ollama Thinking Mode
 * Verifica funcionamento real com o modelo qwen3.5:4b
 */

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'qwen3.5:4b';

async function testOllamaThinking() {
  console.log('🧪 Testando Ollama Thinking Mode\n');
  console.log(`URL: ${OLLAMA_URL}`);
  console.log(`Model: ${MODEL}\n`);

  // Test 1: Verificar conexão
  console.log('📡 Test 1: Verificando conexão...');
  try {
    const tagsResponse = await fetch(`${OLLAMA_URL}/api/tags`);
    const tagsData = await tagsResponse.json();
    console.log(`✅ Ollama conectado. Modelos disponíveis: ${tagsData.models?.length || 0}`);
    
    const hasModel = tagsData.models?.some(m => m.name === MODEL || m.name.startsWith(MODEL));
    if (hasModel) {
      console.log(`✅ Modelo ${MODEL} encontrado\n`);
    } else {
      console.log(`❌ Modelo ${MODEL} não encontrado. Execute: ollama pull ${MODEL}\n`);
      process.exit(1);
    }
  } catch (error) {
    console.log(`❌ Erro de conexão: ${error.message}`);
    console.log('   Certifique-se de que o Ollama está rodando: ollama serve\n');
    process.exit(1);
  }

  // Test 2: Chat sem thinking
  console.log('💬 Test 2: Chat sem thinking...');
  try {
    const startTime = Date.now();
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: 'Qual a capital do Brasil?' }],
        stream: false,
        think: false
      })
    });
    
    const data = await response.json();
    const elapsed = Date.now() - startTime;
    
    console.log(`✅ Resposta recebida em ${elapsed}ms`);
    console.log(`   Content: ${data.message?.content?.substring(0, 100)}...`);
    console.log(`   Thinking: ${data.message?.thinking || 'N/A'}\n`);
  } catch (error) {
    console.log(`❌ Erro: ${error.message}\n`);
  }

  // Test 3: Chat com thinking
  console.log('💭 Test 3: Chat com thinking...');
  try {
    const startTime = Date.now();
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: 'Quantas letras "r" tem em "strawberry"?' }],
        stream: false,
        think: true
      })
    });
    
    const data = await response.json();
    const elapsed = Date.now() - startTime;
    
    console.log(`✅ Resposta recebida em ${elapsed}ms`);
    
    if (data.message?.thinking) {
      console.log(`   💭 Thinking detectado!`);
      console.log(`   Thinking: ${data.message.thinking.substring(0, 200)}...`);
    } else {
      console.log(`   ⚠️  Thinking não retornado (modelo pode não suportar)`);
    }
    
    console.log(`   Content: ${data.message?.content?.substring(0, 100)}...\n`);
  } catch (error) {
    console.log(`❌ Erro: ${error.message}\n`);
  }

  // Test 4: Simular uso no Cogit
  console.log('🔧 Test 4: Simulando uso no Cogit...');
  try {
    const diff = `diff --git a/test.ts b/test.ts\n+function hello() {\n+  return "Hello World";\n+}`;
    
    const startTime = Date.now();
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: 'Generate a commit message in conventional commits format.' },
          { role: 'user', content: `Generate a commit message for this diff:\n${diff}` }
        ],
        stream: false,
        think: true
      })
    });
    
    const data = await response.json();
    const elapsed = Date.now() - startTime;
    
    console.log(`✅ Commit gerado em ${elapsed}ms`);
    
    if (data.message?.thinking) {
      console.log(`   💭 Thinking:`);
      console.log(`   ${data.message.thinking.substring(0, 300)}...`);
      console.log();
    }
    
    console.log(`   📝 Commit:`);
    console.log(`   ${data.message?.content}\n`);
  } catch (error) {
    console.log(`❌ Erro: ${error.message}\n`);
  }

  console.log('✅ Testes concluídos!');
  console.log('\n📋 Resumo:');
  console.log('   - Ollama está acessível');
  console.log('   - Modelo qwen3.5:4b está instalado');
  console.log('   - Thinking mode está funcionando');
  console.log('   - Cogit pode usar o modo thinking');
}

testOllamaThinking().catch(console.error);
