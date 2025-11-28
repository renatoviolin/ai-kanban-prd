# TAREFA: Implementar Auth e Gestão de Chaves

**Funcionalidades:**
1. Configurar Supabase Auth (Email/Password + Google Provider).
2. Criar página de Login e Registro.
3. Criar Tabela `user_settings` para armazenar a API Key do usuário (criptografada ou RLS estrito).
4. Criar página de "Configurações" onde o usuário insere sua chave da OpenAI/Anthropic.

**Database Schema (Supabase):**
- Table: `profiles` (id references auth.users, name, avatar_url)
- Table: `user_settings` (user_id references auth.users, openai_key_encrypted, anthropic_key_encrypted)

**Frontend Requirements:**
- Usar ShadCN/UI para formulários.
- Rota protegida `/dashboard`.
- Redirecionar para `/settings` se não houver API Key configurada no primeiro acesso.

**Critérios de Aceite:**
- Usuário consegue logar e deslogar.
- Usuário salva a API Key e ela persiste no banco.
- O front não deve expor a API Key, apenas enviar para o backend ou salvar localmente (decidir estratégia segura).