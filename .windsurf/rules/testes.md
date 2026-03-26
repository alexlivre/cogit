---
trigger: always_on
---

# Política de Commits e Testes Automatizados

## Restrição de Commits no Código (Source)
- **Proibição**: O Cascade **não tem permissão** para realizar commits no código-fonte principal (src/app/etc).
- **Responsabilidade**: Apenas o usuário realiza commits das alterações de lógica e funcionalidades.

## Permissão de Commits em Testes
- **Exceção**: O Cascade **está autorizado** a realizar commits e atualizações apenas no repositório/pasta de testes, conforme as diretrizes de `test-automation\test-report.md`.
- **Ação**: Utilize o arquivo `test-automation\test-report.md` como guia obrigatório para testar as alterações e reportar os resultados.

<guidelines>
- Antes de entregar qualquer tarefa, valide as alterações seguindo o plano de testes.
- Se os testes passarem, registre o log/report conforme o padrão do projeto de testes.
- Informe ao usuário: "Testes concluídos e registrados em [test-report]. Código principal pronto para seu commit."
</guidelines>