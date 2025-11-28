# TAREFA: Geração e Formatação do PRD Final

**Funcionalidades:**
1. Botão "Gerar PRD Final" no chat.
2. Backend Endpoint `POST /api/generate-prp`:
   - Compila todo o histórico do chat + regras do projeto.
   - Gera um Markdown estruturado com: Resumo, Arquivos a Alterar, Código Sugerido, Checklist de Testes.
3. Salvar o resultado na coluna `generated_prp_content` do card.
4. Exibir o Markdown renderizado com syntax highlighting.
5. Botões de Ação: "Copiar Markdown", "Copiar como Cursor Rules".

**Frontend Requirements:**
- Usar `react-markdown` e `react-syntax-highlighter`.
- Ícone de "Copy" com feedback visual (Toast "Copiado!").