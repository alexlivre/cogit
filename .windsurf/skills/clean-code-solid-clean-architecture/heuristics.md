# Heurísticas de decisão

## Sinais de Clean Code
- Nome ruim → renomear.
- Função longa → extrair.
- Condicional repetida → centralizar política/estratégia.
- Comentário explicando bloco estranho → simplificar o bloco.
- Muitos parâmetros → agrupar conceito ou repensar responsabilidade.

## Sinais de SOLID
- Classe faz validação + persistência + regra + log → SRP violado.
- Vários `if tipo == ...` para comportamento → considerar OCP.
- Subclasse quebra contrato do pai → LSP violado.
- Interface enorme com métodos irrelevantes → ISP violado.
- Caso de uso conhece ORM/framework diretamente → DIP violado.

## Sinais de Clean Architecture
- Controller contém regra de negócio.
- Service é um “deus” do sistema.
- Repository decide regra de negócio.
- Domínio conhece HTTP, SQL, ORM, fila ou framework.
- Testar regra exige subir infraestrutura.
- Mudança de transporte ou banco afeta regra central.

## Regra de ouro
Não começar pela arquitetura.
Começar pelo problema observável.