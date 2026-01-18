# 🚀 Guia de Setup - Formação-AO

## 1️⃣ Limpar Banco de Dados (Se necessário)

⚠️ **Apenas faça isto se quer começar do zero**

1. Abra o **SQL Editor** no Supabase
2. Copie todo o conteúdo de `supabase/clean-database.sql`
3. Cole e execute
4. Aguarde a conclusão

## 2️⃣ Executar Schema

1. Abra o **SQL Editor** no Supabase
2. Copie todo o conteúdo de `supabase/schema-new.sql`
3. Cole e execute

✅ Aguarde até completar (todas as tabelas, índices, triggers e RLS serão criados)

## 3️⃣ Criar Super Admin

### Passo A: Criar no Supabase Auth

1. Vá em **Authentication → Users** no Supabase Dashboard
2. Clique em **Create User**
3. Preencha:
   - **Email:** `admin@formacao-ao.com`
   - **Password:** `admin123`
   - ✅ Marque **"Auto Confirm User"**
4. Clique **Create User**

### Passo B: Criar Registro na Tabela

1. Vá em **SQL Editor** no Supabase
2. Copie todo o conteúdo de `supabase/create-super-admin.sql`
3. Cole e execute
4. Verifique se a query retornou o usuário criado

## 4️⃣ Fazer Login

1. Acesse `http://localhost:3000/login`
2. Use:
   - **Email:** `admin@formacao-ao.com`
   - **Senha:** `admin123`

## ⚠️ Importante

- ✅ **Crie o usuário no Auth primeiro** (Authentication → Users)
- ✅ **Depois execute o SQL** para criar o registro em `users`
- 🔐 **Mude a senha** do Super Admin após o primeiro login
- 🚫 Não exponha a `SUPABASE_SERVICE_ROLE_KEY`

## 📝 Próximos Passos

1. ✅ Você agora é Super Admin
2. Crie centros de formação (adicione via interface)
3. Crie usuários (centro_admin, secretário) via interface
4. Inicie com alunos, turmas, pagamentos, etc.

---

**Dúvidas?** Consulte `CONTRIBUTING.md` ou `README.md`
