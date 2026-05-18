# 🎮 Catálogo de Jogos

Aplicação web pessoal para catalogar sua coleção de games. Funciona 100% no navegador, sem backend nem instalação.

## Funcionalidades

- Adicionar, editar e excluir jogos
- Controle de status de jogo e de platina, avaliação por estrelas, DLC, manual e capa
- Busca, filtros por chips e ordenação por coluna
- Visualização em tabela ou grade com capas dos jogos
- Aba de estatísticas com 6 gráficos (Chart.js)
- Card de avaliação média geral e por plataforma
- Exportar e importar catálogo em JSON
- Tema dark/light persistido
- Atalhos de teclado (`N` novo jogo · `F` busca · `G` grade · `Esc` fechar · `?` ajuda)

## Como usar

Clone o repositório e abra o `index.html` no navegador. Recomendado usar o [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) no VS Code.

## Tecnologias

HTML · CSS · JavaScript · [Chart.js](https://www.chartjs.org/) · Google Fonts (Orbitron + Inter)

## ⚠️ Aviso

Os dados ficam salvos no `localStorage` do navegador. Use **Exportar JSON** regularmente para não perder seu catálogo.
