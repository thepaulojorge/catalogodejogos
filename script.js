// ============================================================
//  ESTADO
// ============================================================
let jogos = JSON.parse(localStorage.getItem("jogos")) || [];
let filtroTexto = "";
let filtroStatus = "";
let filtroPlatina = "";
let filtroPlatforma = "";
let sortCol = "";
let sortDir = "asc";
let modoGrid = false;
let indexParaExcluir = null;
let avaliacaoAtual = 0;

// ============================================================
//  REFERÊNCIAS DOM
// ============================================================
const form          = document.getElementById("gameForm");
const tabela        = document.getElementById("listaJogos").querySelector("tbody");
const viewTabela    = document.getElementById("viewTabela");
const viewGrid      = document.getElementById("viewGrid");
const campoBusca    = document.getElementById("campoBusca");
const modalOverlay  = document.getElementById("modalOverlay");
const confirmOverlay= document.getElementById("confirmOverlay");
const modalTitulo   = document.getElementById("modalTitulo");
const btnSubmit     = document.getElementById("btnSubmit");
const starInput     = document.getElementById("starInput");
const stars         = starInput.querySelectorAll(".star");
const statusPlatinaSelect = document.getElementById("statusPlatina");
const grupoMotivo   = document.getElementById("grupoMotivo");

// ============================================================
//  PERSISTÊNCIA
// ============================================================
function salvar() {
  localStorage.setItem("jogos", JSON.stringify(jogos));
}

// ============================================================
//  TEMA
// ============================================================
function aplicarTema(tema) {
  document.body.classList.toggle("light", tema === "light");
  document.getElementById("toggleTheme").textContent = tema === "light" ? "🌙" : "☀️";
}

document.getElementById("toggleTheme").addEventListener("click", () => {
  const novoTema = document.body.classList.contains("light") ? "dark" : "light";
  localStorage.setItem("tema", novoTema);
  aplicarTema(novoTema);
});

// Inicializar tema salvo (padrão = dark)
aplicarTema(localStorage.getItem("tema") || "dark");

// ============================================================
//  MODAL DO FORMULÁRIO
// ============================================================
function abrirModal(modo = "add", index = null) {
  modalTitulo.textContent = modo === "add" ? "Adicionar Jogo" : "Editar Jogo";
  btnSubmit.textContent   = modo === "add" ? "Adicionar" : "Salvar";
  document.getElementById("editIndex").value = index !== null ? index : "";

  if (modo === "edit" && index !== null) {
    const j = jogos[index];
    document.getElementById("plataforma").value        = j.plataforma;
    document.getElementById("jogo").value              = j.nome;
    document.getElementById("statusJogo").value        = j.statusJogo;
    document.getElementById("platinavelSimbolo").value = j.platinavelSimbolo;
    document.getElementById("statusPlatina").value     = j.statusPlatina;
    document.getElementById("motivoImplatinavel").value= j.motivoImplatinavel || "";
    document.getElementById("progressoPlatina").value  = j.progressoPlatina || "";
    document.getElementById("possuiDLC").value         = j.possuiDLC;
    document.getElementById("possuiManual").value      = j.possuiManual;
    document.getElementById("capaURL").value           = j.capaURL || "";
    setAvaliacao(parseFloat(j.avaliacao) || 0);
    atualizarPreviewCapa(j.capaURL || "");
  } else {
    form.reset();
    setAvaliacao(0);
  }

  toggleMotivo();
  modalOverlay.classList.remove("hidden");
}

function fecharModal() {
  modalOverlay.classList.add("hidden");
  form.reset();
  setAvaliacao(0);
  atualizarPreviewCapa("");
}

// ============================================================
//  PREVIEW DE CAPA NO FORMULÁRIO
// ============================================================
function atualizarPreviewCapa(url) {
  const container = document.getElementById("capaPreview");
  if (url) {
    container.innerHTML = `<img src="${url}" alt="Capa" onerror="this.parentElement.innerHTML='<span class=\\'capa-placeholder\\'>⚠️</span>'">`;
  } else {
    container.innerHTML = `<span class="capa-placeholder">🖼️</span>`;
  }
}

document.getElementById("capaURL").addEventListener("input", function () {
  atualizarPreviewCapa(this.value.trim());
});

document.getElementById("btnAbrirForm").addEventListener("click",    () => abrirModal("add"));
document.getElementById("btnFecharModal").addEventListener("click",  fecharModal);
document.getElementById("btnCancelarForm").addEventListener("click", fecharModal);
modalOverlay.addEventListener("click", e => { if (e.target === modalOverlay) fecharModal(); });

// ============================================================
//  CAMPO MOTIVO (mostrar só quando implatinável)
// ============================================================
function toggleMotivo() {
  grupoMotivo.classList.toggle("visible", statusPlatinaSelect.value === "implatinavel");
}
statusPlatinaSelect.addEventListener("change", toggleMotivo);

// ============================================================
//  STAR RATING
// ============================================================
function setAvaliacao(val) {
  avaliacaoAtual = val;
  document.getElementById("avaliacao").value = val;
  stars.forEach(s => s.classList.toggle("active", parseFloat(s.dataset.val) <= val));
}

stars.forEach(s => {
  s.addEventListener("click",       () => setAvaliacao(parseFloat(s.dataset.val)));
  s.addEventListener("mouseenter",  () => stars.forEach(x => x.classList.toggle("active", parseFloat(x.dataset.val) <= parseFloat(s.dataset.val))));
  s.addEventListener("mouseleave",  () => setAvaliacao(avaliacaoAtual));
});

// ============================================================
//  SUBMIT DO FORMULÁRIO
// ============================================================
form.addEventListener("submit", function(e) {
  e.preventDefault();

  const plataforma         = document.getElementById("plataforma").value.trim();
  const nome               = document.getElementById("jogo").value.trim();
  const avaliacao          = parseFloat(document.getElementById("avaliacao").value) || 0;
  const statusJogo         = document.getElementById("statusJogo").value;
  const platinavelSimbolo  = document.getElementById("platinavelSimbolo").value;
  const statusPlatina      = document.getElementById("statusPlatina").value;
  const motivoImplatinavel = document.getElementById("motivoImplatinavel").value.trim();
  const progressoPlatina   = parseInt(document.getElementById("progressoPlatina").value) || 0;
  const possuiDLC          = document.getElementById("possuiDLC").value;
  const possuiManual       = document.getElementById("possuiManual").value;
  const capaURL            = document.getElementById("capaURL").value.trim();

  if (!plataforma || !nome) return;

  const registro = {
    plataforma, nome, avaliacao,
    statusJogo, platinavelSimbolo, statusPlatina,
    motivoImplatinavel, progressoPlatina, possuiDLC, possuiManual, capaURL
  };

  const editIndex = document.getElementById("editIndex").value;
  if (editIndex !== "") {
    jogos[parseInt(editIndex)] = registro;
  } else {
    jogos.push(registro);
  }

  salvar();
  fecharModal();
  renderizar();
  atualizarFiltroPlatforma();
});

// ============================================================
//  EXCLUSÃO COM CONFIRMAÇÃO
// ============================================================
function pedirExclusao(realIndex) {
  indexParaExcluir = realIndex;
  document.getElementById("confirmMsg").textContent =
    `Excluir "${jogos[realIndex].nome}"? Esta ação não pode ser desfeita.`;
  confirmOverlay.classList.remove("hidden");
}

document.getElementById("btnCancelarExclusao").addEventListener("click", () => {
  confirmOverlay.classList.add("hidden");
  indexParaExcluir = null;
});

document.getElementById("btnConfirmarExclusao").addEventListener("click", () => {
  if (indexParaExcluir !== null) {
    jogos.splice(indexParaExcluir, 1);
    salvar();
    renderizar();
    atualizarFiltroPlatforma();
  }
  confirmOverlay.classList.add("hidden");
  indexParaExcluir = null;
});

confirmOverlay.addEventListener("click", e => {
  if (e.target === confirmOverlay) {
    confirmOverlay.classList.add("hidden");
    indexParaExcluir = null;
  }
});

// ============================================================
//  HELPERS DE RENDERIZAÇÃO
// ============================================================
function renderStars(val) {
  const v = parseFloat(val) || 0;
  const full = Math.floor(v);
  let html = '<span class="stars">';
  for (let i = 1; i <= 5; i++) {
    html += i <= full ? "★" : '<span class="stars-empty">★</span>';
  }
  return html + '</span>';
}

function renderBadge(tipo, texto) {
  return `<span class="badge badge-${tipo}">${texto}</span>`;
}

const LABELS_STATUS = {
  jogando: "🎮 Jogando",
  finalizado: "✅ Finalizado",
  jogado: "🕹️ Jogado",
  nao_comecado: "⏳ Não comecei"
};

const LABELS_PLATINA = {
  platinado: "🏆 Platinado",
  andamento: "⚙️ Em andamento",
  implatinavel: "❌ Implatinável",
  nao_comecado: "⏳ Não comecei"
};

function renderProgresso(j) {
  if (!j.progressoPlatina && j.progressoPlatina !== 0) return "-";
  const p = Math.min(100, Math.max(0, parseInt(j.progressoPlatina) || 0));
  const full = p === 100;
  return `
    <div class="progress-wrap">
      <div class="progress-bar">
        <div class="progress-fill${full ? " full" : ""}" style="width:${p}%"></div>
      </div>
      <span class="progress-label">${p}%${full ? " 🏆" : ""}</span>
    </div>`;
}

// ============================================================
//  FILTRAR E ORDENAR
// ============================================================
function jogosVisiveis() {
  let lista = jogos
    .map((j, i) => ({ ...j, _realIndex: i }))
    .filter(j => {
      const txt = filtroTexto.toLowerCase();
      if (txt && !j.nome.toLowerCase().includes(txt) && !j.plataforma.toLowerCase().includes(txt)) return false;
      if (filtroStatus   && j.statusJogo    !== filtroStatus)   return false;
      if (filtroPlatina  && j.statusPlatina !== filtroPlatina)  return false;
      if (filtroPlatforma && j.plataforma.toLowerCase() !== filtroPlatforma.toLowerCase()) return false;
      return true;
    });

  if (sortCol) {
    lista.sort((a, b) => {
      let va = a[sortCol], vb = b[sortCol];
      if (sortCol === "avaliacao" || sortCol === "progressoPlatina") {
        va = parseFloat(va) || 0;
        vb = parseFloat(vb) || 0;
      } else {
        va = String(va || "").toLowerCase();
        vb = String(vb || "").toLowerCase();
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ?  1 : -1;
      return 0;
    });
  }

  return lista;
}

// ============================================================
//  RENDERIZAR TABELA
// ============================================================
function renderizarTabela(lista) {
  tabela.innerHTML = "";
  lista.forEach((j, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${j.plataforma}</td>
      <td style="font-weight:500">${j.nome}</td>
      <td>${renderStars(j.avaliacao)}</td>
      <td>${renderBadge(j.statusJogo, LABELS_STATUS[j.statusJogo] || j.statusJogo)}</td>
      <td>${j.platinavelSimbolo === "sim" ? '<span class="tag-sim">✅ Sim</span>' : '<span class="tag-nao">❌ Não</span>'}</td>
      <td>${renderBadge(j.statusPlatina, LABELS_PLATINA[j.statusPlatina] || j.statusPlatina)}</td>
      <td style="font-size:12px;color:var(--text-muted)">${j.motivoImplatinavel || "-"}</td>
      <td>${renderProgresso(j)}</td>
      <td>${j.possuiDLC    === "sim" ? '<span class="tag-sim">📦 Sim</span>' : '<span class="tag-nao">Não</span>'}</td>
      <td>${j.possuiManual === "sim" ? '<span class="tag-sim">📖 Sim</span>' : '<span class="tag-nao">Não</span>'}</td>
      <td>
        <button class="btn-icon" onclick="abrirModal('edit', ${j._realIndex})" title="Editar" style="margin-right:4px">✏️</button>
        <button class="btn-icon" onclick="pedirExclusao(${j._realIndex})" title="Excluir" style="color:var(--red)">🗑️</button>
      </td>
    `;
    tabela.appendChild(tr);
  });

  document.getElementById("contadorRodape").textContent =
    `${lista.length} de ${jogos.length} jogo${jogos.length !== 1 ? "s" : ""}`;
  document.getElementById("contadorPlataformasRodape").textContent =
    `Plataformas únicas: ${[...new Set(jogos.map(j => j.plataforma))].length}`;
}

// ============================================================
//  RENDERIZAR GRID
// ============================================================
function renderizarGrid(lista) {
  viewGrid.innerHTML = "";
  lista.forEach(j => {
    const card = document.createElement("div");
    const temCapa = !!j.capaURL;
    card.className = "game-card" + (temCapa ? " tem-capa" : "");

    const avaliacaoHTML = parseFloat(j.avaliacao) > 0
      ? "★".repeat(Math.floor(parseFloat(j.avaliacao)))
      : "";

    const capaHTML = temCapa
      ? `<div class="game-card-cover">
           <img src="${j.capaURL}" alt="Capa de ${j.nome}"
             onerror="this.parentElement.classList.add('erro'); this.parentElement.innerHTML='<div class=\\'game-card-cover-placeholder\\'><span>🖼️</span><p>${j.nome}</p></div>'">
           <span class="game-card-cover-badge">${j.plataforma}</span>
           ${avaliacaoHTML ? `<span class="game-card-cover-rating">${avaliacaoHTML}</span>` : ""}
         </div>`
      : "";

    const bodyAbrir  = temCapa ? `<div class="game-card-body">` : ``;
    const bodyFechar = temCapa ? `</div>` : ``;

    card.innerHTML = `
      ${capaHTML}
      ${bodyAbrir}
        ${!temCapa ? `<div>
          <div class="game-card-platform">${j.plataforma}</div>
          <div class="game-card-title">${j.nome}</div>
        </div>` : `<div class="game-card-title">${j.nome}</div>`}
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${renderBadge(j.statusJogo, LABELS_STATUS[j.statusJogo] || j.statusJogo)}
          ${renderBadge(j.statusPlatina, LABELS_PLATINA[j.statusPlatina] || j.statusPlatina)}
        </div>
        ${j.progressoPlatina ? renderProgresso(j) : ""}
        <div class="game-card-footer">
          <div>${!temCapa ? renderStars(j.avaliacao) : ""}</div>
          <div class="game-card-actions">
            <button class="btn-icon" onclick="abrirModal('edit', ${j._realIndex})" title="Editar">✏️</button>
            <button class="btn-icon" onclick="pedirExclusao(${j._realIndex})" title="Excluir" style="color:var(--red)">🗑️</button>
          </div>
        </div>
      ${bodyFechar}
    `;
    viewGrid.appendChild(card);
  });
}

// ============================================================
//  RENDERIZAR (tudo)
// ============================================================
function renderizar() {
  const lista = jogosVisiveis();
  if (modoGrid) {
    renderizarGrid(lista);
  } else {
    renderizarTabela(lista);
  }
  atualizarContadores();
  atualizarStatsBar();
  atualizarMediaAvaliacoes();
}

// ============================================================
//  CONTADORES
// ============================================================
function atualizarContadores() {
  const set = (id, fn) => document.getElementById(id).textContent = jogos.filter(fn).length;
  set("cardJogando",          j => j.statusJogo    === "jogando");
  set("cardFinalizados",      j => j.statusJogo    === "finalizado");
  set("cardJogados",          j => j.statusJogo    === "jogado");
  set("cardNaoComecados",     j => j.statusJogo    === "nao_comecado");
  set("cardPlatinados",       j => j.statusPlatina === "platinado");
  set("cardAndamento",        j => j.statusPlatina === "andamento");
  set("cardImplatinaveis",    j => j.statusPlatina === "implatinavel");
  set("cardPlatinaNaoComecada",j=> j.statusPlatina === "nao_comecado");
  set("cardPlatinavel",       j => j.platinavelSimbolo === "sim");
  set("cardNaoPlatinavel",    j => j.platinavelSimbolo === "nao");
  set("cardComDLC",           j => j.possuiDLC    === "sim");
  set("cardComManual",        j => j.possuiManual === "sim");
}

function atualizarStatsBar() {
  document.getElementById("contadorTopo").textContent =
    `${jogos.length} jogo${jogos.length !== 1 ? "s" : ""}`;
  const plats = [...new Set(jogos.map(j => j.plataforma))].filter(Boolean);
  document.getElementById("contadorPlataformasTopo").textContent =
    plats.length ? `Plataformas: ${plats.join(", ")}` : "";
}

// ============================================================
//  CARD DE AVALIAÇÃO MÉDIA
// ============================================================
const CORES_PLATAFORMA = [
  "#4488ff","#00d4aa","#a855f7","#f0c040",
  "#ff8844","#ff4466","#22ccee","#84cc16"
];

function starsHTML(media, classVazio = "star-vazio") {
  const cheia  = Math.floor(media);
  const vazia  = 5 - cheia;
  return "★".repeat(cheia) +
    `<span class="${classVazio}">` + "★".repeat(vazia) + "</span>";
}

function mediaDeJogos(lista) {
  const validos = lista.filter(j => parseFloat(j.avaliacao) > 0);
  if (!validos.length) return null;
  return validos.reduce((acc, j) => acc + parseFloat(j.avaliacao), 0) / validos.length;
}

function atualizarMediaAvaliacoes() {
  const section = document.getElementById("mediaSection");
  const avaliadosTotal = jogos.filter(j => parseFloat(j.avaliacao) > 0);

  if (avaliadosTotal.length === 0) {
    section.classList.add("hidden");
    return;
  }
  section.classList.remove("hidden");

  // Média geral
  const mediaGeral = mediaDeJogos(jogos);
  document.getElementById("mediaStarsGeral").innerHTML = starsHTML(mediaGeral);
  document.getElementById("mediaNumeroGeral").textContent = mediaGeral.toFixed(1);

  // Por plataforma
  const plataformas = [...new Set(jogos.map(j => j.plataforma).filter(Boolean))].sort();
  const container = document.getElementById("mediaPlataformas");
  container.innerHTML = "";

  plataformas.forEach((plat, i) => {
    const jogosDaPlat  = jogos.filter(j => j.plataforma === plat);
    const mediaPlat    = mediaDeJogos(jogosDaPlat);
    const totalPlat    = jogosDaPlat.length;
    const avaliadosPlat= jogosDaPlat.filter(j => parseFloat(j.avaliacao) > 0).length;
    const cor          = CORES_PLATAFORMA[i % CORES_PLATAFORMA.length];

    const card = document.createElement("div");
    card.className = "media-plat-card";
    card.style.setProperty("--plat-cor", cor);

    if (mediaPlat !== null) {
      card.innerHTML = `
        <span class="media-plat-nome" title="${plat}">${plat}</span>
        <div class="media-plat-stars">${starsHTML(mediaPlat)}</div>
        <div class="media-plat-footer">
          <span class="media-plat-numero">${mediaPlat.toFixed(1)}</span>
          <span class="media-plat-count">${avaliadosPlat}/${totalPlat} avaliado${avaliadosPlat !== 1 ? "s" : ""}</span>
        </div>`;
    } else {
      card.innerHTML = `
        <span class="media-plat-nome" title="${plat}">${plat}</span>
        <div class="media-plat-stars"><span class="star-vazio">★★★★★</span></div>
        <div class="media-plat-footer">
          <span class="media-plat-numero" style="color:var(--text-faint);font-size:12px">sem nota</span>
          <span class="media-plat-count">${totalPlat} jogo${totalPlat !== 1 ? "s" : ""}</span>
        </div>`;
    }
    container.appendChild(card);
  });
}

// ============================================================
//  FILTRO DE PLATAFORMA (select)
// ============================================================
function atualizarFiltroPlatforma() {
  const sel = document.getElementById("filtroPlatforma");
  const atual = sel.value;
  const plats = [...new Set(jogos.map(j => j.plataforma))].filter(Boolean).sort();
  sel.innerHTML = '<option value="">Todas as plataformas</option>';
  plats.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    if (p === atual) opt.selected = true;
    sel.appendChild(opt);
  });
}

// ============================================================
//  EVENTOS DE FILTRO
// ============================================================
campoBusca.addEventListener("input", () => {
  filtroTexto = campoBusca.value;
  renderizar();
});

document.getElementById("filtroStatus").addEventListener("click", e => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  document.querySelectorAll("#filtroStatus .chip").forEach(c => c.classList.remove("active"));
  chip.classList.add("active");
  filtroStatus = chip.dataset.valor;
  renderizar();
});

document.getElementById("filtroPlatina").addEventListener("click", e => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  document.querySelectorAll("#filtroPlatina .chip").forEach(c => c.classList.remove("active"));
  chip.classList.add("active");
  filtroPlatina = chip.dataset.valor;
  renderizar();
});

document.getElementById("filtroPlatforma").addEventListener("change", e => {
  filtroPlatforma = e.target.value;
  renderizar();
});

// ============================================================
//  ORDENAÇÃO POR COLUNA
// ============================================================
document.querySelectorAll("th.sortable").forEach(th => {
  th.addEventListener("click", () => {
    const col = th.dataset.col;
    if (sortCol === col) {
      sortDir = sortDir === "asc" ? "desc" : "asc";
    } else {
      sortCol = col;
      sortDir = "asc";
    }
    document.querySelectorAll("th.sortable").forEach(t => t.classList.remove("asc","desc"));
    th.classList.add(sortDir);
    renderizar();
  });
});

// ============================================================
//  ALTERNÂNCIA TABELA / GRID
// ============================================================
document.getElementById("btnTabela").addEventListener("click", () => {
  modoGrid = false;
  viewTabela.classList.remove("hidden");
  viewGrid.classList.add("hidden");
  document.getElementById("btnTabela").classList.add("active");
  document.getElementById("btnGrid").classList.remove("active");
  renderizar();
});

document.getElementById("btnGrid").addEventListener("click", () => {
  modoGrid = true;
  viewTabela.classList.add("hidden");
  viewGrid.classList.remove("hidden");
  document.getElementById("btnGrid").classList.add("active");
  document.getElementById("btnTabela").classList.remove("active");
  renderizar();
});

// ============================================================
//  EXPORTAR / IMPORTAR JSON
// ============================================================
document.getElementById("btnExportar").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(jogos, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = "catalogo-jogos.json";
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("btnImportar").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!Array.isArray(data)) throw new Error("Formato inválido");
      jogos = data;
      salvar();
      renderizar();
      atualizarFiltroPlatforma();
      alert(`${data.length} jogo(s) importado(s) com sucesso!`);
    } catch {
      alert("Arquivo inválido. Certifique-se que é um JSON exportado por este catálogo.");
    }
    e.target.value = "";
  };
  reader.readAsText(file);
});

// ============================================================
//  ATALHOS DE TECLADO
// ============================================================
document.addEventListener("keydown", (e) => {
  const tag = document.activeElement.tagName.toLowerCase();
  const digitandoEmCampo = ["input", "textarea", "select"].includes(tag);
  const modalAberto = !modalOverlay.classList.contains("hidden");
  const confirmAberto = !confirmOverlay.classList.contains("hidden");

  // Esc — fechar qualquer modal aberto
  if (e.key === "Escape") {
    if (confirmAberto) {
      confirmOverlay.classList.add("hidden");
      indexParaExcluir = null;
    } else if (modalAberto) {
      fecharModal();
    }
    return;
  }

  // Ignorar demais atalhos se o usuário está digitando em algum campo
  if (digitandoEmCampo || modalAberto || confirmAberto) return;

  // N — abrir modal de novo jogo
  if (e.key === "n" || e.key === "N") {
    e.preventDefault();
    abrirModal("add");
    return;
  }

  // F — focar na busca
  if (e.key === "f" || e.key === "F") {
    e.preventDefault();
    const abaCatalogo = document.querySelector(".aba[data-aba='catalogo']");
    if (!abaCatalogo.classList.contains("active")) abaCatalogo.click();
    campoBusca.focus();
    campoBusca.select();
    return;
  }

  // G — alternar grade/tabela
  if (e.key === "g" || e.key === "G") {
    e.preventDefault();
    if (modoGrid) {
      document.getElementById("btnTabela").click();
    } else {
      document.getElementById("btnGrid").click();
    }
    return;
  }

  // E — ir para estatísticas / C — voltar ao catálogo
  if (e.key === "e" || e.key === "E") {
    e.preventDefault();
    document.querySelector(".aba[data-aba='estatisticas']").click();
    return;
  }
  if (e.key === "c" || e.key === "C") {
    e.preventDefault();
    document.querySelector(".aba[data-aba='catalogo']").click();
    return;
  }
  // ? — abrir painel de atalhos
  if (e.key === "?") {
    e.preventDefault();
    togglePainelAtalhos();
    return;
  }
});

// Painel de atalhos
function togglePainelAtalhos() {
  document.getElementById("painelAtalhos").classList.toggle("hidden");
}
document.getElementById("btnAtalhos").addEventListener("click", togglePainelAtalhos);
document.getElementById("btnFecharAtalhos").addEventListener("click", () => {
  document.getElementById("painelAtalhos").classList.add("hidden");
});

// ============================================================
//  INICIALIZAÇÃO
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  atualizarFiltroPlatforma();
  renderizar();
});

// ============================================================
//  NAVEGAÇÃO POR ABAS
// ============================================================
let chartInstances = {};

document.querySelectorAll(".aba").forEach(btn => {
  btn.addEventListener("click", () => {
    const aba = btn.dataset.aba;
    document.querySelectorAll(".aba").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    if (aba === "catalogo") {
      document.getElementById("secaoCatalogo").classList.remove("hidden");
      document.getElementById("secaoEstatisticas").classList.add("hidden");
    } else {
      document.getElementById("secaoCatalogo").classList.add("hidden");
      document.getElementById("secaoEstatisticas").classList.remove("hidden");
      renderizarEstatisticas();
    }
  });
});

// ============================================================
//  CORES DOS GRÁFICOS
// ============================================================
const CORES = {
  jogando:     "#4488ff",
  finalizado:  "#00d4aa",
  jogado:      "#ff8844",
  nao_comecado:"#8888a0",
  platinado:   "#f0c040",
  andamento:   "#a855f7",
  implatinavel:"#ff4466",
  baixo:       "#ff4466",
  medio:       "#f0c040",
  alto:        "#00d4aa",
  completo:    "#7c5cff",
};

const COR_ALPHA = (hex, a) => {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
};

// ============================================================
//  DETECTAR TEMA PARA OS GRÁFICOS
// ============================================================
function corTextoGrafico() {
  return document.body.classList.contains("light") ? "#5a5a78" : "#8888a0";
}
function corGridGrafico() {
  return document.body.classList.contains("light")
    ? "rgba(0,0,0,0.06)"
    : "rgba(255,255,255,0.06)";
}

// ============================================================
//  DESTRUIR GRÁFICO ANTERIOR
// ============================================================
function destruirGrafico(id) {
  if (chartInstances[id]) {
    chartInstances[id].destroy();
    delete chartInstances[id];
  }
}

// ============================================================
//  LEGENDA CUSTOMIZADA
// ============================================================
function renderLegenda(containerId, labels, cores) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = labels.map((l, i) =>
    `<span class="legenda-item">
      <span class="legenda-dot" style="background:${cores[i]}"></span>
      ${l}
    </span>`
  ).join("");
}

// ============================================================
//  OPÇÕES BASE PARA OS GRÁFICOS
// ============================================================
function opcoesDonut(cutout = "68%") {
  return {
    type: "doughnut",
    options: {
      cutout,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.label}: ${ctx.raw} (${Math.round(ctx.parsed / ctx.dataset.data.reduce((a,b)=>a+b,0) * 100)}%)`
          }
        }
      }
    }
  };
}

function opcoesBarra(horizontal = false) {
  const textColor = corTextoGrafico();
  const gridColor = corGridGrafico();
  return {
    type: horizontal ? "bar" : "bar",
    options: {
      indexAxis: horizontal ? "y" : "x",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.raw} jogo${ctx.raw !== 1 ? "s" : ""}` } }
      },
      scales: {
        x: {
          ticks: { color: textColor, font: { family: "Inter", size: 11 } },
          grid: { color: gridColor },
        },
        y: {
          ticks: { color: textColor, font: { family: "Inter", size: 11 }, precision: 0 },
          grid: { color: gridColor },
          beginAtZero: true,
        }
      }
    }
  };
}

// ============================================================
//  RENDERIZAR ESTATÍSTICAS
// ============================================================
function renderizarEstatisticas() {
  const semDados = document.getElementById("statsSemDados");
  const temDados = jogos.length > 0;
  semDados.classList.toggle("hidden", temDados);

  // Métricas rápidas
  const avaliacoesValidas = jogos.filter(j => parseFloat(j.avaliacao) > 0).map(j => parseFloat(j.avaliacao));
  const media = avaliacoesValidas.length
    ? (avaliacoesValidas.reduce((a,b)=>a+b,0) / avaliacoesValidas.length).toFixed(1)
    : "—";
  const platinados = jogos.filter(j => j.statusPlatina === "platinado").length;
  const platinaveis = jogos.filter(j => j.platinavelSimbolo === "sim").length;
  const taxaPlatina = platinaveis > 0 ? Math.round(platinados / platinaveis * 100) + "%" : "—";

  const progressos = jogos.filter(j => j.progressoPlatina > 0).map(j => parseInt(j.progressoPlatina) || 0);
  const progressoMedio = progressos.length
    ? Math.round(progressos.reduce((a,b)=>a+b,0) / progressos.length) + "%"
    : "—";

  const plataformasUnicas = [...new Set(jogos.map(j => j.plataforma).filter(Boolean))];

  document.getElementById("statTotal").textContent        = jogos.length;
  document.getElementById("statMedia").textContent        = media ? `${media}★` : "—";
  document.getElementById("statPlatinados").textContent   = platinados;
  document.getElementById("statTaxaPlatina").textContent  = taxaPlatina;
  document.getElementById("statProgressoMedio").textContent = progressoMedio;
  document.getElementById("statPlataformas").textContent  = plataformasUnicas.length;

  if (!temDados) return;

  // ── Gráfico 1: Status de Jogo (donut) ──
  destruirGrafico("chartStatusJogo");
  const statusJogoLabels = ["Jogando", "Finalizado", "Jogado", "Não comecei"];
  const statusJogoVals   = [
    jogos.filter(j => j.statusJogo === "jogando").length,
    jogos.filter(j => j.statusJogo === "finalizado").length,
    jogos.filter(j => j.statusJogo === "jogado").length,
    jogos.filter(j => j.statusJogo === "nao_comecado").length,
  ];
  const statusJogoCores = [CORES.jogando, CORES.finalizado, CORES.jogado, CORES.nao_comecado];
  const cfg1 = opcoesDonut();
  chartInstances["chartStatusJogo"] = new Chart(
    document.getElementById("chartStatusJogo"),
    {
      ...cfg1,
      data: {
        labels: statusJogoLabels,
        datasets: [{ data: statusJogoVals, backgroundColor: statusJogoCores, borderWidth: 0, hoverOffset: 6 }]
      }
    }
  );
  renderLegenda("legendaStatusJogo", statusJogoLabels, statusJogoCores);

  // ── Gráfico 2: Status de Platina (donut) ──
  destruirGrafico("chartStatusPlatina");
  const statusPlatinaLabels = ["Platinado", "Em andamento", "Implatinável", "Não comecei"];
  const statusPlatinaVals   = [
    jogos.filter(j => j.statusPlatina === "platinado").length,
    jogos.filter(j => j.statusPlatina === "andamento").length,
    jogos.filter(j => j.statusPlatina === "implatinavel").length,
    jogos.filter(j => j.statusPlatina === "nao_comecado").length,
  ];
  const statusPlatinaCores = [CORES.platinado, CORES.andamento, CORES.implatinavel, CORES.nao_comecado];
  const cfg2 = opcoesDonut();
  chartInstances["chartStatusPlatina"] = new Chart(
    document.getElementById("chartStatusPlatina"),
    {
      ...cfg2,
      data: {
        labels: statusPlatinaLabels,
        datasets: [{ data: statusPlatinaVals, backgroundColor: statusPlatinaCores, borderWidth: 0, hoverOffset: 6 }]
      }
    }
  );
  renderLegenda("legendaStatusPlatina", statusPlatinaLabels, statusPlatinaCores);

  // ── Gráfico 3: Progresso de platina por faixa (donut) ──
  destruirGrafico("chartProgressoPlatina");
  const faixas = { "0%": 0, "1–33%": 0, "34–66%": 0, "67–99%": 0, "100%": 0 };
  jogos.forEach(j => {
    const p = parseInt(j.progressoPlatina) || 0;
    if (p === 0)        faixas["0%"]++;
    else if (p <= 33)   faixas["1–33%"]++;
    else if (p <= 66)   faixas["34–66%"]++;
    else if (p < 100)   faixas["67–99%"]++;
    else                faixas["100%"]++;
  });
  const progLabels = Object.keys(faixas);
  const progVals   = Object.values(faixas);
  const progCores  = ["#8888a0", CORES.implatinavel, CORES.jogado, CORES.andamento, CORES.platinado];
  const cfg3 = opcoesDonut();
  chartInstances["chartProgressoPlatina"] = new Chart(
    document.getElementById("chartProgressoPlatina"),
    {
      ...cfg3,
      data: {
        labels: progLabels,
        datasets: [{ data: progVals, backgroundColor: progCores, borderWidth: 0, hoverOffset: 6 }]
      }
    }
  );
  renderLegenda("legendaProgressoPlatina", progLabels, progCores);

  // ── Gráfico 4: Jogos por plataforma (barra horizontal) ──
  destruirGrafico("chartPlataformas");
  const contPlat = {};
  jogos.forEach(j => { if (j.plataforma) contPlat[j.plataforma] = (contPlat[j.plataforma] || 0) + 1; });
  const platSorted = Object.entries(contPlat).sort((a,b) => b[1]-a[1]);
  const platLabels = platSorted.map(([k]) => k);
  const platVals   = platSorted.map(([,v]) => v);
  const platCores  = platLabels.map((_, i) => {
    const palette = [CORES.jogando, CORES.finalizado, CORES.andamento, CORES.platinado, CORES.jogado, CORES.implatinavel];
    return palette[i % palette.length];
  });

  const cfgBarra = opcoesBarra(true);
  cfgBarra.options.indexAxis = "y";
  cfgBarra.options.scales.x.ticks.precision = 0;
  chartInstances["chartPlataformas"] = new Chart(
    document.getElementById("chartPlataformas"),
    {
      type: "bar",
      data: {
        labels: platLabels,
        datasets: [{
          data: platVals,
          backgroundColor: platCores.map(c => COR_ALPHA(c, 0.75)),
          borderColor: platCores,
          borderWidth: 1.5,
          borderRadius: 6,
        }]
      },
      options: cfgBarra.options
    }
  );

  // ── Gráfico 5: Distribuição de avaliações (barra) ──
  destruirGrafico("chartAvaliacoes");
  const distAval = { "★ 1": 0, "★ 2": 0, "★ 3": 0, "★ 4": 0, "★ 5": 0, "Sem nota": 0 };
  jogos.forEach(j => {
    const v = parseFloat(j.avaliacao) || 0;
    if (v === 0)      distAval["Sem nota"]++;
    else if (v <= 1)  distAval["★ 1"]++;
    else if (v <= 2)  distAval["★ 2"]++;
    else if (v <= 3)  distAval["★ 3"]++;
    else if (v <= 4)  distAval["★ 4"]++;
    else              distAval["★ 5"]++;
  });
  const avalLabels = Object.keys(distAval);
  const avalVals   = Object.values(distAval);
  const avalCores  = [
    CORES.implatinavel, CORES.jogado, CORES.nao_comecado,
    CORES.andamento, CORES.finalizado, "#55556a"
  ];
  const cfgAval = opcoesBarra(false);
  chartInstances["chartAvaliacoes"] = new Chart(
    document.getElementById("chartAvaliacoes"),
    {
      type: "bar",
      data: {
        labels: avalLabels,
        datasets: [{
          data: avalVals,
          backgroundColor: avalCores.map(c => COR_ALPHA(c, 0.75)),
          borderColor: avalCores,
          borderWidth: 1.5,
          borderRadius: 6,
        }]
      },
      options: cfgAval.options
    }
  );

  // ── Gráfico 6: DLC e Manuais (donut) ──
  destruirGrafico("chartExtras");
  const comDLC    = jogos.filter(j => j.possuiDLC    === "sim").length;
  const semDLC    = jogos.filter(j => j.possuiDLC    === "nao").length;
  const comManual = jogos.filter(j => j.possuiManual === "sim").length;
  const semManual = jogos.filter(j => j.possuiManual === "nao").length;
  const extrasLabels = ["Com DLC", "Sem DLC", "Com Manual", "Sem Manual"];
  const extrasVals   = [comDLC, semDLC, comManual, semManual];
  const extrasCores  = [CORES.jogando, "#55556a", CORES.finalizado, "#88446a"];
  const cfg6 = opcoesDonut("55%");
  chartInstances["chartExtras"] = new Chart(
    document.getElementById("chartExtras"),
    {
      ...cfg6,
      data: {
        labels: extrasLabels,
        datasets: [{ data: extrasVals, backgroundColor: extrasCores, borderWidth: 0, hoverOffset: 6 }]
      }
    }
  );
  renderLegenda("legendaExtras", extrasLabels, extrasCores);
}