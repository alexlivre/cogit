# Playbook de refatoração incremental

## Fase 1 — Proteger comportamento
- Criar testes de caracterização quando possível.
- Identificar entradas, saídas e efeitos colaterais.
- Congelar comportamento externo.

## Fase 2 — Limpeza local
- Renomear.
- Extrair funções.
- Remover duplicação.
- Isolar validações.
- Simplificar condicionais.

## Fase 3 — Ajuste de design
- Separar responsabilidades.
- Quebrar classes grandes.
- Criar políticas/estratégias quando houver variação real.
- Inverter dependências relevantes.

## Fase 4 — Fronteiras arquiteturais
- Extrair use case.
- Definir portas de entrada/saída.
- Empurrar framework e banco para adapters.
- Manter domínio independente.

## Fase 5 — Consolidação
- Atualizar testes.
- Revisar nomenclatura.
- Revisar acoplamento residual.
- Medir se a complexidade extra realmente valeu.