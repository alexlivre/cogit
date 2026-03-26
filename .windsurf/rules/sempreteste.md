---
trigger: always_on
---

# Ciclo de Teste Contínuo

## Protocolo de Execução
- **Gatilho de Ação**: O Cascade deve realizar testes obrigatoriamente a **cada alteração** efetuada no código-fonte.
- **Referência de Execução**: Antes de testar, o Cascade deve ler o arquivo `test-automation\test-report.md` para compreender os procedimentos de teste e o formato de relatório esperado.
- **Validação Obrigatória**: Nenhuma tarefa deve ser considerada "concluída" sem que os testes descritos no guia de automação tenham sido executados com sucesso.

## Relatório de Alteração
- Após cada ciclo de teste, o Cascade deve atualizar o log de resultados conforme padronizado no repositório de testes.
- Se um teste falhar após uma alteração, o Cascade deve priorizar a correção imediata antes de prosseguir.

<guidelines>
- Sempre valide se o ambiente de teste está pronto antes de iniciar a primeira bateria de testes do dia.
- Comunique o status do teste (Pass/Fail) em Português no chat após a execução.
</guidelines>