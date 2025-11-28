# TAREFA: Motor de Entrevista com IA (Chat Backend)

**Objetivo:**
The goal is NOT to be a chatbot, but an assistant that:
- Reads project description
- Reads card details
- Generates a PRD for it
- The chat is only used when the LLM needs to clarify details about the task and PRD

**Funcionalidades:**
1. Criar interface de Chat dentro do detalhe do Card.
2. Backend Endpoint `POST /api/chat/interview`:
   - Recebe: Histórico do Chat + Contexto do Projeto + Dados do Card.
   - Ação: Envia para LLM com System Prompt de "Arquiteto de Software".
   - Retorno: Pergunta de clarificação ou confirmação de entendimento.
3. Streaming de resposta (opcional, mas desejável) ou Loading state.

**System Prompt Logic (Backend):**
- "Você é um Arquiteto de Software Sênior. Analise o pedido do usuário baseada na Stack: {stack}. Se faltarem detalhes técnicos, pergunte ao usuário. Seja conciso."

**Frontend Requirements:**
- UI estilo Chat (Bubbles de mensagem).
- Botão "Enviar resposta".