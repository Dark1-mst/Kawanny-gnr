const form = document.querySelector("#generator-form");
const topicInput = document.querySelector("#topic");
const generateButton = document.querySelector("#generate-button");
const progressState = document.querySelector("#progress-state");
const resultSection = document.querySelector("#resultado");
const settingsDialog = document.querySelector("#settings-dialog");
const briefInput = document.querySelector("#brief");
const providerSelect = document.querySelector("#provider");
const sourceList = document.querySelector("#source-list");
const materialList = document.querySelector("#material-list");
const imageGallery = document.querySelector("#image-gallery");
const imageResults = document.querySelector("#image-results");
const toast = document.querySelector("#toast");
const welcomeLoader = document.querySelector("#welcome-loader");

function handleMissingLocalPhoto(image) {
  const frame = image.closest(".photo-frame, .loader-photo");
  if (frame) {
    frame.hidden = true;
    return;
  }

  const avatar = image.closest(".avatar");
  if (avatar) {
    avatar.replaceChildren();
    avatar.textContent = "K";
    avatar.setAttribute("aria-hidden", "true");
  }
}

document.querySelectorAll('img[src^="assets/"]').forEach((image) => {
  image.addEventListener("error", () => handleMissingLocalPhoto(image), { once: true });
  if (image.complete && !image.naturalWidth) handleMissingLocalPhoto(image);
});

let toastTimer;
let selectedImages = [];

function showWelcomeLoader() {
  welcomeLoader.classList.remove("is-hidden");
  const progress = welcomeLoader.querySelector(".loader-progress span");
  progress.replaceWith(progress.cloneNode());
  window.setTimeout(() => welcomeLoader.classList.add("is-hidden"), 2600);
}

window.setTimeout(() => welcomeLoader.classList.add("is-hidden"), 2600);
window.addEventListener("pageshow", (event) => {
  if (event.persisted) showWelcomeLoader();
});

const formatNames = {
  slides: "Apresentação de slides",
  resumo: "Resumo para estudar",
  trabalho: "Trabalho escrito"
};

document.querySelector("#today-label").textContent = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date());

function showToast(message, isError = false) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.toggle("error", isError);
  toast.classList.add("show");
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 3600);
}

function createSources(topic, groundedSources = []) {
  const search = encodeURIComponent(`${topic} enfermagem`);
  const commonSources = [
    { title: "BVS — Biblioteca Virtual em Saúde", detail: "Literatura científica e fontes em saúde", url: `https://pesquisa.bvsalud.org/portal/?q=${search}` },
    { title: "SciELO", detail: "Periódicos científicos da América Latina", url: `https://search.scielo.org/?q=${search}` },
    { title: "PubMed", detail: "Artigos biomédicos e de enfermagem", url: `https://pubmed.ncbi.nlm.nih.gov/?term=${search}` }
  ];
  const verified = groundedSources.filter((item) => item.url && /^https?:\/\//i.test(item.url));
  const sources = verified.length ? verified.slice(0, 6).map((item) => ({
    title: item.title || new URL(item.url).hostname,
    detail: new URL(item.url).hostname,
    url: item.url
  })) : commonSources;

  sourceList.replaceChildren(...sources.map((source) => {
    const link = document.createElement("a");
    link.className = "source-link";
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    const copy = document.createElement("span");
    const title = document.createElement("strong");
    title.textContent = source.title;
    const detail = document.createElement("small");
    detail.textContent = source.detail;
    copy.append(title, detail);
    const arrow = document.createElement("span");
    arrow.textContent = "↗";
    link.append(copy, arrow);
    return link;
  }));
  document.querySelector("#image-search-link").href = `https://commons.wikimedia.org/w/index.php?search=${search}&title=Special:MediaSearch&type=image`;
}

function plainText(value) {
  return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function setGalleryMessage(message) {
  imageResults.replaceChildren();
  const notice = document.createElement("div");
  notice.className = "gallery-message";
  notice.textContent = message;
  imageResults.append(notice);
}

async function loadImages(topic) {
  const button = document.querySelector("#search-images");
  imageGallery.hidden = false;
  selectedImages = [];
  document.querySelector("#gallery-count").textContent = "";
  imageResults.replaceChildren();
  button.disabled = true;
  button.textContent = "Buscando...";
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: topic,
    gsrnamespace: "6",
    gsrlimit: "6",
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: "640",
    format: "json",
    origin: "*"
  });

  try {
    const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`);
    if (!response.ok) throw new Error(`Busca de imagens indisponível (erro ${response.status}).`);
    const data = await response.json();
    const pages = Object.values(data?.query?.pages || {});
    const images = pages.flatMap((page) => {
      const info = page.imageinfo?.[0];
      if (!info?.thumburl || !info?.descriptionurl) return [];
      const metadata = info.extmetadata || {};
      return [{
        title: page.title.replace(/^File:/i, ""),
        url: info.thumburl,
        sourceUrl: info.descriptionurl,
        artist: plainText(metadata.Artist?.value) || "Autor não informado",
        license: plainText(metadata.LicenseShortName?.value) || "Consulte a licença na página da imagem"
      }];
    });
    if (!images.length) {
      setGalleryMessage("Não encontramos imagens para este tema. Tente outra palavra ou abra a busca do Wikimedia Commons.");
      document.querySelector("#gallery-count").textContent = "Nenhum resultado";
      return;
    }
    renderImageChoices(images);
    document.querySelector("#gallery-count").textContent = `${images.length} sugestões`;
  } catch (error) {
    setGalleryMessage(`${error.message || "Não foi possível carregar as imagens."} Você ainda pode usar o link para abrir a busca do Wikimedia Commons.`);
    document.querySelector("#gallery-count").textContent = "Busca indisponível";
  } finally {
    button.disabled = false;
    button.textContent = "Carregar sugestões";
  }
}

function renderImageChoices(images) {
  imageResults.replaceChildren(...images.map((image) => {
    const choice = document.createElement("div");
    choice.className = "image-choice";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "image-option";
    button.setAttribute("aria-pressed", "false");
    const img = document.createElement("img");
    img.src = image.url;
    img.alt = image.title;
    img.loading = "lazy";
    const title = document.createElement("strong");
    title.textContent = image.title;
    const attribution = document.createElement("small");
    attribution.textContent = `${image.artist} · ${image.license}`;
    button.append(img, title, attribution);
    button.addEventListener("click", () => {
      const already = selectedImages.includes(image);
      if (!already && selectedImages.length >= 4) { showToast("Você pode escolher até 4 imagens.", true); return; }
      selectedImages = already ? selectedImages.filter((item) => item !== image) : [...selectedImages, image];
      choice.classList.toggle("selected", !already);
      button.classList.toggle("selected", !already);
      button.setAttribute("aria-pressed", String(!already));
      updateResultStats();
      showToast(already ? "Imagem removida dos slides." : `Imagem adicionada (${selectedImages.length}/4). Ela entra nos slides com os créditos.`);
    });
    const source = document.createElement("a");
    source.className = "image-credit";
    source.href = image.sourceUrl;
    source.target = "_blank";
    source.rel = "noopener noreferrer";
    source.textContent = "Ver licença e créditos ↗";
    choice.append(button, source);
    return choice;
  }));
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function paragraphText(value) {
  return String(value || "").replace(/\s*\[\[P\]\]\s*/g, "\n\n").replace(/[ \t]+/g, " ").trim();
}

function renderMaterials(topic, format, focus, sections) {
  const safeSections = Array.isArray(sections) && sections.length ? sections : buildDemo(topic, format, "medio", focus);
  materialList.replaceChildren(...safeSections.map((section, index) => {
    const card = document.createElement("article");
    card.className = "material-card";
    const head = document.createElement("div");
    head.className = "material-card-head";
    const number = document.createElement("span");
    number.className = "material-number";
    number.textContent = String(index + 1).padStart(2, "0");
    const title = document.createElement("h3");
    title.textContent = normalizeText(section.title) || `Parte ${index + 1}`;
    title.contentEditable = "true";
    title.setAttribute("aria-label", `Editar título da parte ${index + 1}`);
    head.append(number, title);
    const description = document.createElement("p");
    description.textContent = paragraphText(section.content) || "Desenvolva este ponto com informações verificadas e exemplos.";
    description.contentEditable = "true";
    description.setAttribute("aria-label", `Editar conteúdo da parte ${index + 1}`);
    card.append(head, description);
    return card;
  }));
  document.querySelector("#result-title").textContent = topic;
  document.querySelector("#result-subtitle").textContent = `${focus} · ${formatNames[format]} · Revise as informações e personalize antes de entregar.`;
  resultSection.dataset.format = format;
  document.querySelector("#present-deck").innerHTML = format === "slides" ? "<span>▶</span> Apresentar" : "<span>▶</span> Visualizar";
  resultSection.hidden = false;
}

function buildDemo(topic, format, length, focus) {
  const count = length === "curto" ? 5 : length === "completo" ? 10 : 8;
  const nursingSections = [
    ["Tema e contexto", `Apresente “${topic}” dentro da área de ${focus}. Delimite o assunto e explique a relevância para a formação e o cuidado de enfermagem, com apoio de fontes atualizadas.`],
    ["Conceitos fundamentais", "Defina os principais termos com base em livros-texto, artigos científicos e materiais indicados pela docente. Diferencie conceitos próximos e registre as fontes consultadas."],
    ["Perspectiva da Enfermagem", "Relacione o assunto às atribuições, ao processo de enfermagem e às necessidades da pessoa, família ou comunidade. Consulte as normas profissionais e os conteúdos da disciplina."],
    ["Avaliação e coleta de dados", "Organize quais aspectos podem ser estudados e avaliados neste tema, sempre de acordo com o conteúdo da disciplina, a literatura e as orientações de sua instituição."],
    ["Planejamento do cuidado", "Use o processo de enfermagem como estrutura para discutir objetivos e possibilidades de cuidado. Valide classificações, terminologias e condutas nas referências oficiais e com a docente."],
    ["Segurança e ética", "Considere segurança do paciente, comunicação, privacidade, registro e princípios éticos. Nunca inclua dados que identifiquem pacientes; siga as normas e protocolos institucionais."],
    ["Aplicação ou caso para discussão", "Construa um exemplo fictício e sem dados identificáveis para relacionar os conceitos estudados. Sinalize dúvidas e discuta o raciocínio com a docente; não use este rascunho como orientação clínica."],
    ["Questões para revisar", "Crie perguntas para revisar os conceitos, relacionar teoria e prática e identificar o que precisa ser confirmado nos materiais da disciplina."],
    ["Síntese", "Retome as ideias centrais e indique o que você aprendeu sobre o tema. Revise a coerência do material e confirme informações clínicas em fontes atuais."],
    ["Referências para consultar", "Pesquise fontes reais na BVS, SciELO, PubMed e nos materiais da disciplina. Registre autoria, título, publicação, ano, link e data de acesso; não cite fontes que não consultou."]
  ];
  const sections = nursingSections.slice(0, count - 2).concat(nursingSections.slice(-2)).map(([title, content]) => ({ title, content }));
  if (format === "resumo") {
    sections[0] = { title: `Roteiro de estudo: ${topic}`, content: `Organize a revisão de “${topic}” em ${focus}. Use os tópicos como perguntas-guia, responda com suas palavras e confira cada resposta no material da disciplina e em fontes científicas.` };
  } else if (format === "trabalho") {
    sections[0] = { title: "Introdução", content: `Apresente “${topic}” em ${focus}, contextualize sua relevância para a Enfermagem e formule o objetivo do trabalho. Apoie a contextualização em fontes reais e escreva com suas próprias palavras.` };
  }
  if (focus === "Estudo de caso clínico") {
    const caseSection = sections.find((section) => section.title === "Aplicação ou caso para discussão");
    if (caseSection) caseSection.content = "Elabore um caso estritamente fictício, sem dados pessoais ou identificadores. Use-o apenas para discutir coleta de dados, comunicação e raciocínio de enfermagem com a docente; não sugira diagnóstico ou conduta para pacientes reais.";
  }
  return sections;
}

async function generateWithServer(payload) {
  const response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.sections?.length) throw new Error(data?.error || "A IA não respondeu agora.");
  return { title: data.title, sections: data.sections, groundedSources: data.sources || [], provider: data.provider };
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const brief = normalizeText(briefInput.value);
  const topic = normalizeText(topicInput.value) || brief.slice(0, 120);
  if (!topic) {
    briefInput.focus();
    showToast("Me conta o que você quer criar para eu começar. ♥", true);
    return;
  }
  const format = document.querySelector("#format").value;
  const focus = document.querySelector("#focus").value;
  const level = document.querySelector("#level").value;
  const length = document.querySelector("#length").value;
  form.hidden = true;
  progressState.hidden = false;
  generateButton.disabled = true;
  imageGallery.hidden = true;
  selectedImages = [];

  try {
    let sections, groundedSources = [], usedAi = false, finalTopic = topic, providerName = "", aiFailure = "";
    startProgressMessages();
    try {
      const generated = await generateWithServer({ brief, topic: normalizeText(topicInput.value), provider: providerSelect.value, format, level, length, focus });
      sections = generated.sections;
      groundedSources = generated.groundedSources;
      finalTopic = generated.title || topic;
      usedAi = true;
      providerName = generated.provider || "";
    } catch (error) {
      sections = buildDemo(topic, format, length, focus);
      aiFailure = error instanceof TypeError ? "O servidor de IA não está disponível neste ambiente." : error.message || "A IA não respondeu.";
    }
    stopProgressMessages();
    document.querySelector(".source-reminder").textContent = usedAi && groundedSources.length
      ? "Fontes encontradas pela pesquisa da IA. Abra os links e confira antes de citar."
      : "No modo de demonstração, estes links abrem pesquisas para você conferir. Verifique as fontes antes de entregar.";
    renderMaterials(finalTopic, format, focus, sections);
    createSources(finalTopic, groundedSources);
    resultSection.dataset.ai = usedAi && groundedSources.length ? "1" : "";
    updateResultStats();
    void loadImages(finalTopic);
    celebrate();
    resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
    showToast(usedAi
      ? `Pronto, minha princesa! Material criado com ${providerName || "IA"}. ♥`
      : `${aiFailure || "A IA não respondeu agora."} Montei um roteiro demonstrativo, sem IA.`);
  } catch (error) {
    showToast(error.message || "Não foi possível gerar o material. Tente novamente.", true);
    form.hidden = false;
  } finally {
    progressState.hidden = true;
    generateButton.disabled = false;
    form.hidden = false;
  }
});

document.querySelectorAll(".suggestion").forEach((button) => {
  button.addEventListener("click", () => {
    topicInput.value = button.dataset.topic;
    topicInput.focus();
    document.querySelector("#clear-topic").hidden = false;
  });
});

document.querySelectorAll(".nursing-template").forEach((button) => {
  button.addEventListener("click", () => {
    topicInput.value = button.dataset.topic;
    document.querySelector("#focus").value = button.dataset.focus;
    document.querySelector("#format").value = button.dataset.format;
    document.querySelector("#clear-topic").hidden = false;
    document.querySelectorAll(".nursing-template").forEach((template) => {
      const selected = template === button;
      template.classList.toggle("is-selected", selected);
      template.setAttribute("aria-pressed", String(selected));
    });
    topicInput.focus();
    showToast("Tema de Enfermagem selecionado. Você pode editar o assunto antes de criar.");
  });
});

topicInput.addEventListener("input", () => {
  document.querySelector("#clear-topic").hidden = !topicInput.value;
  document.querySelectorAll(".nursing-template").forEach((template) => {
    const selected = template.dataset.topic === topicInput.value;
    template.classList.toggle("is-selected", selected);
    template.setAttribute("aria-pressed", String(selected));
  });
});
document.querySelector("#clear-topic").addEventListener("click", () => {
  topicInput.value = "";
  document.querySelector("#clear-topic").hidden = true;
  topicInput.focus();
});

const careMessages = [
  "Easter egg de Enfermagem: cuidar também é escutar com atenção. 💗",
  "Lembrete gentil: cada grande profissional já foi estudante um dia. Você está no caminho! ✨",
  "Plantão do carinho: respire, hidrate-se e celebre cada coisa nova que aprendeu. ♡"
];
document.querySelector("#care-secret").addEventListener("click", (event) => {
  const button = event.currentTarget;
  button.classList.remove("is-celebrating");
  void button.offsetWidth;
  button.classList.add("is-celebrating");
  const message = careMessages[Math.floor(Math.random() * careMessages.length)];
  showToast(message);
});

document.querySelector("#search-images").addEventListener("click", () => {
  const topic = normalizeText(document.querySelector("#result-title").textContent);
  if (topic) void loadImages(topic);
});

function slideBullets(text) {
  const parts = normalizeText(text).split(/(?<=[.!?])\s+/).filter(Boolean);
  return parts.slice(0, 4);
}

async function toDataUrl(url) {
  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 8000);
    const response = await fetch(url, { signal: controller.signal });
    window.clearTimeout(timer);
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
}

const deckCss = `*{box-sizing:border-box;margin:0}:root{--u:min(1vw,1.6vh);--ink:#161216;--pink:#e8658b;--soft:#fff0f4}@media(orientation:portrait){:root{--u:min(2.6vw,1.2vh)}}html,body{height:100%;background:#0e0b0f;color:var(--ink);font-family:"DM Sans",system-ui,-apple-system,"Segoe UI",sans-serif}.slide{display:none;position:fixed;inset:0;flex-direction:column;justify-content:center;padding:calc(var(--u)*6) calc(var(--u)*7) calc(var(--u)*10);background:var(--soft);overflow:hidden}.slide.on{display:flex}.slide:before{content:"";position:absolute;right:-15%;top:-35%;width:65%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,#ffbdd1aa,transparent 70%)}.slide>*{position:relative}.k{font-size:calc(var(--u)*1.4);letter-spacing:.22em;font-weight:700;color:var(--pink);text-transform:uppercase}h1,h2{font-family:Georgia,"Times New Roman",serif;line-height:1.1;margin:calc(var(--u)*1.6) 0 calc(var(--u)*3)}h2{font-size:calc(var(--u)*4.4)}.cover{background:#141015;color:#fff}.cover:before{background:radial-gradient(circle,#e8658b66,transparent 70%)}.cover h1{font-size:calc(var(--u)*7);max-width:90%}.cover p{color:#f6bfd0;font-size:calc(var(--u)*2)}.cover .heart{color:var(--pink);font-size:calc(var(--u)*3);margin-bottom:calc(var(--u)*2)}ul{list-style:none;padding:0}li{position:relative;padding-left:calc(var(--u)*3.2);font-size:calc(var(--u)*2.2);line-height:1.5;margin-bottom:calc(var(--u)*1.5)}li:before{content:"♥";position:absolute;left:0;top:.28em;font-size:.6em;color:var(--pink)}.row{display:flex;gap:calc(var(--u)*4);align-items:center}.row>div{flex:1;min-width:0}figure{flex:0 0 36%}figure img{display:block;width:100%;max-height:calc(var(--u)*32);object-fit:cover;border-radius:calc(var(--u)*1.6)}figcaption{margin-top:calc(var(--u)*.8);font-size:calc(var(--u)*1.1);color:#6b5a62}@media(orientation:portrait){.row{flex-direction:column;align-items:stretch}figure{flex:none}figure img{max-height:calc(var(--u)*24)}}.num{position:absolute!important;right:calc(var(--u)*4);bottom:calc(var(--u)*9);font-size:calc(var(--u)*1.4);font-weight:700;color:#c69aa9}.refs li{font-size:calc(var(--u)*1.7)}.refs a{color:#b83e66;word-break:break-word}.note{margin-top:calc(var(--u)*2);font-size:calc(var(--u)*1.3);color:#6b5a62}.bar{position:fixed;left:0;right:0;bottom:0;z-index:5;display:flex;align-items:center;gap:10px;padding:10px 14px calc(10px + env(safe-area-inset-bottom,0px));background:#141015ee;color:#fff;font-size:13px}.bar i{position:absolute;left:0;top:0;height:3px;background:var(--pink);transition:width .3s}.bar span{flex:1;text-align:center}.bar button{min-width:44px;min-height:44px;border:1px solid #5a4650;border-radius:12px;color:#fff;background:#241c22;font-size:18px}@page{size:1280px 720px;margin:0}@media print{:root{--u:12.8px}html,body{background:none}.slide{display:flex!important;position:relative;inset:auto;width:1280px;height:720px;padding-bottom:60px;break-after:page}.bar{display:none}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}`;

const deckScript = `const s=[...document.querySelectorAll(".slide")],c=document.getElementById("c"),p=document.getElementById("p");let i=0,x=0;function go(n){i=Math.max(0,Math.min(s.length-1,n));s.forEach((e,j)=>e.classList.toggle("on",j===i));c.textContent=(i+1)+" / "+s.length;p.style.width=((i+1)/s.length*100)+"%"}go(0);document.getElementById("b").onclick=()=>go(i-1);document.getElementById("n").onclick=()=>go(i+1);document.getElementById("f").onclick=()=>{document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.()};addEventListener("keydown",e=>{if(["ArrowRight","PageDown"," "].includes(e.key))go(i+1);if(["ArrowLeft","PageUp"].includes(e.key))go(i-1)});addEventListener("touchstart",e=>x=e.changedTouches[0].clientX,{passive:true});addEventListener("touchend",e=>{const d=e.changedTouches[0].clientX-x;if(Math.abs(d)>50)go(i+(d<0?1:-1))});document.getElementById("t").onclick=()=>{const b=document.body;b.dataset.t=((+b.dataset.t||0)+1)%3};if(location.hash==="#pdf")addEventListener("load",()=>setTimeout(print,500));`;

async function buildDeck() {
  if (resultSection.dataset.format && resultSection.dataset.format !== "slides") return buildDocument();
  const title = normalizeText(document.querySelector("#result-title").textContent);
  const subtitle = normalizeText(document.querySelector("#result-subtitle").textContent).split(" · ");
  const focus = subtitle[0] || "Enfermagem";
  const kind = formatNames[resultSection.dataset.format || "slides"];
  const images = await Promise.all(selectedImages.map(async (image) => ({ ...image, data: await toDataUrl(image.url) })));
  const cards = [...materialList.querySelectorAll(".material-card")];
  const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date());
  const cover = `<section class="slide cover"><div class="heart">♥</div><div class="k">KAW Generetor · ${escapeHtml(focus)}</div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(kind)} · ${escapeHtml(date)}</p><p class="by">Por Kawanny ♥</p></section>`;
  const body = cards.map((card, index) => {
    const heading = escapeHtml(card.querySelector("h3").textContent);
    const items = slideBullets(card.querySelector("p").textContent).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    const image = index % 2 === 0 ? images[index / 2] : undefined;
    const hasImage = Boolean(image);
    const figure = hasImage ? `<figure><img src="${escapeHtml(image.data)}" alt="${escapeHtml(image.title)}"><figcaption>${escapeHtml(image.artist)} · ${escapeHtml(image.license)}</figcaption></figure>` : "";
    return `<section class="slide"><div class="k">Parte ${String(index + 1).padStart(2, "0")}</div><h2>${heading}</h2><div class="row"><div><ul>${items}</ul></div>${figure}</div><span class="num">${String(index + 1).padStart(2, "0")}</span></section>`;
  }).join("");
  const links = [...sourceList.querySelectorAll("a")].map((a) => `<li><a href="${escapeHtml(a.href)}">${escapeHtml(a.querySelector("strong").textContent)}</a></li>`).join("");
  const credits = images.map((image) => `<li>Imagem: ${escapeHtml(image.title)} — ${escapeHtml(image.artist)} (${escapeHtml(image.license)}) · <a href="${escapeHtml(image.sourceUrl)}">fonte</a></li>`).join("");
  const refs = `<section class="slide refs"><div class="k">Para conferir</div><h2>Fontes e créditos</h2><ul>${links}${credits}</ul><p class="note">Material de apoio aos estudos: confira as fontes, os protocolos da sua instituição e as orientações da docente antes de entregar.</p></section>`;
  const agenda = `<section class="slide agenda"><div class="k">Roteiro</div><h2>O que vamos ver</h2><ol>${cards.map((card) => `<li>${escapeHtml(card.querySelector("h3").textContent)}</li>`).join("")}</ol></section>`;
  const closing = `<section class="slide cover end"><div class="heart">♥</div><h1>Obrigada!</h1><p>Vamos conversar sobre o tema?</p></section>`;
  const bar = `<nav class="bar" aria-label="Navegação dos slides"><i id="p"></i><button id="b" aria-label="Slide anterior">‹</button><span id="c"></span><button id="t" aria-label="Trocar as cores">◐</button><button id="f" aria-label="Tela cheia">⛶</button><button id="n" aria-label="Próximo slide">›</button></nav>`;
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${escapeHtml(title)}</title><style>${deckCss}${deckCss2}</style></head><body><main>${cover}${agenda}${body}${refs}${closing}</main>${bar}<script>${deckScript}<\/script></body></html>`;
  return { html, title, suffix: "slides" };
}

const deckCss2 = `.slide.on{animation:sIn .6s cubic-bezier(.2,.7,.2,1)}@keyframes sIn{from{opacity:0;transform:translateX(3%)}}.slide.on li{animation:liIn .55s both}.slide.on li:nth-child(2){animation-delay:.12s}.slide.on li:nth-child(3){animation-delay:.24s}.slide.on li:nth-child(4){animation-delay:.36s}@keyframes liIn{from{opacity:0;transform:translateY(12px)}}.cover .by{margin-top:calc(var(--u)*3);color:#fff;font-weight:700}.cover.end{align-items:center;text-align:center}.cover.end .heart{font-size:calc(var(--u)*8);animation:hb 1.6s infinite}@keyframes hb{50%{transform:scale(1.18)}}.agenda ol{columns:2;column-gap:calc(var(--u)*6);padding-left:calc(var(--u)*3);font-size:calc(var(--u)*2);line-height:1.6}.agenda li{list-style:decimal;margin-bottom:calc(var(--u)*1)}.agenda li:before{content:none}body[data-t="1"]{--soft:#1c1519;--ink:#fbeaf0}body[data-t="1"] figcaption,body[data-t="1"] .note{color:#d9b8c4}body[data-t="1"] .refs a{color:#ff9cbc}body[data-t="2"]{--soft:#f4efff;--pink:#8566d6;--ink:#241b3a}body[data-t="2"] .cover{background:#1d1538}body[data-t="2"] .cover p{color:#d9ccff}@media print{.slide.on,.slide.on li{animation:none}}`;

const docCss = `*{box-sizing:border-box}html{background:#f3e6ec}body{margin:0;padding-bottom:80px;font:12pt/1.5 "Times New Roman",Times,serif;color:#111}.page{width:min(100%,21cm);margin:18px auto;padding:3cm 2cm 2cm 3cm;background:#fff;box-shadow:0 10px 40px #5a1a3a22;min-height:29.7cm}@media(max-width:700px){.page{padding:28px 20px;margin:0 0 12px;min-height:0}}.capa{display:flex;flex-direction:column;justify-content:space-between;text-align:center}.capa .inst{font-weight:bold;text-transform:uppercase}.capa h1{margin:40px 0 10px;font-size:20pt;line-height:1.25;text-transform:uppercase}.capa .sub{color:#8d294d;font-size:13pt}.capa .heart{color:#df6e91;font-size:28pt}.fill{padding:0 4px;border-radius:4px;background:#ffe9f0;outline:0}h2{margin:26px 0 12px;font-size:12pt;text-transform:uppercase;break-after:avoid}h2 span{margin-right:8px;color:#c3486d}p{margin:0 0 10px;text-align:justify;text-indent:1.25cm}figure{margin:14px 0;text-align:center;break-inside:avoid}figure img{max-width:100%;max-height:8cm}figcaption{margin-top:5px;color:#444;font:10pt/1.3 Arial,sans-serif}.sumario ol{padding:0;list-style:none}.sumario li{display:flex;gap:8px;margin:8px 0}.sumario i{flex:1;border-bottom:1px dotted #999;transform:translateY(-4px)}.refs p,.nota{text-indent:0;text-align:left;word-break:break-word}.nota{color:#8d294d;font:10pt Arial,sans-serif}.tools{position:fixed;left:0;right:0;bottom:0;z-index:9;display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:center;padding:10px;background:#141015ee;color:#fff;font:13px Arial,sans-serif}.tools button{min-height:44px;padding:0 20px;border:0;border-radius:12px;color:#191518;background:#f2a9bf;font-weight:bold}@page{size:A4;margin:3cm 2cm 2cm 3cm;@bottom-right{content:counter(page);font:10pt Arial}}@media print{html{background:#fff}.page{width:auto;min-height:0;margin:0;padding:0;box-shadow:none}.capa{min-height:24cm;break-after:page}.sumario{break-after:page}.tools{display:none}.fill{background:none}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}`;

async function buildDocument() {
  const title = normalizeText(document.querySelector("#result-title").textContent);
  const focus = normalizeText(document.querySelector("#result-subtitle").textContent).split(" · ")[0] || "Enfermagem";
  const isWork = resultSection.dataset.format === "trabalho";
  const images = await Promise.all(selectedImages.map(async (image) => ({ ...image, data: await toDataUrl(image.url) })));
  const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date());
  const cards = [...materialList.querySelectorAll(".material-card")].map((card) => ({ heading: card.querySelector("h3").textContent.trim(), text: card.querySelector("p").innerText.trim() }));
  const body = cards.map((card, index) => {
    const paragraphs = card.text.split(/\n+/).map((line) => line.trim()).filter(Boolean).map((line) => `<p>${escapeHtml(line)}</p>`).join("");
    const image = index % 2 === 1 ? images[(index - 1) / 2] : undefined;
    const figure = image ? `<figure><img src="${escapeHtml(image.data)}" alt="${escapeHtml(image.title)}"><figcaption>Figura ${(index + 1) / 2} – ${escapeHtml(image.title)}. Fonte: ${escapeHtml(image.artist)} (${escapeHtml(image.license)}), Wikimedia Commons.</figcaption></figure>` : "";
    return `<h2><span>${index + 1}</span>${escapeHtml(card.heading)}</h2>${paragraphs}${figure}`;
  }).join("");
  const links = [...sourceList.querySelectorAll("a")].map((a) => `<p>${escapeHtml(a.querySelector("strong").textContent)}. Disponível em: ${escapeHtml(a.href)}. Acesso em: ${escapeHtml(date)}.</p>`).join("");
  const note = resultSection.dataset.ai ? "" : `<p class="nota">Atenção: os links acima são pesquisas, não referências. Substitua por obras e artigos que você realmente consultou (autor, título, ano).</p>`;
  const refs = `<h2><span>★</span>Referências</h2><div class="refs">${links}${note}</div>`;
  const cover = isWork ? `<section class="page capa"><div><div class="inst"><span class="fill" contenteditable="true">Nome da instituição</span></div><div><span class="fill" contenteditable="true">Curso de Enfermagem</span></div></div><div><div class="heart">♥</div><h1>${escapeHtml(title)}</h1><div class="sub">${escapeHtml(focus)}</div></div><div><div>Autora: Kawanny</div><div>Docente: <span class="fill" contenteditable="true">nome da docente</span></div><div><span class="fill" contenteditable="true">Cidade</span> · ${new Date().getFullYear()}</div></div></section>` : "";
  const toc = isWork ? `<section class="page sumario"><h2>Sumário</h2><ol>${cards.map((card, index) => `<li><span>${index + 1}</span><span>${escapeHtml(card.heading)}</span><i></i></li>`).join("")}<li><span>★</span><span>Referências</span><i></i></li></ol></section>` : "";
  const head = isWork ? "" : `<h1 style="font-size:18pt;margin:0 0 4px">${escapeHtml(title)}</h1><p class="nota">${escapeHtml(focus)} · por Kawanny ♥ · ${escapeHtml(date)}</p>`;
  const tools = `<div class="tools"><span>${isWork ? "Toque nos campos rosa para preencher a capa." : "Seu resumo está pronto."}</span><button onclick="print()">Salvar como PDF</button></div>`;
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><style>${docCss}</style></head><body>${cover}${toc}<section class="page">${head}${body}${refs}</section>${tools}<script>if(location.hash==="#pdf")addEventListener("load",()=>setTimeout(print,500));<\/script></body></html>`;
  return { html, title, suffix: isWork ? "trabalho" : "resumo" };
}

function updateResultStats() {
  const parts = materialList.children.length;
  if (!parts) return;
  const words = [...materialList.querySelectorAll("p")].reduce((sum, p) => sum + p.innerText.split(/\s+/).filter(Boolean).length, 0);
  const isSlides = (resultSection.dataset.format || "slides") === "slides";
  const stats = [
    `${parts} partes`,
    isSlides ? `~${Math.max(3, Math.round(parts * 1.2))} min de apresentação` : `${words} palavras · ~${Math.max(1, Math.round(words / 200))} min de leitura`,
    `${selectedImages.length} imagem(ns) escolhida(s)`,
    `${sourceList.children.length} fontes`
  ];
  document.querySelector("#result-stats").replaceChildren(...stats.map((text) => el("span", "stat-chip", text)));
}

async function withDeck(button, action) {
  if (!materialList.children.length) return;
  const label = button.innerHTML;
  button.disabled = true;
  button.textContent = "Preparando...";
  try {
    await action(await buildDeck());
  } catch (error) {
    showToast(error.message || "Não foi possível preparar os slides.", true);
  } finally {
    button.disabled = false;
    button.innerHTML = label;
  }
}

function deckUrl(html, hash = "") {
  return URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" })) + hash;
}

document.querySelector("#download-html").addEventListener("click", (event) => withDeck(event.currentTarget, ({ html, title, suffix }) => {
  const anchor = document.createElement("a");
  anchor.href = deckUrl(html);
  anchor.download = `${fileName(title)}-${suffix}.html`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  showToast("Slides baixados! Abra o arquivo no navegador para apresentar.");
}));

document.querySelector("#present-deck").addEventListener("click", (event) => withDeck(event.currentTarget, ({ html }) => {
  if (!window.open(deckUrl(html), "_blank")) showToast("Permita pop-ups para apresentar, ou use Baixar slides.", true);
}));

document.querySelector("#print-result").addEventListener("click", (event) => withDeck(event.currentTarget, ({ html }) => {
  if (!window.open(deckUrl(html, "#pdf"), "_blank")) showToast("Permita pop-ups para gerar o PDF.", true);
  else showToast("Na tela de impressão, escolha “Salvar como PDF”.");
}));

document.querySelector("#share-deck").addEventListener("click", (event) => withDeck(event.currentTarget, async ({ html, title, suffix }) => {
  const file = new File([html], `${fileName(title)}-${suffix}.html`, { type: "text/html" });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title }); } catch { /* cancelado */ }
  } else {
    document.querySelector("#download-html").click();
  }
}));

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function fileName(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "meu-trabalho";
}

const sidebar = document.querySelector("#sidebar");
const mobileScrim = document.querySelector("#mobile-scrim");
const mobileMenuButton = document.querySelector("#mobile-menu");
const mobileLayout = window.matchMedia("(max-width: 760px)");
function openSettings() {
  if (mobileLayout.matches && sidebar.classList.contains("open")) setMobileMenuOpen(false);
  settingsDialog.showModal();
}
document.querySelector("#open-settings").addEventListener("click", openSettings);
document.querySelector("#top-settings").addEventListener("click", openSettings);
settingsDialog.addEventListener("click", (event) => {
  if (event.target === settingsDialog) settingsDialog.close();
});

function setMobileMenuOpen(isOpen, restoreFocus = false) {
  sidebar.classList.toggle("open", isOpen);
  mobileScrim.classList.toggle("visible", isOpen);
  mobileMenuButton.setAttribute("aria-expanded", String(isOpen));
  mobileMenuButton.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
  sidebar.inert = mobileLayout.matches && !isOpen;
  if (restoreFocus) mobileMenuButton.focus();
}
function closeMobileMenu() { setMobileMenuOpen(false, true); }
setMobileMenuOpen(false);
mobileMenuButton.addEventListener("click", () => {
  setMobileMenuOpen(!sidebar.classList.contains("open"));
});
mobileScrim.addEventListener("click", closeMobileMenu);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && sidebar.classList.contains("open")) closeMobileMenu();
});
function syncMobileMenu() {
  if (!mobileLayout.matches) setMobileMenuOpen(false);
  else sidebar.inert = !sidebar.classList.contains("open");
}
mobileLayout.addEventListener("change", syncMobileMenu);
window.addEventListener("resize", syncMobileMenu);
document.querySelectorAll(".nav-link").forEach((link) => link.addEventListener("click", closeMobileMenu));

document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach((item) => item.classList.remove("active"));
    link.classList.add("active");
  });
});

/* ---------- Animações e detalhes ---------- */
const calmMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const revealObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
  if (entry.isIntersecting) { entry.target.classList.add("in"); revealObserver.unobserve(entry.target); }
}), { threshold: 0.12 });
document.querySelectorAll(".welcome-section, .generator-card, .section-heading, .brief-box, .nursing-templates, .result-toolbar, .sources-card, .image-search-card, .page-footer")
  .forEach((el) => { el.classList.add("reveal"); revealObserver.observe(el); });

briefInput.addEventListener("input", () => {
  document.querySelector("#brief-count").textContent = `${briefInput.value.length}/600`;
});

const briefExamples = [
  "Ex.: preciso de slides sobre semiologia respiratória para segunda, com imagens e referências",
  "Ex.: um resumo de sinais vitais para a prova de Fundamentos",
  "Ex.: trabalho escrito sobre prevenção de lesão por pressão",
  "Ex.: estudo de caso fictício aplicando a SAE"
];
if (!calmMotion) {
  let exampleIndex = 0;
  window.setInterval(() => {
    if (document.activeElement === briefInput || briefInput.value) return;
    exampleIndex = (exampleIndex + 1) % briefExamples.length;
    briefInput.placeholder = briefExamples[exampleIndex];
  }, 4200);
}

const progressMessages = [
  ["Entendendo o que você pediu...", "Lendo com atenção, meu bem."],
  ["Pesquisando fontes reais...", "BVS, SciELO, PubMed e a web."],
  ["Organizando as ideias...", "Cada parte no seu lugar."],
  ["Deixando tudo bonito...", "Só mais um instante, meu amor."]
];
let progressTimer;
function startProgressMessages() {
  let step = 0;
  const title = progressState.querySelector("strong");
  const hint = progressState.querySelector("div span");
  const apply = () => { [title.textContent, hint.textContent] = progressMessages[step % progressMessages.length]; step += 1; };
  apply();
  progressTimer = window.setInterval(apply, 2600);
}
function stopProgressMessages() { window.clearInterval(progressTimer); }

function celebrate() {
  if (calmMotion) return;
  const symbols = ["♥", "✦", "♡", "✧"];
  for (let i = 0; i < 22; i += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti";
    piece.textContent = symbols[i % symbols.length];
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.animationDelay = `${Math.random() * 0.6}s`;
    piece.style.fontSize = `${14 + Math.random() * 16}px`;
    document.body.append(piece);
    window.setTimeout(() => piece.remove(), 3400);
  }
}

new MutationObserver(() => {
  materialList.querySelectorAll(".material-card").forEach((card, index) => card.style.setProperty("--i", index));
}).observe(materialList, { childList: true });


fetch("/api/generate").then((r) => (r.ok ? r.json() : null)).then((data) => {
  (data?.providers || []).forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.label;
    providerSelect.append(option);
  });
}).catch(() => {});

/* ---------- Modo Estudar: resumo, artigos, vídeo-aulas e sites ---------- */
const studyForm = document.querySelector("#study-form");
const studyTopic = document.querySelector("#study-topic");
const studyResult = document.querySelector("#study-result");
const studyProgress = document.querySelector("#study-progress");
let studyData = null;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function resourceLink(item) {
  const link = el("a", "res-link");
  link.href = item.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  const copy = el("span", "res-copy");
  copy.append(el("strong", "", item.title), el("small", "", item.detail));
  link.append(el("span", "res-icon", item.icon || "↗"), copy, el("span", "res-go", "↗"));
  return link;
}

function studySearches(topic) {
  const plain = encodeURIComponent(topic);
  const nursing = encodeURIComponent(`${topic} enfermagem`);
  const site = (domain) => `https://www.google.com/search?q=${nursing}+site:${domain}`;
  return {
    artigos: [
      { icon: "▤", title: "SciELO", detail: "Artigos científicos em português", url: `https://search.scielo.org/?q=${nursing}` },
      { icon: "▤", title: "BVS — Biblioteca Virtual em Saúde", detail: "Literatura em saúde", url: `https://pesquisa.bvsalud.org/portal/?q=${nursing}` },
      { icon: "▤", title: "PubMed", detail: "Artigos biomédicos e de enfermagem", url: `https://pubmed.ncbi.nlm.nih.gov/?term=${nursing}` },
      { icon: "▤", title: "Google Acadêmico", detail: "Artigos, teses e dissertações", url: `https://scholar.google.com/scholar?q=${nursing}` }
    ],
    videos: [
      { icon: "▶", title: "YouTube: aulas de enfermagem", detail: "Vídeo-aulas sobre o tema", url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${topic} enfermagem aula`)}` },
      { icon: "▶", title: "YouTube: resumo e revisão", detail: "Revisões rápidas para a prova", url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${topic} enfermagem resumo revisão`)}` },
      { icon: "▶", title: "Google Vídeos", detail: "Vídeos de várias plataformas", url: `https://www.google.com/search?q=${nursing}+aula&tbm=vid` }
    ],
    sites: [
      { icon: "◎", title: "Manuais MSD (versão profissional)", detail: "Referência clínica em português", url: site("msdmanuals.com/pt") },
      { icon: "◎", title: "Ministério da Saúde", detail: "Protocolos e cadernos oficiais", url: site("gov.br/saude") },
      { icon: "◎", title: "COFEN", detail: "Normas e resoluções da profissão", url: site("cofen.gov.br") },
      { icon: "◎", title: "Wikipédia", detail: "Visão geral para começar", url: `https://pt.wikipedia.org/w/index.php?search=${plain}` }
    ]
  };
}

function classifySource(source) {
  const text = `${source.title || ""} ${source.url}`.toLowerCase();
  if (/youtube|youtu\.be|vimeo/.test(text)) return "videos";
  if (/scielo|pubmed|ncbi|bvs|scholar|doi\.org|revista|periodic|journal|lilacs|researchgate|\.edu/.test(text)) return "artigos";
  return "sites";
}

function fillPanel(id, found, searches, note) {
  const panel = document.querySelector(`#panel-${id}`);
  panel.replaceChildren();
  if (found.length) {
    panel.append(el("h4", "res-title", "✦ Encontrados pela IA para o seu tema"));
    const grid = el("div", "res-grid");
    grid.append(...found.map((s) => resourceLink({ icon: "✦", title: s.title || new URL(s.url).hostname, detail: new URL(s.url).hostname, url: s.url })));
    panel.append(grid);
  }
  panel.append(el("h4", "res-title", "⌕ Buscas prontas (confira o que aparecer)"));
  const grid = el("div", "res-grid");
  grid.append(...searches.map(resourceLink));
  panel.append(grid, el("p", "res-note", note));
}

function renderStudy(topic, data, providerName) {
  studyData = { topic, data };
  document.querySelector("#study-title").textContent = data?.title || topic;
  document.querySelector("#study-status").textContent = data
    ? `Resumo feito com ${providerName || "IA"}. Estude, confira nas fontes e compare com o material da sua docente. ♥`
    : "A IA não respondeu agora, mas as buscas abaixo já levam você aos melhores lugares para estudar. Tente o resumo de novo em instantes.";
  const summary = document.querySelector("#panel-resumo");
  summary.replaceChildren();
  if (data) {
    data.summary.forEach((block, index) => {
      const card = el("article", "study-block");
      card.style.setProperty("--i", index);
      card.append(el("span", "material-number", String(index + 1).padStart(2, "0")), el("h4", "", block.title), el("p", "", block.content));
      summary.append(card);
    });
    if (data.keypoints?.length) {
      const box = el("div", "study-keys");
      box.append(el("h4", "", "♥ Para memorizar"));
      const list = el("ul");
      list.append(...data.keypoints.map((text) => el("li", "", text)));
      box.append(list);
      summary.append(box);
    }
    if (data.questions?.length) {
      const box = el("div", "study-keys study-quiz");
      box.append(el("h4", "", "✦ Teste-se"));
      const list = el("ol");
      list.append(...data.questions.map((text) => el("li", "", text)));
      box.append(list);
      summary.append(box);
    }
  } else {
    summary.append(el("p", "res-note", "Sem resumo por enquanto. Use as abas Artigos, Vídeo-aulas e Sites."));
  }
  const searches = studySearches(topic);
  const found = { artigos: [], videos: [], sites: [] };
  (data?.sources || []).forEach((source) => { try { new URL(source.url); found[classifySource(source)].push(source); } catch { /* ignora */ } });
  fillPanel("artigos", found.artigos, searches.artigos, "Prefira artigos recentes e cite sempre a fonte original.");
  fillPanel("videos", found.videos, searches.videos, "Vídeos ajudam a entender; para trabalhos, confirme o conteúdo em artigos e nos materiais da disciplina.");
  fillPanel("sites", found.sites, searches.sites, "Protocolos mudam: confira a versão atual da sua instituição.");
  selectStudyTab("resumo");
  studyResult.hidden = false;
}

const studyTabs = [...document.querySelectorAll(".study-tab")];
function selectStudyTab(name, moveFocus = false) {
  studyTabs.forEach((tab) => {
    const active = tab.dataset.tab === name;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
  });
  document.querySelectorAll(".study-panel").forEach((panel) => { panel.hidden = panel.id !== `panel-${name}`; });
  if (moveFocus) studyTabs.find((tab) => tab.dataset.tab === name)?.focus();
}
studyTabs.forEach((tab) => {
  tab.addEventListener("click", () => selectStudyTab(tab.dataset.tab));
  tab.addEventListener("keydown", (event) => {
    const index = studyTabs.indexOf(tab);
    let nextIndex;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % studyTabs.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + studyTabs.length) % studyTabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = studyTabs.length - 1;
    else return;
    event.preventDefault();
    selectStudyTab(studyTabs[nextIndex].dataset.tab, true);
  });
});

document.querySelectorAll(".study-chip").forEach((chip) => chip.addEventListener("click", () => {
  studyTopic.value = chip.dataset.study;
  studyForm.requestSubmit();
}));

studyForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const topic = normalizeText(studyTopic.value);
  if (!topic) return;
  studyResult.hidden = true;
  studyProgress.hidden = false;
  const button = document.querySelector("#study-button");
  button.disabled = true;
  try {
    const response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "study", brief: topic, topic, provider: providerSelect.value }) });
    const data = await response.json().catch(() => null);
    const hasSummary = response.ok && data?.summary?.length;
    renderStudy(topic, hasSummary ? data : null, data?.provider);
    if (hasSummary) celebrate();
    else showToast(data?.error || "A IA não retornou um resumo. As buscas sugeridas continuam disponíveis.", true);
  } catch {
    renderStudy(topic, null);
    showToast("O servidor de IA não está disponível. Você ainda pode consultar as buscas sugeridas.", true);
  } finally {
    studyProgress.hidden = true;
    button.disabled = false;
    studyResult.scrollIntoView({ behavior: calmMotion ? "auto" : "smooth", block: "start" });
  }
});

document.querySelector("#copy-study").addEventListener("click", async () => {
  if (!studyData?.data) { showToast("Ainda não há resumo para copiar.", true); return; }
  const { data, topic } = studyData;
  const text = [data.title || topic, "", ...data.summary.map((b) => `${b.title}\n${b.content}`), "", "Para memorizar:", ...(data.keypoints || []).map((k) => `- ${k}`)].join("\n");
  try { await navigator.clipboard.writeText(text); showToast("Resumo copiado! ♥"); } catch { showToast("Não consegui copiar. Selecione o texto manualmente.", true); }
});
document.querySelectorAll(".feature-strip, .study-section").forEach((node) => { node.classList.add("reveal"); revealObserver.observe(node); });


/* ---------- Plantão de estudos, dicas, menu inferior e teste da IA ---------- */
(() => {
  const time = document.querySelector("#focus-time"), fill = document.querySelector("#focus-fill");
  const toggle = document.querySelector("#focus-toggle"), reset = document.querySelector("#focus-reset");
  let total = 25 * 60, left = total, timer = null;
  const paint = () => {
    time.textContent = `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;
    fill.style.width = `${((total - left) / total) * 100}%`;
  };
  const stop = () => { window.clearInterval(timer); timer = null; toggle.textContent = left === total ? "Iniciar" : "Continuar"; };
  toggle.addEventListener("click", () => {
    if (timer) { stop(); return; }
    toggle.textContent = "Pausar";
    timer = window.setInterval(() => {
      left -= 1; paint();
      if (left <= 0) { stop(); left = total; paint(); celebrate(); showToast("Tempo concluído! Respire e tome uma água. ♥"); }
    }, 1000);
  });
  reset.addEventListener("click", () => { stop(); left = total; paint(); toggle.textContent = "Iniciar"; });
  document.querySelectorAll(".focus-modes .mode").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll(".focus-modes .mode").forEach((item) => item.classList.toggle("active", item === button));
    total = Number(button.dataset.min) * 60; left = total; stop(); paint(); toggle.textContent = "Iniciar";
  }));
  paint();

  const tips = [
    "Estude por casos: pense no paciente, na queixa, nos sinais e no cuidado.",
    "Explique em voz alta: se você consegue ensinar, você aprendeu.",
    "Use a SAE como roteiro: histórico, diagnóstico, planejamento, implementação e avaliação.",
    "Treine cálculo de medicação todo dia. Cinco minutos já fazem diferença.",
    "Anote as dúvidas enquanto estuda e leve para a sua docente.",
    "Revise o conteúdo no dia seguinte: a memória agradece."
  ];
  let tipIndex = 0;
  const tipText = document.querySelector("#tip-text");
  document.querySelector("#tip-next").addEventListener("click", () => {
    tipIndex = (tipIndex + 1) % tips.length;
    tipText.style.opacity = 0;
    window.setTimeout(() => { tipText.textContent = tips[tipIndex]; tipText.style.opacity = 1; }, 180);
  });

  const links = [...document.querySelectorAll(".bottom-nav a")];
  const sectionObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) links.forEach((link) => link.classList.toggle("active", link.dataset.sec === entry.target.id));
  }), { rootMargin: "-40% 0px -50% 0px" });
  ["inicio", "estudar", "criar", "resultado"].forEach((id) => { const node = document.getElementById(id); if (node) sectionObserver.observe(node); });

  document.querySelector("#test-ai").addEventListener("click", async (event) => {
    const button = event.currentTarget, list = document.querySelector("#ai-test-result");
    button.disabled = true; button.textContent = "Testando...";
    list.replaceChildren();
    try {
      const response = await fetch("/api/generate?test=1");
      const data = await response.json();
      if (!data.tests?.length) list.append(el("li", "bad", "Nenhuma IA configurada no servidor."));
      (data.tests || []).forEach((item) => list.append(el("li", item.ok ? "good" : "bad", `${item.ok ? "✓" : "✗"} ${item.label} (${item.model}): ${item.message}`)));
    } catch {
      list.append(el("li", "bad", "Não consegui falar com o servidor. Abra o site pela Vercel ou por npm start."));
    }
    button.disabled = false; button.textContent = "Testar as IAs ✦";
  });
})();

/* ---------- Toque na foto: elogios e corações ---------- */
(() => {
  const frames = document.querySelectorAll(".hero-art .photo-frame");
  const art = document.querySelector(".hero-art");
  if (!frames.length || !art) return;
  const phrases = [
    "Você é perfeita do seu jeitinho. ♥",
    "Você é maravilhosa, e a Enfermagem tem sorte de ter você.",
    "Seu cuidado com as pessoas já faz de você uma enfermeira incrível.",
    "Você é linda por dentro e por fora.",
    "Tudo o que você toca fica mais bonito.",
    "Que orgulho de você, minha princesa!",
    "Você é inteligente, dedicada e incrível.",
    "Seu sorriso ilumina qualquer plantão.",
    "Você vai ser uma enfermeira maravilhosa.",
    "Respira fundo: você é capaz de tudo isso. ♥",
    "O mundo é melhor porque você existe.",
    "Você é a razão do meu sorriso.",
    "Você é doce, forte e brilhante.",
    "Cada dia ao seu lado é um presente."
  ];
  let order = [], timer = null;
  const nextPhrase = () => {
    if (!order.length) order = phrases.map((_, i) => i).sort(() => Math.random() - 0.5);
    return phrases[order.pop()];
  };

  const bubble = document.createElement("div");
  bubble.className = "compliment";
  bubble.setAttribute("role", "status");
  bubble.setAttribute("aria-live", "polite");
  const backdrop = document.createElement("div");
  backdrop.className = "compliment-backdrop";
  backdrop.setAttribute("aria-hidden", "true");
  document.body.append(backdrop, bubble);

  const hint = el("span", "photo-hint", "toque na foto ♥");
  art.append(hint);

  const burst = (x, y) => {
    if (calmMotion) return;
    const symbols = ["♥", "✦", "♡", "✧"];
    for (let i = 0; i < 14; i += 1) {
      const piece = el("span", "burst", symbols[i % symbols.length]);
      const angle = (Math.PI * 2 * i) / 14 + Math.random() * 0.4;
      const distance = 60 + Math.random() * 70;
      piece.style.left = `${x}px`;
      piece.style.top = `${y}px`;
      piece.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
      piece.style.setProperty("--dy", `${Math.sin(angle) * distance - 30}px`);
      piece.style.fontSize = `${14 + Math.random() * 14}px`;
      document.body.append(piece);
      window.setTimeout(() => piece.remove(), 1100);
    }
  };

  const celebratePhoto = (frame, x, y) => {
    hint.remove();
    backdrop.classList.remove("show");
    bubble.classList.remove("show");
    void bubble.offsetWidth;
    bubble.textContent = nextPhrase();
    backdrop.classList.add("show");
    bubble.classList.add("show");
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      bubble.classList.remove("show");
      backdrop.classList.remove("show");
    }, 4400);
    burst(x, y);
    if (!calmMotion && frame.animate) frame.animate([{ scale: 1 }, { scale: 1.1 }, { scale: 0.97 }, { scale: 1 }], { duration: 480, easing: "ease-out" });
  };

  frames.forEach((frame) => {
    frame.setAttribute("role", "button");
    frame.setAttribute("tabindex", "0");
    frame.setAttribute("aria-label", "Toque para receber um elogio");
    frame.addEventListener("click", (event) => celebratePhoto(frame, event.clientX, event.clientY));
    frame.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      const box = frame.getBoundingClientRect();
      celebratePhoto(frame, box.left + box.width / 2, box.top + box.height / 2);
    });
  });
})();
