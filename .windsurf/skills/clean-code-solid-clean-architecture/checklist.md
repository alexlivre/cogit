# Checklist — Clean Code / SOLID / Clean Architecture

## Clean Code
- [ ] Nomes expressam intenção?
- [ ] Funções têm tamanho e foco adequados?
- [ ] Há mistura de abstração na mesma função?
- [ ] Há duplicação?
- [ ] Há efeitos colaterais escondidos?
- [ ] Erros são tratados de forma consistente?
- [ ] Comentários explicam regra de negócio real, e não código ruim?

## SOLID
- [ ] Cada classe/módulo tem uma responsabilidade principal?
- [ ] Novas regras exigem editar blocos centrais demais?
- [ ] A herança usada é segura e substituível?
- [ ] Interfaces estão menores e orientadas ao consumidor?
- [ ] Casos de uso dependem de abstrações, não de detalhes?

## Clean Architecture
- [ ] Regras de negócio estão isoladas?
- [ ] Controller só recebe e delega?
- [ ] Use case orquestra o fluxo sem detalhes externos?
- [ ] Repository/adapter implementa porta, sem decisão de negócio?
- [ ] Infraestrutura está fora do domínio?
- [ ] O código principal é testável sem banco, HTTP ou framework?

## Decisão final
- [ ] Basta limpeza local?
- [ ] Precisa refatoração de design?
- [ ] Precisa reorganização arquitetural?
- [ ] Existe risco de over-engineering?