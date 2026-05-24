// ============================================================
//  ESTADO
// ============================================================
let jogos = JSON.parse(localStorage.getItem("jogos")) || [];
let historico = JSON.parse(localStorage.getItem("historico")) || [];
let filtroTexto = "";
let filtroStatus = "";
let filtroPlatina = "";
let filtroPlatforma = "";
let sortCol = "";
let sortDir = "asc";
let ordemAlfabetica = false;
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
const statusPlatinaSelect = document.getElementById("statusPlatina");
const grupoMotivo   = document.getElementById("grupoMotivo");

// ============================================================
//  PERSISTÊNCIA
// ============================================================
function salvar() {
  localStorage.setItem("jogos", JSON.stringify(jogos));
  localStorage.setItem("historico", JSON.stringify(historico));
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
    setAvaliacao(parseInt(j.avaliacao) || 0);
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
//  SLIDER DE NOTA 0–100
// ============================================================
function classeNota(v) {
  if (v === 0)    return "zero";
  if (v < 40)     return "ruim";
  if (v < 60)     return "ok";
  if (v < 80)     return "boa";
  return "otima";
}

function setAvaliacao(val) {
  avaliacaoAtual = parseInt(val) || 0;
  const input = document.getElementById("avaliacao");
  const label = document.getElementById("avaliacaoLabel");
  if (input) input.value = avaliacaoAtual > 0 ? avaliacaoAtual : "";
  if (label) {
    label.textContent = avaliacaoAtual > 0 ? avaliacaoAtual : "—";
    label.className = "avaliacao-label nota-" + classeNota(avaliacaoAtual);
  }
}

const notaInput = document.getElementById("avaliacao");
if (notaInput) {
  notaInput.addEventListener("input", () => {
    let v = parseInt(notaInput.value) || 0;
    if (v > 100) { v = 100; notaInput.value = 100; }
    if (v < 0)   { v = 0;   notaInput.value = "";  }
    setAvaliacao(v);
  });
}

// ============================================================
//  SUBMIT DO FORMULÁRIO
// ============================================================
form.addEventListener("submit", function(e) {
  e.preventDefault();

  const plataforma         = document.getElementById("plataforma").value.trim();
  const nome               = document.getElementById("jogo").value.trim();
  const avaliacao          = parseInt(document.getElementById("avaliacao").value) || 0;
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
    registrarHistorico("edit", registro.nome);
    jogos[parseInt(editIndex)] = registro;
  } else {
    registrarHistorico("add", registro.nome);
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
    registrarHistorico("delete", jogos[indexParaExcluir].nome);
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
function renderNota(val) {
  const v = parseInt(val) || 0;
  if (v === 0) return `<span class="nota-badge zero">—</span>`;
  const cls = classeNota(v);
  return `<span class="nota-badge ${cls}">${v}</span>`;
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

  if (ordemAlfabetica) {
    lista.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  } else if (sortCol) {
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
      <td>${renderNota(j.avaliacao)}</td>
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

    const avaliacaoHTML = parseInt(j.avaliacao) > 0
      ? `<span class="nota-badge ${classeNota(parseInt(j.avaliacao))}" style="font-size:11px;padding:2px 7px">${j.avaliacao}</span>`
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
          <div>${!temCapa ? renderNota(j.avaliacao) : ""}</div>
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
  atualizarTop5();
  atualizarHistorico();
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

function mediaDeJogos(lista) {
  const validos = lista.filter(j => parseInt(j.avaliacao) > 0);
  if (!validos.length) return null;
  return Math.round(validos.reduce((acc, j) => acc + parseInt(j.avaliacao), 0) / validos.length);
}

function atualizarMediaAvaliacoes() {
  const section = document.getElementById("mediaSection");
  const avaliadosTotal = jogos.filter(j => parseInt(j.avaliacao) > 0);

  if (avaliadosTotal.length === 0) {
    section.classList.add("hidden");
    return;
  }
  section.classList.remove("hidden");

  const mediaGeral = mediaDeJogos(jogos);
  const clsGeral   = classeNota(mediaGeral);
  document.getElementById("mediaStarsGeral").innerHTML = "";
  document.getElementById("mediaNumeroGeral").textContent = mediaGeral;
  document.getElementById("mediaNumeroGeral").className = `media-numero nota-badge ${clsGeral}`;

  const plataformas = [...new Set(jogos.map(j => j.plataforma).filter(Boolean))].sort();
  const container = document.getElementById("mediaPlataformas");
  container.innerHTML = "";

  plataformas.forEach((plat, i) => {
    const jogosDaPlat   = jogos.filter(j => j.plataforma === plat);
    const mediaPlat     = mediaDeJogos(jogosDaPlat);
    const totalPlat     = jogosDaPlat.length;
    const avaliadosPlat = jogosDaPlat.filter(j => parseInt(j.avaliacao) > 0).length;
    const cor           = CORES_PLATAFORMA[i % CORES_PLATAFORMA.length];

    const card = document.createElement("div");
    card.className = "media-plat-card";
    card.style.setProperty("--plat-cor", cor);

    if (mediaPlat !== null) {
      const cls = classeNota(mediaPlat);
      card.innerHTML = `
        <span class="media-plat-nome" title="${plat}">${plat}</span>
        <div class="media-plat-footer">
          <span class="nota-badge ${cls}" style="font-size:18px;padding:4px 12px">${mediaPlat}</span>
          <span class="media-plat-count">${avaliadosPlat}/${totalPlat} avaliado${avaliadosPlat !== 1 ? "s" : ""}</span>
        </div>`;
    } else {
      card.innerHTML = `
        <span class="media-plat-nome" title="${plat}">${plat}</span>
        <div class="media-plat-footer">
          <span class="nota-badge zero">—</span>
          <span class="media-plat-count">${totalPlat} jogo${totalPlat !== 1 ? "s" : ""}</span>
        </div>`;
    }
    container.appendChild(card);
  });
}

// ============================================================
//  TOP 5 MAIS BEM AVALIADOS
// ============================================================
function atualizarTop5() {
  const section = document.getElementById("top5Section");
  const avaliados = jogos.filter(j => parseInt(j.avaliacao) > 0);

  if (avaliados.length === 0) {
    section.classList.add("hidden");
    return;
  }
  section.classList.remove("hidden");

  const top5 = [...avaliados]
    .sort((a, b) => parseInt(b.avaliacao) - parseInt(a.avaliacao))
    .slice(0, 5);

  const medalhas = ["ouro", "prata", "bronze"];
  const numeros  = ["1", "2", "3", "4", "5"];

  document.getElementById("top5Lista").innerHTML = top5.map((j, i) => {
    const posClasse = medalhas[i] || "";
    const capaHTML = j.capaURL
      ? `<img class="top5-capa" src="${j.capaURL}" alt="" onerror="this.outerHTML='<div class=top5-capa-placeholder>🎮</div>'">`
      : `<div class="top5-capa-placeholder">🎮</div>`;
    const nota = parseInt(j.avaliacao) || 0;
    const cls  = classeNota(nota);

    return `
      <div class="top5-card">
        <span class="top5-posicao ${posClasse}">${numeros[i]}</span>
        ${capaHTML}
        <div class="top5-info">
          <span class="top5-nome" title="${j.nome}">${j.nome}</span>
          <span class="top5-plataforma">${j.plataforma}</span>
        </div>
        <span class="nota-badge ${cls}" style="margin-left:auto;flex-shrink:0">${nota}</span>
      </div>`;
  }).join("");
}

// ============================================================
//  HISTÓRICO DE ALTERAÇÕES
// ============================================================
const MAX_HISTORICO = 50;

function registrarHistorico(tipo, nome) {
  const agora = new Date();
  const entrada = {
    tipo,
    nome,
    data: agora.toISOString()
  };
  historico.unshift(entrada);
  if (historico.length > MAX_HISTORICO) historico.pop();
}

function formatarDataHistorico(isoString) {
  const d = new Date(isoString);
  const agora = new Date();
  const diffMs = agora - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH   = Math.floor(diffMs / 3600000);
  const diffD   = Math.floor(diffMs / 86400000);

  if (diffMin < 1)  return "agora";
  if (diffMin < 60) return `${diffMin}min atrás`;
  if (diffH < 24)   return `${diffH}h atrás`;
  if (diffD < 7)    return `${diffD}d atrás`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function atualizarHistorico() {
  const section = document.getElementById("historicoSection");
  const lista   = document.getElementById("historicoLista");

  if (historico.length === 0) {
    section.classList.add("hidden");
    return;
  }
  section.classList.remove("hidden");

  const ICONES = { add: "➕", edit: "✏️", delete: "🗑️" };
  const TEXTOS = {
    add:    nome => `Adicionado <strong>${nome}</strong>`,
    edit:   nome => `Editado <strong>${nome}</strong>`,
    delete: nome => `Removido <strong>${nome}</strong>`,
  };

  lista.innerHTML = historico.map(h => `
    <div class="historico-item">
      <span class="historico-icon ${h.tipo}">${ICONES[h.tipo]}</span>
      <span class="historico-texto">${TEXTOS[h.tipo](h.nome)}</span>
      <span class="historico-data">${formatarDataHistorico(h.data)}</span>
    </div>
  `).join("");
}

document.getElementById("btnLimparHistorico").addEventListener("click", () => {
  historico = [];
  salvar();
  atualizarHistorico();
});
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
//  ORDENAÇÃO ALFABÉTICA
// ============================================================
document.getElementById("btnAlfabetica").addEventListener("click", () => {
  ordemAlfabetica = !ordemAlfabetica;
  const btn = document.getElementById("btnAlfabetica");
  btn.classList.toggle("active", ordemAlfabetica);
  btn.title = ordemAlfabetica ? "Ordenação alfabética ativa (clique para desativar)" : "Ordenar A→Z";
  // Desativa ordenação por coluna ao ativar alfabética
  if (ordemAlfabetica) {
    sortCol = "";
    sortDir = "asc";
    document.querySelectorAll("th.sortable").forEach(t => t.classList.remove("asc","desc"));
  }
  renderizar();
});

// ============================================================
//  EXPORTAR PDF
// ============================================================
function exportarPDF() {
  if (jogos.length === 0) {
    alert("Nenhum jogo para exportar.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // Cabeçalho
  const agora = new Date().toLocaleDateString("pt-BR");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Catalogo de Jogos", 14, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Gerado em ${agora}  •  ${jogos.length} jogo(s)`, 14, 23);
  doc.setTextColor(0);

  // Resumo rápido
  const platinados   = jogos.filter(j => j.statusPlatina === "platinado").length;
  const finalizados  = jogos.filter(j => j.statusJogo    === "finalizado").length;
  const avaliacoesPDF = jogos.filter(j => parseInt(j.avaliacao) > 0).map(j => parseInt(j.avaliacao));
  const mediaPDF = avaliacoesPDF.length
    ? Math.round(avaliacoesPDF.reduce((a,b)=>a+b,0) / avaliacoesPDF.length)
    : "—";
  doc.text(`Finalizados: ${finalizados}   Platinados: ${platinados}   Avaliação média: ${mediaPDF}`, 14, 29);
  doc.setTextColor(0);

  // Lista visível (respeita filtros e ordenação atual)
  const lista = jogosVisiveis();

  const STATUS_JOGO = {
    jogando: "Jogando", finalizado: "Finalizado",
    jogado: "Jogado", nao_comecado: "Nao comecei"
  };
  const STATUS_PLATINA = {
    platinado: "Platinado", andamento: "Andamento",
    implatinavel: "Implatinavel", nao_comecado: "Nao comecei"
  };

  const linhas = lista.map((j, i) => [
    i + 1,
    j.plataforma,
    j.nome,
    j.avaliacao > 0 ? `${j.avaliacao}` : "—",
    STATUS_JOGO[j.statusJogo] || j.statusJogo,
    STATUS_PLATINA[j.statusPlatina] || j.statusPlatina,
    j.progressoPlatina ? `${j.progressoPlatina}%` : "—",
    j.possuiDLC    === "sim" ? "Sim" : "Nao",
    j.possuiManual === "sim" ? "Sim" : "Nao",
  ]);

  doc.autoTable({
    startY: 34,
    head: [["#", "Plataforma", "Jogo", "Nota", "Status Jogo", "Platina", "Progresso", "DLC", "Manual"]],
    body: linhas,
    styles: { font: "helvetica", fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [80, 50, 200], textColor: 255, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 245, 250] },
    columnStyles: {
      0: { cellWidth: 8,  halign: "center" },
      1: { cellWidth: 28 },
      2: { cellWidth: 70 },
      3: { cellWidth: 14, halign: "center" },
      4: { cellWidth: 26 },
      5: { cellWidth: 26 },
      6: { cellWidth: 20, halign: "center" },
      7: { cellWidth: 12, halign: "center" },
      8: { cellWidth: 14, halign: "center" },
    },
    didDrawPage: (data) => {
      // Rodapé com número de página
      const pags = doc.internal.getNumberOfPages();
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text(
        `Pagina ${data.pageNumber} de ${pags}`,
        doc.internal.pageSize.getWidth() / 2, 
        doc.internal.pageSize.getHeight() - 6,
        { align: "center" }
      );
    }
  });

  doc.save("catalogo-jogos.pdf");
}

document.getElementById("btnExportarPDF").addEventListener("click", exportarPDF);
document.getElementById("btnExportarPDFMobile").addEventListener("click", exportarPDF);
function exportarJSON() {
  const blob = new Blob([JSON.stringify(jogos, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = "catalogo-jogos.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importarJSON(e) {
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
}

document.getElementById("btnExportar").addEventListener("click", exportarJSON);
document.getElementById("btnExportarMobile").addEventListener("click", exportarJSON);
document.getElementById("btnImportar").addEventListener("change", importarJSON);
document.getElementById("btnImportarMobile").addEventListener("change", importarJSON);

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
  const avaliacoesValidas = jogos.filter(j => parseInt(j.avaliacao) > 0).map(j => parseInt(j.avaliacao));
  const media = avaliacoesValidas.length
    ? Math.round(avaliacoesValidas.reduce((a,b)=>a+b,0) / avaliacoesValidas.length)
    : null;
  const platinados = jogos.filter(j => j.statusPlatina === "platinado").length;
  const platinaveis = jogos.filter(j => j.platinavelSimbolo === "sim").length;
  const taxaPlatina = platinaveis > 0 ? Math.round(platinados / platinaveis * 100) + "%" : "—";

  const progressos = jogos.filter(j => j.progressoPlatina > 0).map(j => parseInt(j.progressoPlatina) || 0);
  const progressoMedio = progressos.length
    ? Math.round(progressos.reduce((a,b)=>a+b,0) / progressos.length) + "%"
    : "—";

  const plataformasUnicas = [...new Set(jogos.map(j => j.plataforma).filter(Boolean))];

  document.getElementById("statTotal").textContent        = jogos.length;
  document.getElementById("statMedia").textContent = media !== null ? media : "—";
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
  const distAval = { "0–39": 0, "40–59": 0, "60–79": 0, "80–89": 0, "90–100": 0, "Sem nota": 0 };
  jogos.forEach(j => {
    const v = parseInt(j.avaliacao) || 0;
    if (v === 0)       distAval["Sem nota"]++;
    else if (v < 40)   distAval["0–39"]++;
    else if (v < 60)   distAval["40–59"]++;
    else if (v < 80)   distAval["60–79"]++;
    else if (v < 90)   distAval["80–89"]++;
    else               distAval["90–100"]++;
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
