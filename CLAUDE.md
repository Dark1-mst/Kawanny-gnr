# KAW Generetor — contexto para Claude

Este projeto é um site pessoal para ajudar uma estudante universitária de Enfermagem a organizar materiais de estudo. Leia este arquivo e inspecione os arquivos existentes antes de alterar qualquer coisa. Preserve o que já funciona e implemente mudanças pequenas, testáveis e compatíveis com o projeto atual.

## Identidade e experiência

- Nome do produto: **KAW Generetor**.
- Idioma: português brasileiro.
- Identidade visual: preto, rosa-claro e tons suaves, com bom contraste e layout mobile-first.
- As fotos pessoais já usadas no site ficam em `assets/`. Mantenha-as locais e não as envie a serviços externos.
- A tela de entrada deve continuar mostrando: **“Olá, minha princesa! Seu desenvolvedor gosta muito de você, meu bem!”**. Não incluir “meu amor” nessa saudação.
- A página principal pode usar “minha princesa”, “meu bem” e “meu amor” em mensagens carinhosas. Esses tratamentos são apenas para o conteúdo do site, não para as respostas do Claude no chat.
- Manter detalhes animados discretos e acessíveis, respeitando `prefers-reduced-motion`.

## Arquivos e tecnologias

- `index.html`: interface, formulário, modal de configuração da IA e conteúdo.
- `styles.css`: identidade visual, estados, animações e breakpoints responsivos.
- `scripts.js`: geração de materiais, pesquisa de fontes e imagens, seleção de modelos, easter egg e exportação.
- `api/generate.js`: função de IA compatível com Vercel, lendo chaves somente do ambiente do servidor.
- `server.js` / `package.json`: servidor local sem dependências para servir a interface e a rota da IA.
- `assets/`: fotos locais da usuária.
- O site usa HTML, CSS e JavaScript sem framework ou dependências de build.

## Funcionalidades atuais

- Criar apresentações, resumos e trabalhos escritos.
- Escolher tamanho do material e etapa escolar; Enfermagem no ensino superior é a opção padrão.
- Selecionar uma área de foco, como Fundamentos, Semiologia, Farmacologia, Urgência e Emergência ou Estudo de Caso Clínico.
- Atalhos de temas de Enfermagem: SAE/Processo de Enfermagem, Semiologia, Farmacologia segura, sinais vitais, curativos e casos clínicos.
- Gerar um roteiro demonstrativo sem chave; editar diretamente títulos e textos; pesquisar referências na BVS, SciELO e PubMed; consultar imagens no Wikimedia Commons; baixar slides em HTML ou imprimir/salvar como PDF.
- O coração perto do título da seção de criação é um easter egg: mostra uma mensagem carinhosa de Enfermagem.
- A interface chama o endpoint `/api/generate`; há uma função serverless compatível com Vercel (`api/generate.js`) que lê chaves de variáveis de ambiente do servidor. O endpoint pode operar sem chaves no modo demonstrativo; hospedagem e configuração privada das variáveis ainda precisam ser confirmadas antes de ativar/publicar a IA.
- Para uso local, configure chaves recém-emitidas no arquivo `.env` (ignorado pelo Git) e execute `npm start`; o site abre em `http://127.0.0.1:3000`. Não abra `index.html` como arquivo `file:` para testar a IA.

## Próximos ajustes sugeridos

1. **Confirmar hospedagem e ativação segura da IA.** A rota serverless e o exemplo de variáveis de ambiente já existem, mas a usuária precisa confirmar o provedor de hospedagem antes de escolher ou publicar a integração. Nunca peça a chave em conversa nem a escreva em arquivos versionados; configure-a apenas no ambiente privado do provedor. Se criar `.env.example`, use apenas valores fictícios; exclua `.env` do controle de versão.
   - Para testes locais, o servidor sem dependências carrega `.env` sem registrar os valores. Não faça chamadas pagas sem autorização.
2. Evoluir os materiais de demonstração para roteiros de Enfermagem mais úteis, sem apresentar conteúdo genérico como orientação clínica.
3. Melhorar a organização visual do material gerado e a experiência de edição em telas pequenas.
4. Conferir acessibilidade: foco visível, navegação por teclado, nomes acessíveis, contraste e movimento reduzido.

## Segurança e responsabilidade acadêmica

- Materiais gerados são apoio ao estudo, não diagnóstico, prescrição ou orientação para atendimento de pacientes reais.
- Não inventar referências, protocolos, dados clínicos ou citações. Mostrar apenas fontes reais retornadas pela pesquisa; quando estiver no modo demonstrativo, identificar claramente que os links são pesquisas para a estudante conferir.
- Caso clínico deve ser explicitamente fictício ou devidamente anonimizado. Nunca solicitar, armazenar ou exibir dados identificáveis de pacientes.
- Recomendar a conferência de protocolos institucionais atuais, fontes acadêmicas e orientações docentes.
- Nunca incluir a chave de API em HTML/JavaScript público, no repositório, em logs, capturas de tela ou material exportado.

## Como conferir mudanças

- Conferir a sintaxe com `node --check .\scripts.js`.
- Testar o site no navegador em desktop e celular (incluindo largura de 320 px), verificando que não apareça rolagem horizontal.
- Testar a seleção de um atalho de Enfermagem, confirmar assunto/disciplina/formato preenchidos e gerar um roteiro demonstrativo.
- Testar modal da IA sem usar uma chave verdadeira; se for criada uma integração de servidor, usar mocks para validar o endpoint.
- Não testar chamadas pagas nem publicar o site até a usuária confirmar o provedor de hospedagem e configurar a chave diretamente no ambiente privado desse provedor.

## Primeira solicitação para Claude

> Inspecione este projeto e este `CLAUDE.md`. Preserve a identidade visual preto/rosa, as fotos locais, a tela de boas-vindas, o tom carinhoso apenas dentro do site e o fluxo de estudo de Enfermagem. Primeiro faça uma revisão breve do estado atual e liste os ajustes mais importantes que podem ser feitos sem serviços ou segredos. Depois implemente as melhorias de interface e acessibilidade mais relevantes, teste no celular e no desktop e resuma os arquivos alterados. Não solicite nem exponha minha chave da API. Para ligar o Gemini automaticamente, mantenha a chave no servidor por variável de ambiente e me pergunte qual será o provedor de hospedagem antes de escolher ou publicar a integração.
