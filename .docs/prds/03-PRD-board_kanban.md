# TAREFA: Implementar Kanban Board (Drag & Drop)

**Funcionalidades:**
1. Visualização de colunas (To Do, In Progress, Done).
2. Capacidade de criar novas colunas (opcional, ou fixo inicialmente).
3. Arrastar cards entre colunas (Drag and Drop).
4. Persistir a mudança de coluna no banco de dados imediatamente.
5. Cada card deve estar associado a um projeto.
6. O usuário deve selecionar um projeto para só depois navegar para o kanban board e adicionar cards.
7. Ele deve ter a opção de voltar para a lista de projetos e selecionar outro para abrir o seu kanban.

**Tech Stack Específica:**
- Frontend Lib: `@dnd-kit/core` (Preferencialmente) ou `react-beautiful-dnd`.

**Database Schema:**
Table `columns`:
- id, project_id, title, position (int).
Table `cards`:
- id, column_id, title, position (int).

**Frontend Requirements:**
- UI responsiva.
- Optimistic Updates: Atualizar a UI antes da resposta da API para sensação de velocidade.
- Animações suaves ao soltar o card.