# Guia de Deploy no Netlify

Este projeto está configurado para deploy contínuo (CI/CD) no Netlify.

## Pré-requisitos

1.  O projeto deve estar no GitHub (já está: `https://github.com/danbuck84/pbfinance`).
2.  Você deve ter uma conta no Netlify.

## Opção A: Já tenho um site no Netlify (Seu caso)

Se você já fazia deploys manuais (arrastando a pasta `dist`), siga estes passos para conectar ao GitHub:

1.  Acesse seu site no painel do Netlify.
2.  Vá em **Site configuration** (ou **Site settings**) > **Build & deploy**.
3.  Procure por **"Link repository"** ou **"Continuous Deployment"**.
4.  Clique para configurar e selecione **GitHub**.
5.  Autorize o Netlify e selecione o repositório `danbuck84/pbfinance`.
6.  **Configurações de Build**:
    *   **Build command**: `npm run build`
    *   **Publish directory**: `dist`
    *   (Geralmente o Netlify preenche isso sozinho).

## Opção B: Criar um novo site

1.  No painel inicial, clique em **"Add new site"** > **"Import an existing project"**.
2.  Escolha **GitHub** e selecione o repositório.
3.  Confirme as configurações de build.

## ⚠️ Importante: Variáveis de Ambiente

Para que o site funcione, você **PRECISA** configurar as variáveis de ambiente no Netlify, pois elas não estão mais no código.

1.  No Netlify, vá em **Site configuration** > **Environment variables**.
2.  Adicione as seguintes variáveis (copie os valores do seu arquivo `.env` local):

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
```

3.  Após configurar as variáveis, vá na aba **Deploys** e clique em **"Trigger deploy"** > **"Deploy site"** para forçar uma nova construção com as chaves corretas.
