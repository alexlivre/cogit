---
name: clean-code-solid-clean-architecture
description: Analisa, revisa e refatora código com foco em Clean Code, princípios SOLID e Clean Architecture quando eu pedir code review, refactor, reorganização de camadas, melhoria de design, redução de acoplamento, separação de responsabilidades, revisão de use cases, entities, interfaces, adapters, controllers ou arquitetura de projeto.
---

# Clean Code → SOLID → Clean Architecture

## Objetivo
Aplicar uma sequência disciplinada de melhoria de software:
1. limpar o código;
2. corrigir design orientado a objetos com SOLID;
3. reorganizar a solução para Clean Architecture quando fizer sentido.

A skill deve priorizar clareza, baixo acoplamento, alta coesão, testabilidade, separação de responsabilidades e independência de framework.

## Quando usar
Use esta skill quando o pedido envolver:
- code review técnico;
- refatoração;
- smells de código;
- classes grandes;
- funções longas;
- dependências acopladas;
- regras de negócio misturadas com infraestrutura;
- controllers/services fazendo trabalho demais;
- dificuldade para testar;
- reorganização por camadas;
- revisão de arquitetura;
- migração para casos de uso, portas e adaptadores;
- melhoria de design sem alterar comportamento funcional.

## Quando NÃO usar
Não use esta skill quando:
- o pedido for apenas corrigir um bug isolado sem análise estrutural;
- a tarefa for só formatação/lint;
- a mudança arquitetural for desnecessária para o tamanho do código;
- o usuário pedir explicitamente uma solução rápida e descartável;
- a base for tão pequena que Clean Architecture criaria complexidade sem ganho real.

## Modo de operação
Siga sempre esta ordem:

1. Entender o contexto.
2. Identificar problemas de Clean Code.
3. Identificar violações de SOLID.
4. Avaliar se há problema arquitetural real.
5. Propor a menor refatoração segura possível.
6. Escalar para Clean Architecture apenas se houver ganho claro.
7. Sugerir testes de proteção antes de mudanças amplas.
8. Entregar diagnóstico, plano e exemplo de refatoração.

## Princípio central
A skill deve evitar “over-engineering”.
Primeiro simplifique o código.
Depois reduza acoplamento.
Só então reorganize arquitetura.

Nunca introduza camadas, interfaces ou abstrações sem motivo concreto.

## Processo detalhado

### Etapa 1 — Leitura inicial
Ao receber código, identifique:
- responsabilidade principal do módulo;
- regras de negócio existentes;
- dependências externas;
- pontos de entrada e saída;
- sinais de mistura entre domínio, aplicação e infraestrutura.

Faça um resumo curto do que o código faz antes de sugerir mudanças.

### Etapa 2 — Clean Code
Procure principalmente por:
- nomes vagos ou enganosos;
- funções longas;
- níveis de abstração misturados na mesma função;
- comentários que escondem código ruim;
- condicionais duplicadas;
- blocos repetidos;
- classes com responsabilidades demais;
- parâmetros em excesso;
- efeitos colaterais escondidos;
- tratamento de erro inconsistente;
- dependência excessiva de estado compartilhado.

Aplique estas ações:
- renomear para intenção clara;
- extrair funções coesas;
- remover duplicação;
- reduzir complexidade de condicionais;
- separar validação, regra e efeito colateral;
- transformar blocos procedurais confusos em fluxo legível;
- substituir comentários desnecessários por código mais claro.

### Etapa 3 — SOLID
Verifique explicitamente:

#### S — Single Responsibility Principle
- a classe/módulo tem mais de um motivo para mudar?
- controller, service ou use case estão acumulando validação, regra, persistência e formatação?

#### O — Open/Closed Principle
- novas regras exigem editar muitos `if/else`, `switch` ou ramificações centrais?
- há estratégia, política ou composição que reduziria modificação frequente?

#### L — Liskov Substitution Principle
- heranças estão quebrando expectativa de comportamento?
- subclasses exigem tratamentos especiais?
- existe tipo derivado que reduz contrato ou lança exceções inesperadas?

#### I — Interface Segregation Principle
- interfaces estão grandes demais?
- consumidores dependem de métodos que não usam?
- contratos podem ser menores e orientados ao caso de uso?

#### D — Dependency Inversion Principle
- regra de negócio depende diretamente de ORM, framework, HTTP, banco, SDK ou detalhes concretos?
- dependências podem apontar para abstrações orientadas ao domínio/aplicação?

### Etapa 4 — Clean Architecture
Só proponha reorganização arquitetural quando houver sinais concretos como:
- regra de negócio acoplada ao framework;
- use case inexistente ou diluído em controller/service;
- entidade de domínio anêmica e toda regra fora dela;
- acesso a banco misturado com decisão de negócio;
- dificuldade alta para testar sem infraestrutura real;
- dependências apontando de dentro para fora.

Ao reorganizar, use estas camadas conceituais:

- **Entities / Domain**: regras mais estáveis do negócio.
- **Use Cases / Application**: orquestração de casos de uso.
- **Ports / Interfaces**: contratos que isolam infraestrutura.
- **Adapters / Infrastructure**: banco, HTTP, fila, filesystem, SDKs.
- **Entry Points**: controller, route, handler, resolver, CLI.

Regra obrigatória:
- dependências sempre apontam para dentro;
- detalhes externos implementam contratos definidos perto da aplicação/domínio.

## Estratégia de decisão
Use a seguinte árvore mental:

- Se o problema é legibilidade, resolva com Clean Code.
- Se o problema é acoplamento e responsabilidades, aplique SOLID.
- Se o problema é fronteira entre negócio e infraestrutura, aplique Clean Architecture.
- Se duas dessas coisas aparecerem juntas, ataque em ordem: Clean Code → SOLID → Clean Architecture.

## Entregável esperado
A resposta deve sair em cinco blocos:

1. **Resumo do diagnóstico**
2. **Problemas encontrados**
3. **Refatoração recomendada**
4. **Exemplo de estrutura/código**
5. **Riscos, trade-offs e próximos passos**

## Formato obrigatório da análise
Sempre classifique os achados em:
- crítico;
- alto;
- médio;
- baixo.

Sempre diferencie:
- problema de legibilidade;
- problema de design;
- problema arquitetural.

## Regras de refatoração
- preservar comportamento externo;
- preferir mudanças pequenas e verificáveis;
- sugerir testes antes de mudanças profundas;
- não mover tudo para Clean Architecture sem necessidade;
- não criar interfaces “porque sim”;
- não confundir service layer com use case;
- não colocar regra de negócio em controller;
- não colocar decisão de negócio em repository;
- não vazar detalhes de ORM ou transporte para o domínio;
- não usar padrões se uma função simples resolver melhor.

## Checklist operacional
Antes de concluir:
1. Consulte `checklist.md`.
2. Consulte `heuristics.md`.
3. Para saída final, use `review-template.md`.
4. Se a mudança for grande, consulte `refactor-playbook.md`.

## Preferências de resposta
Quando possível:
- mostrar “antes → depois”;
- sugerir passos incrementais;
- destacar o menor refactor viável;
- apontar o que não deve ser mexido ainda;
- propor estrutura de pastas apenas quando isso gerar ganho real;
- incluir exemplos em linguagem compatível com o projeto atual.

## Exemplos de gatilhos
Ative esta skill em pedidos como:
- “faça code review desse service”
- “refatore esse controller”
- “isso viola SOLID?”
- “como separar domínio e infraestrutura?”
- “me ajude a aplicar Clean Architecture”
- “esse código está muito acoplado”
- “quero melhorar a testabilidade desse módulo”
- “organize esse fluxo em use case, repository e adapter”