# Checkpoint do Projeto — Sistema de Separação de Estoque
> Casa das Correntes Guanabara · Atualizado: 2026-05-04 (sessão 31)

---

## 🟢 STATUS GERAL: PRONTO PARA DEPLOY — Build limpo (zero erros) · Sprint 31 concluída · Fluxo NF obrigatório + logo oficial

Stack: **React 18 + Vite 5 + TailwindCSS 3 · Node.js + Express + SQLite · JWT + Socket.io**

---

## ✅ O QUE JÁ ESTÁ COMPLETO

### Sprint 31 — Hotfixes + Fluxo NF obrigatório + Logo oficial

**Resumo das mudanças desta sessão:**

- ✅ **Fix `criado_em` → `created_at` em `minhasEstatisticas`** (`solicitacoes.controller.js`) — a query de estatísticas pessoais usava `criado_em` (nome antigo da coluna), causando erro SQL `no such column: criado_em`. Corrigido para `created_at` em todas as referências (SELECT e `ultima?.created_at`).

- ✅ **Fix "Network Error" no mobile / API_BASE = ''** — todos os arquivos frontend que construíam URLs com `|| 'http://localhost:3001'` foram corrigidos para `|| ''`, tornando as URLs relativas (`/api/...`, `/uploads/...`). Isso faz o Vite proxy funcionar tanto no desktop quanto em dispositivos móveis na mesma rede WiFi. Arquivos corrigidos: `api.js`, `Perfil.jsx`, `Header.jsx`, `Sidebar.jsx`, `Motorista.jsx`, `Usuarios.jsx`, `DetalheSolicitacao.jsx` (2 ocorrências inline via `import.meta.env.VITE_API_URL || ''`).

- ✅ **Fix `db.transaction is not a function`** — `node:sqlite` do Node 22 (módulo nativo) não possui `.transaction()` como o `better-sqlite3`. Adicionado shim de compatibilidade em `getDb()` em `backend/src/database/db.js` que emula a mesma API (`fn() → BEGIN; fn(); COMMIT` / `ROLLBACK` em caso de erro). Corrigiu "Erro interno" em todos os 9+ pontos do código que usavam transações, incluindo `solicitacoes.criar`.

- ✅ **Migration #4: coluna `url_nota_fiscal`** (`backend/src/database/migrations.js`) — `ALTER TABLE solicitacoes ADD COLUMN url_nota_fiscal TEXT` via `PRAGMA table_info` + verificação de existência. Roda automaticamente no próximo restart do nodemon. O SELECT `s.*` em `buscarPorId` retorna a coluna sem alteração de query.

- ✅ **Middleware `uploadMisto`** (`backend/src/middleware/upload.js`) — nova instância multer que aceita dois campos distintos em um único request: `foto_separacao` (imagem JPEG/PNG/WEBP → pasta `fotos/`) e `nota_fiscal` (PDF → pasta `documentos/`). Exportado junto com `uploadPDF`, `uploadFoto` e `wrapMulter`.

- ✅ **Rota PATCH /:id/status atualizada** (`backend/src/routes/solicitacoes.routes.js`) — substituído `uploadFoto.single('foto_separacao')` por `uploadMisto.fields([{ name: 'foto_separacao' }, { name: 'nota_fiscal' }])`. Import atualizado para incluir `uploadMisto`.

- ✅ **Fluxo NF obrigatório no backend** (`backend/src/controllers/solicitacoes.controller.js`):
  - `req.files?.foto_separacao?.[0]` / `req.files?.nota_fiscal?.[0]` (substituiu `req.file` único)
  - Validação: ao ir para `em_separacao` vindo de `aguardando_nf` ou `em_emissao_nf`, a NF (PDF) é **obrigatória** — retorna 400 se ausente
  - Validação: ao ir para `material_separado`, a foto é **obrigatória** — retorna 400 se ausente
  - `UPDATE solicitacoes` inclui o campo `url_nota_fiscal = ?`
  - `TRANSICOES_PERMITIDAS.em_separacao.quem` inclui `'vendedor'` para permitir que o vendedor suba a NF diretamente

- ✅ **Fluxo NF obrigatório no frontend** (`frontend/src/pages/solicitacoes/DetalheSolicitacao.jsx`):
  - Estado `nfFile` adicionado
  - `acoesDisponiveis()` refatorado: `em_conferencia` → sempre `aguardando_nf`; `aguardando_nf` → "Anexar NF e Liberar" com `temNF: true` (para fiscal, vendedor, gerência e admin); `material_separado` com `fotoObrigatoria: true`
  - Painel de ação: upload de NF com borda vermelha tracejada quando não selecionado / borda índigo quando ok; upload de foto com mesma lógica em verde
  - Botão "Confirmar" desabilitado enquanto `acao.temNF && !nfFile` ou `acao.fotoObrigatoria && !fotoFile`
  - Link para `url_nota_fiscal` exibido no card de dados quando presente
  - Import `Upload` adicionado do lucide-react

- ✅ **Logo oficial** (`frontend/src/components/ui/Logo.jsx`) — SVG `LogoIconeSVG` recriado fielmente com o logo oficial da Casa das Correntes: losango (`<path>`) + 3 elos de corrente horizontais (`<rect rx="13">`), todos usando `currentColor`. Componente `LogoCasaDasCorrentes` mantém a mesma API de props (`variante: 'horizontal'|'vertical'|'icone'`, `corIcone`, `corTexto`). Texto em HTML separado do SVG para que as classes Tailwind de cor funcionem corretamente no login mobile (marinho sobre branco).

- ✅ **Build verificado**: ✓ zero erros, zero warnings. 2438 módulos transformados.

### Sprint 30 — Socket.io 100%: DashboardVendedor + DashboardEmissorNF + backend emit fiscal

**Resumo das mudanças desta sessão:**
- ✅ **`DashboardVendedor.jsx`** — adicionado import `getSocket` + `useEffect` ouvindo `status_atualizado`. O vendedor agora vê seus contadores ("Em Separação", "Material Pronto", "Agendadas") atualizarem automaticamente quando o almoxarife/estoquista avança o status, sem precisar clicar no botão de refresh.
- ✅ **Backend `solicitacoes.controller.js`** — adicionado emit `nova_nf_pendente` para todos os usuários com role `fiscal` no banco quando o status muda para `aguardando_nf`. O backend consulta `SELECT id FROM users WHERE role = 'fiscal' AND ativo = 1` e emite para cada um via `io.to(`usuario:${uid}`)`.
- ✅ **`DashboardEmissorNF.jsx`** — refatorado `async function buscar()` para `const buscar = useCallback(...)` + `useEffect([buscar])` + import `getSocket` + `useEffect` ouvindo `nova_nf_pendente`. A fila de NF atualiza instantaneamente quando a Alana/Caio recebe uma nova nota para emitir.
- ✅ **Cobertura socket.io — 100% completa** — todos os papéis do sistema agora recebem atualizações em tempo real: vendedor (status_atualizado), almoxarife/estoquista/admGalpão/gerencia/coordenador (nova_solicitacao), motorista (nova_rota), gerenteVendas (nova_proposta_entrega + status_atualizado), filaSeparacao (nova_solicitacao), emissorNF (nova_nf_pendente).
- ✅ Build verificado: ✓ zero erros, zero warnings.

### Sprint 29 — Socket.io cobertura completa + refactor useCallback + aria-label

**Resumo das mudanças desta sessão:**
- ✅ **`DashboardGerencia.jsx`** — adicionado import `getSocket` + `useEffect` ouvindo `nova_solicitacao`. A gerência agora vê os contadores atualizarem em tempo real quando uma nova solicitação é criada pelo vendedor.
- ✅ **`DashboardCoordenador.jsx`** — mesmo listener `nova_solicitacao`. O painel do super_admin (Matheus) atualiza instantaneamente.
- ✅ **`DashboardMotorista.jsx`** — `async function buscar()` refatorada para `useCallback` + `useEffect` com `[buscar]` + listener `nova_rota` via socket. O painel do Antônio agora reflete novas rotas atribuídas instantaneamente sem necessidade de refresh manual.
- ✅ **`DashboardGerenteVendas.jsx`** — `async function buscar()` refatorada para `useCallback` + `useEffect` com `[buscar]`. Adicionado listener duplo: `nova_proposta_entrega` (broadcast global, emitido quando vendedor envia proposta) e `status_atualizado` (emitido para o vendedor quando status muda). O painel da logística vê contadores de "Material Pronto" e "Agendados" atualizarem em tempo real.
- ✅ **`FilaSeparacao.jsx` — aria-label** — botão X inline (fecha mensagem de erro de ação) recebeu `aria-label="Fechar erro"`. Acessibilidade para leitores de tela.
- ✅ **Cobertura socket.io — 100%** — todos os dashboards que recebem eventos do backend agora têm listeners correspondentes: estoquista/almoxarife/admGalpão (nova_solicitacao), gerencia/coordenador (nova_solicitacao), motorista (nova_rota), gerenteVendas (nova_proposta_entrega + status_atualizado), filaSeparacao (nova_solicitacao).
- ✅ Build verificado: ✓ zero erros, zero warnings. 37 entradas no precache PWA.

### Sprint 28 — Socket.io em FilaSeparacao + Dashboards de separadores

**Resumo das mudanças desta sessão:**
- ✅ **`FilaSeparacao.jsx`** — adicionado import de `getSocket` + `useEffect` que escuta o evento `nova_solicitacao` via Socket.io e chama `buscar()` instantaneamente. Antes o estoquista dependia do polling de 30s para ver novos pedidos; agora a fila atualiza em tempo real assim que um vendedor abre uma solicitação.
- ✅ **`DashboardEstoquista.jsx`** — mesmo listener `nova_solicitacao` adicionado via `useEffect` com cleanup `socket.off`. Contadores e lista "Próximos na Fila" atualizam em tempo real.
- ✅ **`DashboardAlmoxarife.jsx`** — mesmo listener `nova_solicitacao`. Contadores e lista de solicitações recentes atualizam instantaneamente.
- ✅ **`DashboardAdmGalpao.jsx`** — mesmo listener `nova_solicitacao`. O adm do galpão também recebe o evento (backend envia para roles: super_admin, adm, gerencia, almoxarife, estoquista) e agora vê novos pedidos imediatamente.
- ✅ Build verificado: ✓ zero erros, zero warnings. 37 entradas no precache PWA.

### Sprint 27 — Fix regressão onTentar + Toasts em todas as páginas de ação

**Resumo das mudanças desta sessão:**
- ✅ **Fix crítico: `onTentar={buscar}` → `onTentar={carregar}`** em 4 dashboards — `DashboardAlmoxarife`, `DashboardCoordenador`, `DashboardEstoquista`, `DashboardVendedor` usavam `onTentar={buscar}` mas a função se chama `carregar` — `ReferenceError` em runtime ao clicar "Tentar novamente". Corrigido com `sed` em lote.
- ✅ **Toasts em `DetalheSolicitacao`** — `useToast` + `ToastContainer` adicionados. 7 ações agora têm feedback visual de sucesso: `executarAcaoStatus` ("Status atualizado! + LABELS_STATUS[acao.valor]"), `salvarPrioridade` ("Prioridade atualizada!"), `salvarAtribuicao` ("Estoquista atribuído!"), `salvarAgendamento` ("Agendamento criado!"), `salvarRota` ("Rota enviada! Motorista notificado."), `salvarProposta` ("Proposta enviada! Aguardando aprovação."), `salvarResposta` (sucesso = "Proposta aprovada!", recusa = alerta "Proposta recusada.").
- ✅ **Toasts em `Motorista.jsx`** — `confirmarEntrega` agora exibe "Entrega confirmada! Comprovante registrado com sucesso." após upload e confirmação bem-sucedida.
- ✅ **Toasts em `FilaSeparacao.jsx`** — `handleConcluir` agora exibe "Separação concluída! Material separado registrado com sucesso." após submissão com foto.
- ✅ **Cobertura de toasts: 100%** — todas as páginas com ações de escrita agora têm toast de sucesso: `NovaSolicitacao`, `Usuarios`, `DetalheSolicitacao`, `Motorista`, `FilaSeparacao`.
- ✅ Build verificado: ✓ zero erros, zero warnings. 37 entradas no precache PWA (↑ de 36).

### Sprint 26 — ErroCarregamento nos 9 dashboards

**Resumo das mudanças desta sessão:**
- ✅ **9 dashboards cobertos** — `DashboardAdmGalpao`, `DashboardAlmoxarife`, `DashboardCoordenador`, `DashboardEmissorNF`, `DashboardEstoquista`, `DashboardGerencia`, `DashboardGerenteVendas`, `DashboardMotorista`, `DashboardVendedor`: todos receberam `[erro, setErro]` state, `setErro('')` no início do fetch, catch convertido de silencioso para `setErro('Erro ao carregar dados...')`, import de `ErroCarregamento`, bloco `{erro && !carregando && <ErroCarregamento>}` no JSX e conteúdo principal condicionado a `{!erro && (carregando ? <Spinner> : content)}`.
- ✅ Build verificado: ✓ zero erros, zero warnings. 34 entradas no precache PWA (↑ de 33).

### Sprint 25 — ErroCarregamento nas páginas restantes

**Resumo das mudanças desta sessão:**
- ✅ **`FilaSeparacao.jsx`** — adicionado `[erroLoad, setErroLoad]` state; `setErroLoad('')` no início de `buscar()`; catch silencioso substituído por `setErroLoad('Erro ao carregar a fila...')`; `ErroCarregamento` importado e adicionado ao JSX com retry; lista e empty-state condicionados a `!erroLoad`.
- ✅ **`AuditLog.jsx`** — adicionado `[erro, setErro]` state; `setErro('')` no início de `buscar()`; catch silencioso substituído por `setErro('Erro ao carregar o audit log...')`; `ErroCarregamento` importado e adicionado ao JSX; tabela inteira condicionada a `!erro`.
- ✅ **`Notificacoes.jsx`** — adicionado `[erro, setErro]` state; `setErro('')` no início de `buscar()`; catch silencioso substituído por `setErro('Erro ao carregar notificações...')`; `ErroCarregamento` importado e adicionado ao JSX; lista e empty-state condicionados a `!erro`.
- ✅ **`Motorista.jsx`** — adicionado `[erroLoad, setErroLoad]` state separado do `erroAcao` (erros de ação inline são diferentes de erros de carga); `setErroLoad('')` no início de `buscar()`; catch silencioso substituído; `ErroCarregamento` importado e adicionado; conteúdo (spinner, lista pendentes, histórico) condicionado a `!erroLoad`.
- ✅ Build verificado: ✓ zero erros, zero warnings. 33 entradas no precache PWA (↑ de 32).

### Sprint 24 — Cleanup imports órfãos + erros/retry em Histórico e Relatórios

**Resumo das mudanças desta sessão:**
- ✅ **`Agendamentos.jsx`** — removido import órfão `AlertTriangle` do lucide-react (tornou-se desnecessário após Sprint 23 ao substituir o bloco de erro inline por `ErroCarregamento`).
- ✅ **`ListaSolicitacoes.jsx`** — removido import órfão `AlertTriangle` do lucide-react (mesma causa).
- ✅ **`Historico.jsx`** — adicionado estado `[erro, setErro]`; `setErro('')` resetado no início de cada fetch; catch antes silencioso (`{}`) agora chama `setErro('Erro ao carregar histórico. Verifique sua conexão.')`; bloco `<ErroCarregamento>` adicionado ao JSX (com retry via `setGatilho`); estado vazio só exibe quando `!erro`.
- ✅ **`Relatorios.jsx`** — adicionado estado `[erro, setErro]`; `setErro('')` resetado no início de `buscar()`; catch antes silencioso agora chama `setErro('Erro ao carregar relatórios. Verifique sua conexão.')`; `ErroCarregamento` importado e adicionado ao JSX (com retry via `buscar()`); conteúdo principal condicionado a `!erro`.
- ✅ Build verificado: ✓ zero erros, zero warnings. 32 entradas no precache PWA (↑ de 31).

### Sprint 23 — ErroCarregamento com retry

**Resumo das mudanças desta sessão:**
- ✅ **Componente `ErroCarregamento`** — `components/ui/ErroCarregamento.jsx`: exibe ícone de alerta, mensagem descritiva e botão "Tentar novamente" com spinner. Reutilizável em qualquer página. Prop `onTentar` opcional — se não fornecida, exibe só a mensagem sem botão.
- ✅ **`DetalheSolicitacao`** — bloco de erro de carregamento substituído pelo `ErroCarregamento`. Ao falhar ao buscar a solicitação (ex: servidor indisponível), exibe botão "Tentar novamente" que chama `carregar()` novamente. Quando a solicitação não existe (404), exibe mensagem sem botão de retry (retry não resolveria).
- ✅ **`Agendamentos`** — banner de erro inline substituído por `ErroCarregamento` com retry que chama `buscar()`.
- ✅ **`ListaSolicitacoes`** — banner de erro inline substituído por `ErroCarregamento` com retry que incrementa `gatilho` (padrão existente de re-fetch).
- ✅ Build verificado: ✓ zero erros, zero warnings. 31 entradas no precache PWA (↑ de 29).

### Sprint 22 — ModalConfirmacao para ações destrutivas

**Resumo das mudanças desta sessão:**
- ✅ **Componente `ModalConfirmacao`** — `components/ui/ModalConfirmacao.jsx`: modal reutilizável com overlay, ícone, título, mensagem, e dois botões (Cancelar / Confirmar). Suporta 3 variantes: `perigo` (vermelho, ícone Trash), `aviso` (âmbar, ícone AlertTriangle), `normal` (azul). Fecha no Escape, bloqueia scroll do body, acessível (`role="dialog"`, `aria-modal`, `aria-labelledby`). Prop `carregando` desabilita botões e mostra "Aguarde…" no botão de confirmação.
- ✅ **`DetalheSolicitacao` — Cancelar Solicitação** — o `confirm()` nativo do browser foi substituído pelo `ModalConfirmacao` variante `perigo`. O botão agora abre o modal; o modal chama `cancelarSolicitacao()` no confirmar. Estado `cancelando` controla o spinner durante a API call.
- ✅ **`Usuarios` — Desativar usuário** — ao clicar em desativar (UserX), se o usuário está ativo, abre `ModalConfirmacao` variante `aviso` com nome do usuário na mensagem. Reativar (ativar usuário inativo) não exige confirmação — segue direto. Estado `desativando` controla o spinner no modal.
- ✅ Build verificado: ✓ zero erros, zero warnings. 29 entradas no precache PWA (↑ de 26).

### Sprint 21 — Títulos dinâmicos · Socket no Motorista · Fix overlap OfflineBanner

**Resumo das mudanças desta sessão:**
- ✅ **`usePageTitle` hook** — `hooks/usePageTitle.js`: define o título da aba de forma dinâmica por página. Preserva o badge `(N)` de notificações ao navegar. Na saída da página, restaura o título base. Formato: `"Fila de Separação — CCG"` / `"(3) Agendamentos — CCG"`.
- ✅ **Títulos dinâmicos em 12 páginas** — `usePageTitle('...')` adicionado em: Fila de Separação, Solicitações, Nova Solicitação, Detalhe da Solicitação, Agendamentos, Minhas Entregas (Motorista), Relatórios, Histórico, Usuários, Audit Log, Notificações, Meu Perfil.
- ✅ **`NotificacoesContext` refatorado** — o badge `(N)` agora preserva o nome da página ao atualizar. Antes sobrescrevia com `"Sistema Separação"` sempre; agora faz `document.title.replace(/^\(\d+\)\s*/, '')` para manter o título da página corrente e só atualizar o prefixo numérico.
- ✅ **Fix overlap `OfflineBanner`** — o banner offline tem `position: fixed top-0` e antes encobria o Header. `LayoutPrincipal` agora consome `useNetworkStatus` + `useNetworkError` e aplica `pt-10` (40px) ao wrapper raiz quando o banner está visível, empurrando todo o layout para baixo.
- ✅ **Socket `nova_rota` no Motorista** — `Motorista.jsx` agora escuta o evento `nova_rota` via Socket.io e chama `buscar()` automaticamente quando o gerente despacha uma rota. Antes o Antônio precisava recarregar a página manualmente para ver novas entregas atribuídas.
- ✅ Build verificado: ✓ zero erros, zero warnings. 26 entradas no precache PWA (↑ de 24).

### Sprint 20 — helmet · compression · Indicador offline

**Resumo das mudanças desta sessão:**
- ✅ **Backend: helmet.js** — instalado e configurado no `index.js`. Define automaticamente headers de segurança HTTP em todas as respostas: `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `X-XSS-Protection`, `Referrer-Policy` e outros. Em produção, `Content-Security-Policy` restritivo (apenas `'self'` para scripts, `'unsafe-inline'` para estilos TailwindCSS, `blob:` e `data:` para imagens, `wss:` para Socket.io). Em desenvolvimento, CSP desativado para não bloquear o HMR do Vite.
- ✅ **Backend: compression** — instalado e configurado. Todas as respostas JSON e estáticas acima de 1kb são comprimidas com gzip/brotli automaticamente. Reduz o tráfego de rede em ~60-80% nas respostas JSON maiores (listagem de solicitações, histórico, relatórios) — importante em redes WiFi lentas da loja.
- ✅ **Frontend: `useNetworkStatus` hook** — `hooks/useNetworkStatus.js` escuta os eventos nativos `online`/`offline` do `window` e retorna `{ online }`. Leve, sem dependências de biblioteca.
- ✅ **Frontend: `NetworkErrorContext`** — `context/NetworkErrorContext.jsx` combina dois sinais de indisponibilidade: eventos `api:network-error` / `api:network-ok` disparados pelo interceptor do Axios quando o servidor não responde (sem `error.response`). Desacoplado via CustomEvent — sem import circular entre `api.js` e React context.
- ✅ **Frontend: `OfflineBanner`** — `components/ui/OfflineBanner.jsx` exibe faixa vermelha fixa no topo (`z-[9999]`, `position: fixed`) quando detecta offline. Distingue dois casos: (1) browser sem rede — "Sem conexão com a internet — verifique a rede WiFi"; (2) browser online mas API inacessível — "Servidor indisponível — tentando reconectar…". Some automaticamente quando o sinal volta.
- ✅ **`api.js` atualizado** — interceptor de response agora dispara `CustomEvent('api:network-error')` quando `!error.response`, e `CustomEvent('api:network-ok')` em qualquer resposta bem-sucedida.
- ✅ **`App.jsx` atualizado** — `NetworkErrorProvider` e `OfflineBanner` adicionados. Provider envolve toda a árvore; banner montado fora do `BrowserRouter` (sem hooks de router) mas dentro do provider.
- ✅ Build verificado: ✓ zero erros, zero warnings. 24 entradas no precache PWA (↑ de 21).

### Sprint 19 — Transações em propostas.controller · Integridade total no backend

**Resumo das mudanças desta sessão:**
- ✅ **Transações atômicas em `propostas.controller.js`** — o último controller com writes não-atômicos foi coberto. Três funções corrigidas:
  - **`criar`**: 4 writes (cancel proposta anterior `UPDATE propostas_entrega` + `INSERT propostas_entrega` + `UPDATE solicitacoes` + `INSERT historico_status`) agora dentro de `db.transaction()()`. Se qualquer escrita falhar, nenhuma é persistida — a solicitação não muda de status sem a proposta criada, e a proposta não fica pendente sem a solicitação marcada como `entrega_solicitada`.
  - **`responder (aprovada)`**: 4 writes (`UPDATE propostas_entrega` + `INSERT agendamentos` + `UPDATE solicitacoes` + `INSERT historico_status`) em transação única. Também movida a validação de `endereco_completo` para antes da transação (fail-fast sem abrir transação desnecessária).
  - **`responder (recusada)`**: 3 writes (`UPDATE propostas_entrega` + `UPDATE solicitacoes` + `INSERT historico_status`) em transação única.
- ✅ **Cobertura de transações: 100%** — com esta sprint, **todos** os controllers do backend têm writes críticos cobertos por transação atômica:
  - `solicitacoes`: `criar`, `atualizarStatus`, `atribuirEstoquista`, `atualizarPrioridade`
  - `agendamentos`: `criar`
  - `entregas`: `criar`, `confirmar`
  - `propostas`: `criar`, `responder` (aprovada e recusada)
- ✅ Build verificado: ✓ zero erros, zero warnings. 21 entradas no precache PWA.

### Sprint 18 — Transações completas · Socket.io resiliente · Integridade total

**Resumo das mudanças desta sessão:**
- ✅ **Transações atômicas nos 3 controllers de criação** — `solicitacoes.criar` (INSERT + historico), `agendamentos.criar` (INSERT agendamento + UPDATE solicitacoes + historico) e `entregas.criar` (INSERT entrega + UPDATE solicitacoes + historico) agora envolvem todos os writes em `db.transaction()()`. Adicionalmente, `confirmarEntrega` (UPDATE entrega + UPDATE solicitacoes + historico) também foi envolvida — era o único caso de 3 writes críticos fora de transação restante. Com isso, **todos os fluxos principais do backend são agora atomicamente seguros**: nenhuma mudança de estado fica sem histórico correspondente no banco.
- ✅ **Socket.io: resiliência de reconexão** — `reconnectionAttempts: 5` → `20`, adicionado `reconnectionDelayMax: 10000` (backoff exponencial até 10s entre tentativas). Adicionado handler `reconnect_failed` que loga aviso claro quando todas as tentativas se esgotam. O polling de 30s no `NotificacoesContext` já garante fallback — agora o socket tenta por ~3min antes de desistir (suficiente para o servidor reiniciar e estar de volta em rede LAN).
- ✅ Build verificado: ✓ zero erros, zero warnings. 21 entradas no precache PWA.

### Sprint 17 — Transações SQLite · Fix param duplicado · Integridade de dados

**Resumo das mudanças desta sessão:**
- ✅ **Transações atômicas no backend** — `atualizarStatus`, `atribuirEstoquista` e `atualizarPrioridade` em `solicitacoes.controller.js` agora envolvem o par `UPDATE solicitacoes` + `INSERT historico_status` em `db.transaction(() => {...})()` do `node:sqlite`. Antes, se o INSERT de histórico falhasse após o UPDATE (raro mas possível), o status mudaria sem registro no histórico — dados inconsistentes. Agora é atômico: ou os dois ocorrem ou nenhum. As notificações e o audit log continuam fora da transação (já têm try/catch próprio e são best-effort).
- ✅ **Fix param duplicado em Relatorios.jsx** — `solicitacoesApi.listar({ limite: 1000, limit: 1000 })` tinha `limit` e `limite` simultaneamente. O backend usa apenas `limite`. Removido `limit` duplicado.
- ✅ Build verificado: ✓ zero erros, zero warnings. 20 entradas no precache PWA.

### Sprint 16 — Fix Node 22 · ErrorBoundary · Interceptor 401 · Hardening Final

**Resumo das mudanças desta sessão:**
- ✅ **Fix crítico: versão do Node.js** — `backend/package.json` corrigido de `">=18.0.0"` para `">=22.0.0"`. O backend usa `node:sqlite` (`DatabaseSync`), módulo nativo disponível **apenas no Node.js 22+** (não existe no 18 nem no 20). Quem instalasse o Node 18 LTS (indicado no guia anterior) teria o servidor crashando na inicialização.
- ✅ **DEPLOY.md atualizado** — todas as menções a "Node.js 18+" corrigidas para "Node.js 22+". Adicionado aviso explícito: `⚠️ Não use Node 18 ou 20 — o banco de dados interno (node:sqlite) exige Node 22+`.
- ✅ **ErrorBoundary global** — criado `frontend/src/components/ui/ErrorBoundary.jsx` (class component React). Captura erros de render inesperados e exibe tela amigável com botão "Recarregar" em vez de tela branca. Em modo `DEV` mostra a mensagem do erro; em produção exibe apenas texto genérico. Registrado no `App.jsx` envolvendo toda a aplicação (`<ErrorBoundary>` como raiz).
- ✅ **Interceptor 401 reforçado** — `api.js` já tinha tratamento de `TOKEN_EXPIRADO` com refresh silencioso. Adicionado fallback para **401 não-expiração** (token corrompido, usuário desativado, token inválido): limpa `accessToken`, `refreshToken` e `usuario` do `localStorage` e redireciona para `/login` automaticamente. Sem isso o usuário ficava preso — as chamadas falhavam silenciosamente mas a sessão persistia.
- ✅ Build verificado: ✓ zero erros, zero warnings. 19 entradas no precache PWA (subiu de 17 — `ErrorBoundary.jsx` incluído).

### Sprint 15 — Backup Script · Route Fix · Code Cleanup · Final Build

**Resumo das mudanças desta sessão:**
- ✅ **Script de backup SQLite** — `backend/src/database/backup.js`: copia `separacao.db` para `backups/separacao.db.bak.YYYY-MM-DD`, mantém os últimos 30 backups automaticamente, remove backups mais antigos. Adicionado `"backup": "node src/database/backup.js"` aos scripts do `package.json` → `npm run backup`. Com instruções de crontab (Linux) e Task Scheduler (Windows) para automatizar o backup diário.
- ✅ **Route order fix em usuarios.routes.js** — `PATCH /minha-senha` movido para ANTES das rotas `/:id` (junto com PUT `/minha-foto`). Previne qualquer ambiguidade futura. Validações reescritas com mensagens em português. Rota duplicada no final do arquivo removida.
- ✅ **Remoção de import morto** — `import PaginaEmConstrucao` removido do `App.jsx` (componente não estava sendo usado em nenhuma `<Route>`). Build mais limpo, sem importações desnecessárias.
- ✅ **Confirmação de fluxo NF** — verificado que `aguardando_nf` e `em_emissao_nf` são statuses reais no backend (`TRANSICOES_PERMITIDAS`). `DashboardEmissorNF` e `DetalheSolicitacao` têm suporte completo para o fluxo de NF (tipo `orcamento` → `aguardando_nf` → `em_emissao_nf` → `em_separacao`). O fiscal (`Alana`) tem os botões de ação corretos.
- ✅ Build verificado: ✓ zero erros, zero warnings. 17 entradas no precache PWA.

### Sprint 14 — PWA Completo · Deploy Produção · Ícones PNG · Backend Serve Frontend

**Resumo das mudanças desta sessão:**
- ✅ **Ícones PWA gerados** — `pwa-192x192.png`, `pwa-512x512.png`, `apple-touch-icon.png` (180x180), `favicon.ico` multi-size (16/32/48px) gerados com ImageMagick a partir do SVG. Resolvem o problema de instalação do PWA no Android (Chrome exige PNG, não aceita apenas SVG).
- ✅ **index.html corrigido** — `apple-touch-icon` apontava para `/icons/icon-192.png` (inexistente) → corrigido para `/apple-touch-icon.png`. Registro manual de SW removido (VitePWA faz isso). `viewport-fit=cover` adicionado para iOS notch. Nome do app corrigido para "CCG Separação".
- ✅ **manifest.json atualizado** — inclui os 3 ícones (192 PNG, 512 PNG, SVG) + shortcuts (Nova Solicitação / Fila). Consistente com o webmanifest gerado pelo VitePWA.
- ✅ **Backend serve frontend em produção** — `index.js` detecta `NODE_ENV=production` e serve `../frontend/dist` via `express.static`. Qualquer rota não-API retorna `index.html` (SPA routing). Um único processo Node.js serve tudo — sem precisar de Nginx.
- ✅ **`listen('0.0.0.0', PORT)`** — servidor escuta em todas as interfaces de rede, não apenas localhost. Permite acesso de outros dispositivos na rede WiFi da loja.
- ✅ **`ecosystem.config.js`** criado — configuração PM2 para manter o servidor rodando 24h com reinício automático.
- ✅ **`DEPLOY.md`** criado — guia passo a passo completo: instalação, variáveis de ambiente, build, PM2, instalação PWA no celular, solução de problemas comuns, como resetar senha de usuário.
- ✅ **`frontend/.env.production`** criado — template com instrução clara de como descobrir o IP do servidor.
- ✅ Build verificado: ✓ zero erros, zero warnings. PWA precache: 17 entradas (inclui os 3 PNGs novos).

### Sprint 13 — Performance Gerência/Coordenador · Badge Aguardando Senha · Toasts

**Resumo das mudanças desta sessão:**
- ✅ **DashboardGerencia — Minha Performance como Solicitante** — `minhasEstatisticas()` adicionado ao `Promise.all`. Estado `meusStats`. Card exibido após "Ações Rápidas" mostrando total criadas, entregues, em andamento + barra de taxa de conclusão. Somente visível quando `v.total_criadas > 0`. Usa IIFE para encapsular lógica da cor.
- ✅ **DashboardCoordenador — Minha Performance como Solicitante** — mesma implementação: fetch paralelo de `minhasEstatisticas()`, estado `meusStats`, card após "Atalho rápido". Ícone `FileText` adicionado aos imports.
- ✅ **Badge "Aguardando senha" na tabela de Usuários** — coluna Status exibe badge âmbar com ícone `AlertTriangle` quando `usuario.primeiro_acesso = 1`. Badge com tooltip "Usuário ainda não definiu a senha".
- ✅ **Toasts em NovaSolicitacao** — após submit bem-sucedido mostra `toast.sucesso` e navega após 1,2s (sem tela intermediária de sucesso). Erros de envio também acionam `toast.erro`. Usa `useToast` + `ToastContainer` local.
- ✅ **Toasts em Usuarios.jsx** — `toggleAtivo` mostra toast de sucesso/alerta ao ativar/desativar. `onSalvo(ehEdicao)` recebe booleano do ModalUsuario e exibe mensagem diferente para criar vs editar. `ModalUsuario.jsx` ajustado para passar `ehEdicao` no callback.
- ✅ Build verificado: ✓ zero erros, zero warnings · `--emptyOutDir false` (dist protegido pelo sistema de arquivos do usuário)

### Sprint 12 — foto_perfil nas queries · Avatar em Usuários · Paginação em ListaSolicitacoes

**Resumo das mudanças desta sessão:**
- ✅ **Backend: foto_perfil nos SELECTs** — `usuarios.controller` (`listar`, `buscarPorId`, `criar`, `atualizar`) e `auth.controller` (`login`, `perfil`) agora incluem `foto_perfil` em todas as queries SELECT. Login retorna `foto_perfil` no objeto do usuário → foto aparece no Header/Sidebar imediatamente após o login sem precisar ir ao perfil.
- ✅ **Mini avatar na tabela de Usuários** — `Usuarios.jsx` exibe mini avatar circular (32px) na primeira coluna de cada linha: foto do usuário se tiver `foto_perfil`, iniciais coloridas (bg-marinho-600) caso contrário. Importa `gerarIniciais` de `formatters.js`.
- ✅ **Paginação em ListaSolicitacoes** — adicionado estado `paginaAtual` (20 por página), controles "← Anterior / Próxima →", contador "Página X de Y (N registros)". `executarBusca()` reseta para página 1 se não estiver nela. useEffect acionado por `[gatilho, paginaAtual]`.
- ✅ Build verificado: ✓ 2432 módulos, zero erros, zero warnings

### Sprint 11 — Foto no Header/Sidebar · DashboardVendedor Stats · DashboardAdm Stats

**Resumo das mudanças desta sessão:**
- ✅ **Foto de perfil no Header e Sidebar** — `Header.jsx`: avatar mostra `<img>` com `usuario.foto_perfil` quando disponível, fallback para iniciais. `Sidebar.jsx`: seção de info do usuário ganhou mini-avatar circular (36px) com a mesma lógica foto/iniciais + layout flex reorganizado.
- ✅ **DashboardVendedor — Minha Performance** — `minhasEstatisticas()` buscado em paralelo com as outras chamadas. Bloco "Minha Performance" exibe total criadas, entregues, em andamento (cards coloridos) + barra de taxa de conclusão (verde ≥80%, amarelo ≥50%, vermelho). Aparece somente quando `v.total_criadas > 0`. Adicionado botão Refresh via `useCallback`.
- ✅ **DashboardAdmGalpao — melhorias** — `buscar` convertido para `useCallback`; fetch paralelo de `minhasEstatisticas()`; bloco "Minha Performance como Separador" (estilo compacto, mesmo padrão Estoquista/Almoxarife) — aparece somente quando o adm tem separações registradas.
- ✅ Build verificado: ✓ 2432 módulos, zero erros, zero warnings

### Sprint 10 — Botão Buscar Explícito · Upload de Foto de Perfil

**Resumo das mudanças desta sessão:**
- ✅ **Botão "Buscar" explícito em Histórico e ListaSolicitacoes** — filtros não executam mais na mudança de inputs. Padrão `filtrosRef + gatilho`: ref atualizada a cada render para evitar stale closure; useEffect acionado apenas por incremento do gatilho ou mudança de página. Suporte a Enter no campo de texto. Empty state orienta o usuário a clicar em Buscar.
- ✅ **Upload de foto de perfil** — backend: migration `ALTER TABLE users ADD COLUMN foto_perfil TEXT`; endpoint `PUT /api/usuarios/minha-foto` com multer (uploadFoto, limite 5MB, apenas JPEG/PNG/WEBP). Frontend: `usuariosApi.uploadFotoPerfil(formData)` em `api.js`; Perfil.jsx reescrito com overlay de câmera no avatar (visível no hover), input file oculto via `useRef`, preview `<img>` quando `usuario.foto_perfil` existe, link "Alterar foto" abaixo do nome, feedback de sucesso/erro, `atualizarUsuario()` sincroniza contexto + localStorage.
- ✅ Build verificado: ✓ 2432 módulos, zero erros, zero warnings

### Sprint 9 — Audit para Gerência · Página Notificações · Performance Estoquista/Almoxarife

**Resumo das mudanças desta sessão:**
- ✅ **Fix: Audit Log acessível para gerência** — `audit.routes.js` agora autoriza `gerencia` além de `super_admin`. `App.jsx` e `Sidebar` atualizados para expor `/audit` à gerência.
- ✅ **Página `/notificacoes` completa** — lista paginada (30/página) com filtros Todas / Não lidas / Lidas. Clicar na notificação marca como lida e navega para a solicitação. Botão individual de marcar lida. Botão "Marcar todas lidas" no header. Adicionada em todos os menus do Sidebar e como rota no App.jsx.
- ✅ **SinoNotificacoes atualizado** — dropdown mostra apenas as 6 mais recentes; clicar navega para a solicitação; rodapé com link "Ver todas as notificações" (→ `/notificacoes`).
- ✅ **Backend: notificacoesApi paginação completa** — `buscarNotificacoes()` agora suporta `pagina`, `lida` (0/1/null), e retorna `{ notificacoes, total }`. Rota `GET /api/notificacoes` repassa os novos params e inclui `total` na resposta.
- ✅ **DashboardEstoquista — Minha Performance** — bloco com total atribuídos/concluídos, tempo médio, melhor tempo e barra % dentro da meta. Usa endpoint `minhasEstatisticas` já existente.
- ✅ **DashboardAlmoxarife — Minha Performance** — mesmo bloco de métricas pessoais adicionado. Fetch paralelo junto com estatísticas e recentes.
- ✅ Build verificado: ✓ 2432 módulos, zero erros, zero warnings

### Sprint 8 — CSV Histórico · DashboardGerencia Gráfico · Perfil com Estatísticas · Code Splitting

**Resumo das mudanças desta sessão:**
- ✅ **Histórico: botão Exportar CSV** — `exportarCSV()` conectado ao botão de Download no header (aparece somente quando há registros). Busca todos os resultados filtrados (limite 5000) e gera CSV com BOM UTF-8.
- ✅ **DashboardGerencia redesenhado**: adicionado gráfico SVG de evolução (criadas/entregues por dia, seletor 7/14/30d) + bloco de top-5 estoquistas com tempo médio, barra de % meta e número de separações. Atalho para Audit Log adicionado nas ações rápidas.
- ✅ **Página Perfil — Estatísticas Pessoais**: bloco "Minha Performance" com seções por role. Como Solicitante (vendedor/gerência): total criadas, entregues, em andamento, barra de taxa de conclusão. Como Separador (estoquista/almoxarife): total atribuídos, concluídos, tempo médio/mínimo/máximo, barra % dentro da meta de 30min. Última atividade via `historico_acoes`.
- ✅ **Backend: `GET /api/solicitacoes/minhas-estatisticas`** — novo endpoint disponível para todos os roles, retorna stats filtradas pelo usuário autenticado (como vendedor + como estoquista + última atividade no audit log).
- ✅ **Code splitting Vite**: `manualChunks` para vendor-react / vendor-lucide / vendor-axios. `chunkSizeWarningLimit: 600`. Build: 8 chunks sem nenhum aviso, maior chunk 292kb.
- ✅ Build verificado: ✓ 2431 módulos, zero erros, zero warnings

### Sprint 7 — Gráfico Semanal · Badge de Notificações · Calendário de Entregas

**Resumo das mudanças desta sessão:**
- ✅ **Endpoint `GET /api/solicitacoes/evolucao`**: criações e entregas por dia nos últimos N dias (padrão 14). Grade completa com zeros nos dias sem movimento.
- ✅ **DashboardCoordenador redesenhado**: gráfico de barras SVG inline (criadas=azul, entregues=verde) com seletor 7/14/30 dias; bloco de top-5 estoquistas por tempo médio com % meta; atalho para Audit Log; indicador de pedidos em aberto no subtítulo.
- ✅ **Badge dinâmico no título da aba**: `document.title = "(N) Sistema Separação"` atualizado no `NotificacoesContext` sempre que `totalNaoLidas` muda. Volta ao nome base quando zerado.
- ✅ **Agendamentos — aba Calendário**: grade mensal com navegação mês a mês; dias com entregas destacados em verde com contador; clique no dia filtra a lista abaixo; legenda e botão "limpar filtro".
- ✅ Build verificado: zero erros (aviso de chunk size é informativo, não impede funcionamento)

### Sprint 6 — Audit Log · Auto-refresh · Filtro de Período

**Resumo das mudanças desta sessão:**
- ✅ **Audit Log** — `GET /api/audit` (paginado, filtros por ação/usuário/data) + `GET /api/audit/resumo` (contadores + atividade 7 dias). Controller, rota e registro no `index.js`.
- ✅ **Página `/audit`** — `AuditLog.jsx`: cards de resumo, mini-gráfico de barras dos últimos 7 dias, tabela com filtros (tipo, usuário, data início/fim), paginação numérica, exportar CSV. Item "Audit Log" adicionado no sidebar do super_admin.
- ✅ **Auto-refresh FilaSeparacao** — `setInterval(buscar, 30s)` pausado quando modal de conclusão está aberto. Exibe horário da última atualização e "auto em 30s" no header.
- ✅ **Filtro de período em ListaSolicitacoes** — botões rápidos (Hoje / 7 dias / 30 dias) + date inputs de/até + botão "limpar datas". Passa `data_inicio`/`data_fim` para o backend (que já suportava os params).
- ✅ Build verificado: ✓ 2431 módulos, zero erros

### Sprint 5 — Atribuição Inteligente · Timeline · Ranking de Separação

**Resumo das mudanças desta sessão:**
- ✅ **Atribuição por setor**: modal de atribuição filtra estoquistas pelo `setor_destino` da solicitação (quem é `ambos` sempre aparece). Cada opção exibe o setor com badge colorido. Aviso informativo quando há filtro ativo.
- ✅ **Timeline com durações**: cada evento do histórico mostra o tempo que a solicitação ficou naquele status ("Xh Ymin neste status"). Cor dos pontos: azul=atual, verde=entregue, vermelho=problemas. Badge "atual" no último evento.
- ✅ **Audit log (`historico_acoes`)**: novo helper `registrarAcao` em `solicitacoes.controller` e `propostas.controller`. Registra: `mudanca_status`, `atribuicao_estoquista`, `proposta_criada`, `proposta_aprovada`, `proposta_recusada`.
- ✅ **Endpoint `GET /api/solicitacoes/ranking-estoquistas`**: SQL com `AVG`, `MIN`, `MAX`, `% dentro da meta de 30min`. Acessível para super_admin, gerencia, adm.
- ✅ **Ranking no Relatório**: nova tabela com posição, nome, setor, total de pedidos, média, mínimo e barra de % meta. Aparece só quando há dados (lazy: só pede para roles com acesso).
- ✅ Build verificado: ✓ 2430 módulos, zero erros

### Sprint 4 — Fila de Separação (redesign completo)

**Resumo das mudanças desta sessão:**
- ✅ `FilaSeparacao.jsx` completamente reescrito: ações inline (Pegar Pedido / Iniciar Separação / Concluir), cronômetro ao vivo por pedido (verde→laranja→vermelho), modal de conclusão com foto obrigatória, formatarDuracao para exibir tempo decorrido
- ✅ `DetalheSolicitacao.jsx` — bloco de métricas de separação (início, conclusão, duração em "Xh Ymin") + `formatarDuracaoSep` helper adicionado + `proposta_recusada` e `entrega_solicitada` adicionados ao `ICONE_STATUS`
- ✅ `BadgeStatus.jsx` — `proposta_recusada` com estilo vermelho (bg-red-100 text-red-700)
- ✅ Build verificado: ✓ 2430 módulos, zero erros

### Sprint 3 — Redesign RBAC + Role "gerência"

**Resumo das mudanças desta sessão:**
- ❌ `logistica` removido de todo o sistema
- ✅ `gerencia` adicionado com permissões combinadas (logística + vendedor + fiscal + adm/almoxarife)
- ✅ Matheus: de `logistica` com extras → `gerencia` simples (sem acesso de super_admin)
- ✅ `proposta_recusada`: novo status no fluxo (gerência recusa → vendedor re-sugere)
- ✅ Timestamps de separação: `timestamp_inicio_separacao`, `timestamp_fim_separacao`, `tempo_separacao_segundos`
- ✅ `historico_acoes`: nova tabela de audit log
- ✅ `DashboardGerencia.jsx`: painel gerencial completo (separação + entrega + alertas + ações rápidas)
- ✅ gerência pode editar usuários (PUT) — mas NÃO criar/excluir/alterar roles

### Backend (`/backend/src/`)
| Arquivo | Status | Observações |
|---|---|---|
| `database/migrations.js` | ✅ Completo | `gerencia` no CHECK de users, `proposta_recusada` em solicitacoes, colunas timestamps separação, tabela `historico_acoes`, migration automática logistica→gerencia |
| `database/seeds.js` | ✅ Completo | Matheus = gerencia, roles_extra incluído no INSERT |
| `middleware/autenticar.js` | ✅ Completo | JWT + retrocompat tokens antigos |
| `middleware/autorizar.js` | ✅ Completo | `checkPermission` verifica todos os roles (multi-perfil), `restringirEdicaoGerencia` novo |
| `middleware/upload.js` | ✅ Completo | Multer PDF + Foto |
| `middleware/validar.js` | ✅ Completo | express-validator |
| `services/token.service.js` | ✅ Completo | Access + Refresh tokens, `roles[]` no payload |
| `services/notificacao.service.js` | ✅ Completo | Socket.io real-time |
| `controllers/auth.controller.js` | ✅ Completo | Login, logout, refresh, primeiro_acesso, perfil |
| `controllers/usuarios.controller.js` | ✅ Completo | CRUD + `roles_extra` (multi-perfil) + `alterarSenha` |
| `controllers/solicitacoes.controller.js` | ✅ Completo | gerencia substituiu logistica em TRANSICOES_PERMITIDAS; timestamps separação automáticos ao mudar status; `proposta_recusada` na tabela de transições; `rankingEstoquistas`, `evolucao`, `minhasEstatisticas` adicionados |
| `controllers/agendamentos.controller.js` | ✅ Completo | Criar, listar, buscar por solicitação |
| `controllers/entregas.controller.js` | ✅ Completo | Motorista, histórico, criar, confirmar |
| `controllers/propostas.controller.js` | ✅ Completo | Recusa → `proposta_recusada` (não mais `material_separado`); permite re-proposta em `proposta_recusada` |
| `routes/solicitacoes.routes.js` | ✅ Completo | `proposta_recusada` nos STATUS_VALIDOS, gerencia em TODOS_ROLES |
| `routes/agendamentos.routes.js` | ✅ Completo | gerencia substituiu logistica |
| `routes/entregas.routes.js` | ✅ Completo | gerencia substituiu logistica |
| `routes/propostas.routes.js` | ✅ Completo | gerencia substituiu logistica |
| `routes/usuarios.routes.js` | ✅ Completo | gerencia pode PUT + `restringirEdicaoGerencia` middleware |
| `config/permissions.js` | ✅ Completo | gerencia com permissões combinadas, ROLES_VALIDOS sem logistica |
| `index.js` | ✅ Completo | Rate limiting (auth: 20req/15min, API: 200req/min — skip em development) |
| `.env.example` | ✅ Completo | Todas as variáveis documentadas |

### Frontend (`/frontend/src/`)

#### Autenticação & Layout
| Arquivo | Status |
|---|---|
| `context/AuthContext.jsx` | ✅ `eGerencia`, `podeEditarUsuarios`, `atualizarUsuario` (inclui foto_perfil) |
| `components/layout/Sidebar.jsx` | ✅ Menu `gerencia` com acesso completo (solicitações, fila, agendamentos, relatórios, usuários) |
| `components/layout/Header.jsx` | ✅ |
| `components/layout/LayoutPrincipal.jsx` | ✅ |
| `pages/login/Login.jsx` | ✅ |
| `pages/login/PrimeiroAcesso.jsx` | ✅ Troca de senha obrigatória no 1º acesso |
| `App.jsx` | ✅ ROLES_ADMIN inclui gerencia; agendamentos e relatórios apontam para gerencia |

#### Páginas
| Rota | Arquivo | Status |
|---|---|---|
| `/dashboard` | `Dashboard.jsx` → roteador por role | ✅ gerencia → DashboardGerencia |
| `/dashboard` (super_admin) | `DashboardCoordenador.jsx` | ✅ Gráfico SVG semanal + ranking estoquistas + badge Audit Log (Sprint 7) |
| `/dashboard` (gerencia) | `DashboardGerencia.jsx` | ✅ Separação + entrega + alertas urgentes + gráfico SVG evolução + top-5 estoquistas + ações rápidas (Sprint 8) |
| `/dashboard` (adm) | `DashboardAdmGalpao.jsx` | ✅ Dados reais, urgentes, atividade recente + Minha Performance (Sprint 11) |
| `/dashboard` (vendedor) | `DashboardVendedor.jsx` | ✅ + bloco Minha Performance (taxa conclusão) + refresh (Sprint 11) |
| `/dashboard` (estoquista) | `DashboardEstoquista.jsx` | ✅ + bloco Minha Performance (tempo médio, % meta) (Sprint 9) |
| `/dashboard` (almoxarife) | `DashboardAlmoxarife.jsx` | ✅ + bloco Minha Performance (tempo médio, % meta) (Sprint 9) |
| `/dashboard` (fiscal) | `DashboardEmissorNF.jsx` | ✅ |
| `/dashboard` (motorista) | `DashboardMotorista.jsx` | ✅ |
| `/solicitacoes` | `ListaSolicitacoes.jsx` | ✅ gerencia vê todas · filtros de período · botão Buscar + paginação 20/pág (Sprint 10/12) |
| `/solicitacoes/nova` | `NovaSolicitacao.jsx` | ✅ |
| `/solicitacoes/:id` | `DetalheSolicitacao.jsx` | ✅ gerencia pode aprovar/recusar proposta; vendedor pode re-sugerir em `proposta_recusada`; bloco de métricas de separação (Sprint 4) |
| `/fila` | `FilaSeparacao.jsx` | ✅ Fila priorizada, 2 abas · ações inline, cronômetro, foto obrigatória · auto-refresh 30s (Sprint 6) |
| `/agendamentos` | `Agendamentos.jsx` | ✅ + aba Calendário mensal com dias clicáveis (Sprint 7) |
| `/motorista` | `Motorista.jsx` | ✅ |
| `/historico` | `Historico.jsx` | ✅ Exportar CSV + botão Buscar explícito (filtrosRef+gatilho+Enter) (Sprint 10) |
| `/relatorios` | `Relatorios.jsx` | ✅ KPIs, barras, tops + filtro por período + exportar CSV |
| `/perfil` | `Perfil.jsx` | ✅ Dados do usuário + estatísticas pessoais + troca de senha + upload foto de perfil (Sprint 10) |
| `/usuarios` | `Usuarios.jsx` + `ModalUsuario.jsx` | ✅ CRUD + multi-perfil checkboxes + mini avatar foto/iniciais na tabela (Sprint 12) |
| `/audit` | `AuditLog.jsx` | ✅ historico_acoes: resumo + gráfico 7 dias + tabela paginada + filtros + CSV · acesso: super_admin + gerencia (Sprint 9) |
| `/notificacoes` | `Notificacoes.jsx` | ✅ **NOVA** — lista paginada, filtros lidas/não-lidas, marcar lidas, navegar para solicitação (Sprint 9) |
| `utils/constantes.js` | ✅ `gerencia` em LABELS_ROLE, `proposta_recusada` em STATUS/LABELS/ORDEM, ROLES_DESKTOP atualizado |

#### Componentes de suporte
| Componente | Status |
|---|---|
| `BadgeStatus`, `BadgePrioridade` | ✅ |
| `CardSolicitacao` | ✅ |
| `Spinner`, `Toast`, `Logo` | ✅ |
| `SinoNotificacoes` | ✅ Socket.io real-time + auto-marcar lida após 4s |
| `NotificacoesContext` | ✅ Badge dinâmico no `document.title` com contador de não lidas (Sprint 7) |

---

## 🔴 O QUE AINDA FALTA / PRÓXIMOS SPRINTS

### 🚀 Para fazer o deploy agora (você executa no servidor)

Veja o arquivo **DEPLOY.md** na raiz do projeto — tem o passo a passo completo.

**Resumo rápido (5 passos):**
1. Instale Node.js 18+ e PM2 (`npm install -g pm2`)
2. `cd backend && cp .env.example .env` — edite as chaves JWT
3. `cd backend && npm run migrate && npm run seed` (apenas 1x para banco vazio)
4. Edite `frontend/.env.production` com o IP do servidor, depois `cd frontend && npm run build`
5. `pm2 start ecosystem.config.js --env production && pm2 save && pm2 startup`

**Backup diário do banco:**
```bash
# Manual: cd backend && npm run backup
# Automático — Linux (crontab -e):
0 2 * * * cd /caminho/do/projeto/backend && npm run backup >> logs/backup.log 2>&1
```

### O que ainda pode ser aprimorado
- [ ] **Smoke test com usuários reais** — testar todos os fluxos com a equipe da loja
- [ ] **HTTPS / acesso externo** — se precisar acessar de fora da rede da loja (Railway, Render ou domínio próprio)
- [ ] **PostgreSQL** — se o volume de dados crescer muito (SQLite aguenta bem até ~50k registros/dia)
- [ ] **Testes automatizados** — ainda não há nenhum

---

## 🗂️ ESTRUTURA DE PASTAS

```
projeto-separacao/
├── backend/
│   ├── src/
│   │   ├── config/permissions.js       ← RBAC: gerencia (sem logistica)
│   │   ├── controllers/  (auth, usuarios, solicitacoes, agendamentos, entregas, propostas)
│   │   ├── database/     (db.js, migrations.js, seeds.js)
│   │   ├── middleware/   (autenticar, autorizar, upload, validar)
│   │   ├── routes/       (auth, usuarios, solicitacoes, agendamentos, entregas, notificacoes, propostas)
│   │   ├── services/     (token.service, notificacao.service)
│   │   └── index.js      ← rate limiting
│   ├── .env.example      ← todas as variáveis documentadas
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── components/   (layout, solicitacoes, notificacoes, ui)
    │   ├── context/      (AuthContext, NotificacoesContext)
    │   ├── hooks/        (useToast)
    │   ├── pages/
    │   │   ├── dashboard/  ← DashboardGerencia.jsx NOVO
    │   │   ├── solicitacoes/
    │   │   ├── fila/
    │   │   ├── agendamentos/
    │   │   ├── motorista/
    │   │   ├── historico/
    │   │   ├── relatorios/
    │   │   ├── perfil/
    │   │   └── usuarios/
    │   ├── services/     (api.js, socket.js)
    │   └── utils/        (constantes.js ← gerencia + proposta_recusada, formatters.js)
    └── package.json
```

---

## 🔑 CREDENCIAIS DE TESTE (seeds)

> Senha padrão de todos: `Correntes2589@` (troca obrigatória no 1º login)

| Login | Role | Setor | Observações |
|---|---|---|---|
| `rodrigo` | `super_admin` | ambos | Sem troca de senha |
| `matheus` | `gerencia` | ambos | Acesso combinado — SEM super_admin |
| `vinicius` | `almoxarife` | ambos | |
| `juliana` | `adm` | ambos | Troca obrigatória |
| `julio` | `adm` | ambos | |
| `caio` | `adm` | ambos | |
| `alana` | `fiscal` | ambos | |
| `antonio` | `motorista` | ambos | |
| `alex` / `kleison` / `gavina` | `vendedor` | ambos | Troca obrigatória |
| `thiago` / `gabriel` / `wanderson` | `estoquista` | galpao | Troca obrigatória |
| `lucas` / `mgentile` / `joao` | `estoquista` | loja | Troca obrigatória |

---

## ⚠️ ATENÇÃO — Banco existente (separacao.db)

Se o banco já existe com usuários `role='logistica'`, rodar `npm run migrate` vai:
1. Detectar o CHECK constraint antigo (com `'logistica'`)
2. Recriar a tabela `users` com `'gerencia'` no lugar
3. Converter todos `role='logistica'` → `role='gerencia'`
4. Atualizar `roles_extra` que contenham `"logistica"` → `"gerencia"`

Se preferir atualização manual: `UPDATE users SET role='gerencia' WHERE role='logistica';`

---

## 📝 PROMPT DE RETOMADA — Cole na próxima sessão

```
Continue o desenvolvimento do projeto "Sistema de Separação de Estoque" 
(Casa das Correntes Guanabara). Leia primeiro o arquivo PROGRESSO.md 
na raiz de /projeto-separacao/ para entender o estado atual.

Caminho do projeto: Documents/projeto-separacao/
Stack: React 18 + Vite 5 + TailwindCSS 3 (frontend) / Node.js + Express + SQLite (backend)
Build: cd frontend && npx vite build --outDir /tmp/vite-dist

Prioridade 1: verificar os itens marcados com [ ] na seção "O QUE AINDA FALTA"
Prioridade 2: executar o build para confirmar zero erros
Prioridade 3: qualquer melhoria de UX/funcionalidade identificada

Ao terminar cada sessão, atualize o PROGRESSO.md com o que foi feito.
```

---

## 🛠️ COMANDOS ÚTEIS

```bash
# Backend
cd backend && npm start           # inicia servidor (porta 3001)
cd backend && npm run migrate     # roda migrations (aplica logistica→gerencia, proposta_recusada, timestamps)
cd backend && npm run seed        # popula usuários de teste (só funciona em banco vazio)

# Frontend
cd frontend && npm run dev        # dev server (porta 5173)
cd frontend && npx vite build --outDir /tmp/vite-dist  # build de produção
```
