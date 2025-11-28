# TAREFA: Versionamento de PRDs Gerados

**Funcionalidades:**
1. Toda vez que o botão "Gerar PRD" for clicado, não sobrescrever o anterior.
2. Criar tabela `prp_versions`.
3. No frontend, exibir um dropdown/abas: "v1 (10:00)", "v2 (10:15)".
4. Permitir visualizar e copiar versões antigas.

**Database Schema:**
Table `prp_versions`:
- id, card_id, content (text), created_at.

**Frontend Requirements:**
- UI para navegar entre versões sem recarregar a página.
- Diff visual (opcional, futuro) ou apenas troca de conteúdo.