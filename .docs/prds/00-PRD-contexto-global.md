# CONTEXTO GLOBAL DO PROJETO: AI-KANBAN

**Descrição:** AI-KANBAN é um sistema de gerenciamento de tarefas no formato kanban, no qual cada card pode ser analisado por uma IA generativa para produzir PRDs técnicos que descrevem funcionalidades individuais do projeto.

**Objetivo:** Fornecer uma plataforma de kanban integrada com IA, permitindo que cada card gere automaticamente um PRD técnico detalhado baseado:
- No contexto geral do projeto
- Nas tecnologias adotadas
- No conteúdo do card

**Tech Stack:**
- **Frontend:** React (Vite), TypeScript, TailwindCSS, Lucide Icons, ShadCN/UI.
- **Backend:** Node.js (Express), TypeScript.
- **Database & Auth:** Supabase (PostgreSQL).
- **AI Integration:** OpenAI API (GPT-4o) ou Anthropic (Claude 3.5).
- **State Management:** React Query + Context API.

**Padrões de Código:**
- Use Functional Components e Hooks.
- Tipagem estrita com TypeScript.
- Separação clara: Controller -> Service -> Repository (Backend).
- Priorizar código simples e limpo, evitando overengineering.

**Estrutura de pastas:**
- Todo o código do backend deve ser criado na pasta já existente `backend`.
- Todo o código do frontend deve ser criado na pasta já existente `frontend`.


**Chaves de API:**
- Todas as chaves de API estão no arquivo `.env` no diretório raiz do projeto.

**Scripts para criação de tabelas:**
- O script de criação de tabelas deverá ser gerado no diretório `backend/scripts/database/`.

**Detalhes de cada funcionalidade:**
- todos os PRDs estão no diretorio `prompts/prps`.