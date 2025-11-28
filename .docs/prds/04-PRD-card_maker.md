# TAREFA: Criação de Cards (User Stories) Multimodais

**Funcionalidades:**
1. Modal de criação de Card.
2. Campos: Título, Descrição (Rich Text/Markdown), Prioridade.
3. Upload de Imagem: Permitir colar (Ctrl+V) ou upload de prints/mockups.
4. Salvar imagem no Supabase Storage e vincular URL ao card.

**Database Schema:**
Update `cards` table:
- description (text)
- image_urls (array text)
- priority (enum: low, medium, high)

**Frontend Requirements:**
- Editor de texto simples (ex: Tiptap ou textarea simples com markdown highlight).
- Preview da imagem carregada antes de salvar.

**Backend Requirements:**
- Endpoint de upload para Supabase Storage.
- Salvar metadados no banco.