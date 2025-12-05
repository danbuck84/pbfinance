# PB Finance - Gestão Financeira Familiar Multi-tenant

Uma aplicação de gestão financeira robusta e colaborativa, desenvolvida para organizar as finanças de famílias modernas. Totalmente multi-tenant, permitindo que cada família ("Household") tenha seu espaço isolado, com suporte a múltiplos membros e níveis de permissão.

## 🚀 Funcionalidades

- **Multi-tenancy Real:** Dados isolados por família com suporte a "Households".
- **Gestão de Convites Segura:** Sistema de convites via código de alta entropia.
- **Controle de Acesso (RBAC):** Papéis de Admin (Owner) e Membros.
- **Dashboard Financeiro:** Visão clara de receitas, despesas e orçamento.
- **Autenticação Segura:** Login via Google Auth (Firebase).

## 🛠️ Tecnologias

- **Frontend:** React, TypeScript, Vite
- **UI:** Tailwind CSS, Shadcn/UI
- **Backend/DB:** Firebase (Auth, Firestore)
- **Segurança:** Firestore Security Rules

## 📦 Instalação

Siga os passos para rodar o projeto localmente:

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/pbfinance.git
   cd pbfinance/V3
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure o Firebase:**
   - Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
   - Ative Authentication (Google) e Firestore.
   - Copie as credenciais do seu projeto.

4. **Variáveis de Ambiente:**
   - Copie o arquivo de exemplo:
     ```bash
     cp .env.example .env
     ```
   - Preencha o `.env` com suas credenciais do Firebase.

5. **Rode o projeto:**
   ```bash
   npm run dev
   ```

## 🔒 Regras de Segurança

Para garantir o isolamento dos dados, certifique-se de implantar as regras de segurança contidas no arquivo `firestore.rules` no seu Console do Firebase.

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

---
Desenvolvido por [Daniel Buck](https://github.com/danbuck84) - 2025
