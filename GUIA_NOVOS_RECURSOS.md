# KAW Generetor — novos recursos acadêmicos

## O que foi adicionado
- Tutora IA com histórico recente salvo localmente e sugestões de perguntas.
- Geração de flashcards por tema, com navegação e revelação de resposta.
- Geração de simulados de múltipla escolha com correção e explicações.
- Agenda acadêmica local para provas, trabalhos, apresentações e revisões.
- Atalhos de navegação para Tutora IA e Agenda.

## Como executar
1. Instale Node.js (versão LTS).
2. Copie `.env.example` para `.env` e configure uma chave válida de um provedor suportado, como `OPENAI_API_KEY` ou `GEMINI_API_KEY`.
3. No terminal, dentro da pasta do projeto, execute `npm start`.
4. Abra `http://localhost:3000`.

## Privacidade e limitações
- A chave de API fica no servidor, nunca no JavaScript do navegador.
- O histórico da tutora, agenda, tarefas e biblioteca são salvos no navegador atual e não sincronizam automaticamente entre aparelhos.
- Os recursos de IA exigem chave válida e podem gerar erros quando a API estiver indisponível ou sem créditos.
- A tutora é apoio acadêmico; confirme conteúdo e protocolos com a docente e fontes oficiais.
- A exportação original do projeto continua disponível (HTML e impressão/Salvar como PDF). Esta edição não implementa ainda exportação nativa `.pptx` ou `.docx`.
