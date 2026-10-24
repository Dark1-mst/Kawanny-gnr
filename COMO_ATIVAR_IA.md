# Como ativar a IA no KAW Generetor

O projeto já tem uma rota de servidor em `api/generate.js` que pode usar OpenAI (ChatGPT), Gemini, Claude ou Groq. Para funcionar com conteúdo real, configure pelo menos uma chave de API no servidor. A interface nunca precisa receber a chave.

## Rodar localmente

1. Instale Node.js 18 ou superior.
2. Faça uma cópia de `.env.example` com o nome `.env`.
3. Abra `.env` e coloque sua chave em `OPENAI_API_KEY=...` (ou configure uma das outras IAs).
4. No terminal, dentro da pasta do projeto, execute `npm start`.
5. Abra `http://127.0.0.1:3000`.
6. No site, abra **Ajuda e privacidade da IA** e clique em **Testar as IAs**.

Exemplo de `.env` para usar OpenAI:

```env
OPENAI_API_KEY=sua_chave_real_aqui
OPENAI_MODEL=gpt-4.1-mini
```

Não coloque uma chave real no GitHub, em `index.html`, `scripts.js` ou em qualquer arquivo entregue ao navegador. O `.env` está ignorado pelo Git. A API da OpenAI é cobrada separadamente do ChatGPT Plus/Go e precisa de uma conta/API com faturamento configurado.

## Publicar na Vercel

1. Envie o projeto para um repositório Git sem `.env` e sem chaves.
2. Importe o repositório na Vercel.
3. Em **Settings → Environment Variables**, adicione `OPENAI_API_KEY` e, opcionalmente, `OPENAI_MODEL`.
4. Faça um novo deploy.
5. Abra o site e use **Testar as IAs** para confirmar.

## O que já existe no projeto

- Gerador de slides, resumos e trabalhos com IA configurada no servidor.
- Modo de estudo com resumo e links de pesquisa.
- Busca de imagens do Wikimedia Commons, com atribuição/licença.
- Exportação, modo de apresentação, impressão/Salvar como PDF e edição direta dos blocos.
- Temporizador Pomodoro e dicas de estudo.
- Biblioteca adicionada nesta versão: **Guardar** salva o material editável no armazenamento local do navegador. Não sincroniza automaticamente entre aparelhos e pode ser apagada se os dados do navegador forem limpos.

## Importante sobre os trabalhos

Use o material gerado como rascunho de estudo. Confira referências, datas, protocolos e exigências da professora antes de entregar. Não insira dados identificáveis de pacientes. O site não substitui orientação docente ou protocolos clínicos.
