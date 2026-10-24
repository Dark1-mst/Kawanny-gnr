# Como abrir o KAW Estudos no celular da Kawanny

## Importante
O site precisa estar publicado em um endereço HTTPS para que ela consiga abrir no celular dela de qualquer lugar e instalar como aplicativo. O ZIP sozinho não cria um link público.

## Publicar
1. Envie a pasta `kawanny GNR` para um repositório privado no GitHub (não envie o arquivo `.env`).
2. Importe o repositório na Vercel e faça o deploy. O projeto já inclui `vercel.json` e a rota `/api/generate`.
3. Nas configurações de ambiente da Vercel, adicione `OPENAI_API_KEY` com uma chave nova e privada. Não reutilize chaves que foram compartilhadas em conversas.
4. Publique e teste o endereço HTTPS no próprio celular, incluindo a Tutora IA e o gerador de materiais.
5. Envie o link à Kawanny. No iPhone: Safari → Compartilhar → Adicionar à Tela de Início. No Android: Chrome → menu ⋮ → Instalar app ou Adicionar à tela inicial (a opção pode variar).

## Recursos para celular
- Interface adaptada para telas estreitas e navegação fixa inferior.
- Manifesto de aplicativo para instalação na tela inicial.
- Cache básico de arquivos estáticos para carregamento mais rápido e suporte offline limitado. A IA exige conexão e a agenda/biblioteca local continuam no dispositivo atual.

## Segurança
- Nunca publique `.env` nem coloque a chave no HTML/JavaScript do navegador.
- Confira `.gitignore` antes de enviar para GitHub.
- A API da OpenAI pode exigir faturamento/créditos separados da assinatura do ChatGPT.
