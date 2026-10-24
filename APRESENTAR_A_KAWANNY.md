# KAW Generetor — edição especial

Um espaço de estudos personalizado para a Kawanny, pensado para tornar a rotina acadêmica mais organizada, acolhedora e bonita.

## O que há nesta edição

- Identidade visual refinada em tons de rosa, vinho e creme, com foco em legibilidade e uso em celular.
- Plano diário interativo: adicionar tarefas, marcar como concluídas, remover tarefas e acompanhar o progresso.
- Plano salvo no navegador em que foi criado (não sincroniza automaticamente entre aparelhos).
- Biblioteca local para guardar e reabrir materiais de estudo.
- Ferramentas de estudo e criação de materiais que já faziam parte do projeto original.
- Melhorias de acessibilidade para foco de teclado e controles.

## Como executar localmente

1. Instale uma versão LTS recente do Node.js.
2. Extraia a pasta `kawanny GNR`.
3. Abra um terminal nessa pasta e execute `npm start`.
4. Acesse `http://localhost:3000` no navegador.

## Configurar a API da OpenAI

1. Copie `.env.example` para `.env`.
2. Preencha `OPENAI_API_KEY` com uma chave de API criada na plataforma de API da OpenAI.
3. Nunca coloque a chave em `index.html` ou `scripts.js`, e nunca compartilhe o arquivo `.env`.
4. Reinicie o servidor e use a ferramenta de teste de IA nas configurações do site.

A utilização da API pode gerar cobrança separada da assinatura do ChatGPT. O conteúdo acadêmico gerado deve ser revisado e as fontes conferidas antes da entrega.

## Antes de publicar

- Teste a geração real com uma chave válida.
- Configure HTTPS e variáveis de ambiente no serviço de hospedagem.
- Se quiser que a biblioteca e o plano sincronizem entre dispositivos, implemente autenticação e banco de dados; o armazenamento atual é local.


### Foco acadêmico fixo
O gerador foi simplificado para a faculdade de Enfermagem: a seleção de etapa foi removida e o nível superior é definido automaticamente tanto no navegador quanto no servidor.
