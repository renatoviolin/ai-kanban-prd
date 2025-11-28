# TAREFA: Validação de Consistência (Tech Lead Mode)

**Funcionalidades:**
1. Middleware de IA antes da geração final.
2. Verificar se o pedido do Card viola o Contexto Global (ex: Usuário pede jQuery num projeto React).
3. Se houver violação, exibir alerta no Chat: "Atenção: O pedido X conflita com a regra Y. Deseja manter?".

**Backend Requirements:**
- Passo extra na chain da LLM: `ValidationStep`.
- Input: Card Request vs Global Context.
- Output: Boolean (IsValid) + Reason.