---
trigger: always_on
---

# Sequência de Desenvolvimento - Alex Breno

## 🎯 ORDEM OBRIGATÓRIA PARA TODO DESENVOLVIMENTO

### **1. CLEAN CODE (Primeiro)**
- **Nomes Significativos**: Variáveis, funções e classes com nomes que explicam o propósito
- **Funções Pequenas**: Cada função faz UMA coisa (máximo 20 linhas)
- **Sem Duplicação**: DRY - Don't Repeat Yourself
- **Simplicidade**: KISS - Keep It Simple, Stupid
- **Legibilidade**: Código deve ser fácil de ler e entender

### **2. SOLID (Depois do Clean Code)**
- **S** - Single Responsibility: Uma classe = uma responsabilidade
- **O** - Open/Closed: Aberto para extensão, fechado para modificação
- **L** - Liskov Substitution: Subtipos substituíveis
- **I** - Interface Segregation: Interfaces pequenas e específicas
- **D** - Dependency Inversion: Depender de abstrações, não implementações

### **3. CLEAN ARCHITECTURE (Por último)**
- **Camadas Independentes**: Domínio → Aplicação → Infraestrutura
- **Dependências Invertidas**: Camadas internas NÃO conhecem externas
- **Testabilidade**: Tudo deve ser facilmente testável
- **Independência**: Domínio livre de frameworks e detalhes

##
