# TAREFA: CRUD de Projetos com Contexto Estruturado

**Funcionalidades:**
1. CRUD completo de Projetos (Listar, Criar, Editar, Deletar).
2. O formulário de Projeto deve ter campos específicos para o contexto da IA:
   - Nome do Projeto.
   - Tech Stack (Input de texto livre ou tags).
   - Regras de Estilo (Linting, padrões).
   - Estrutura de Arquivos (Textarea para colar o output do comando `tree`).

**Database Schema:**
Table `projects`:
- id (uuid)
- user_id (fk)
- name (text)
- tech_stack (text)
- coding_rules (text)
- file_structure (text)
- created_at

**Frontend Requirements:**
- Sidebar lateral listando os projetos.
- Modal para criação de novo projeto.
- Validação: Não permitir criar projeto sem Nome.

**Backend Requirements:**
- Endpoint `POST /projects` e `GET /projects`.
- Garantir via RLS que usuário só vê seus projetos.