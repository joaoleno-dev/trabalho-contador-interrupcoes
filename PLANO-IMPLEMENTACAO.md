# Contador de Interrupções — Plano de Implementação

Extensão de navegador (Chrome-based e Firefox-based) para registrar interrupções no trabalho de programadores, com foco em interrupções causadas pela **chefia imediata**.

## 1. Contexto e motivação

Interrupções destroem o modelo mental do programador e custam em média ~23 minutos de retomada cada (Gloria Mark, UC Irvine; Parnin & Rugaber). As interrupções da chefia imediata são as mais custosas: não podem ser recusadas, frequentemente repriorizam a tarefa e geram estado de vigilância constante. O problema é invisível porque ninguém o mede — esta extensão transforma o custo difuso em dado concreto.

## 2. Requisitos funcionais

| # | Requisito | Prioridade |
|---|-----------|------------|
| RF1 | Contador central de interrupções do dia, visível no popup e no badge do ícone | Alta |
| RF2 | CTA único de interrupção: ao apertar, (a) pausa todo áudio/vídeo tocando no navegador, (b) inicia um cronômetro, (c) cria um novo registro no dia | Alta |
| RF3 | A retomada é **manual**: o usuário aperta o CTA novamente para encerrar o cronômetro e voltar ao estado "focado" | Alta |
| RF4 | Todo registro nasce pré-classificado como **`chefia`** | Alta |
| RF5 | Tela de detalhe do dia: lista das interrupções (hora início, duração) com reclassificação por categoria | Alta |
| RF6 | Categorias secundárias: `colega`, `reuniao`, `mensagem`, `pessoal`, `outro` (fluxo secundário, só via detalhe) | Média |
| RF7 | Métricas do dia: total de interrupções, tempo total interrompido, custo estimado de retomada (n × 23 min) | Média |
| RF8 | Virada de dia: a interrupção pertence ao dia em que **começou**; o contador zera à meia-noite | Média |
| RF9 | Histórico de dias anteriores + exportação (CSV/JSON) | Baixa (futuro) |

**Regras de negócio:**
- Só existe **uma** interrupção aberta por vez. O CTA é um toggle: estado `focado` → "Fui interrompido"; estado `interrompido` → "Retomar trabalho".
- O áudio/vídeo pausado **não** é retomado automaticamente ao voltar — retomar mídia é decisão do usuário.
- Cronômetro baseado em **timestamps** (`startedAt`/`endedAt`), nunca em acumulador com `setInterval` — precisa sobreviver ao fechamento do popup e à morte do service worker.

## 3. Requisitos não funcionais

- **Cross-browser**: Manifest V3, um só código-fonte, manifests gerados por target no build (Chrome usa `background.service_worker`; Firefox usa `background.scripts` como event page + chave `browser_specific_settings.gecko`).
- **`webextension-polyfill`** para API `browser.*` com Promises nos dois navegadores.
- **TypeScript** + bundler leve (esbuild ou Vite). Sem framework de UI — popup em HTML/CSS/TS vanilla (o popup tem 2 telas simples; framework é peso desnecessário).
- Persistência em `browser.storage.local`. Nada de backend — dados 100% locais e privados.
- Teste no Firefox via `web-ext run`; no Chrome via "Load unpacked".

## 4. Arquitetura

```
src/
├── manifest.base.json        # base comum; build gera manifest por target
├── background/
│   └── index.ts              # service worker / event page: estado, badge, pausa de mídia
├── popup/
│   ├── popup.html
│   ├── popup.ts              # tela principal (contador + CTA) e tela detalhe do dia
│   └── popup.css
├── lib/
│   ├── storage.ts            # camada de acesso a storage.local (get/set tipados)
│   ├── state.ts              # máquina de estados focado/interrompido
│   ├── media.ts              # lógica de pausar mídia em todas as abas
│   └── time.ts               # helpers de data (chave YYYY-MM-DD local, formatação de duração)
scripts/
└── build.mjs                 # esbuild + geração de manifest chrome/firefox em dist/
```

**Divisão de responsabilidades:** o popup é só view — toda mutação de estado (iniciar/encerrar interrupção, pausar mídia, badge) acontece no **background** via `runtime.sendMessage`. Motivo: o popup pode fechar a qualquer momento; o background é a única fonte de verdade.

**Pausa de mídia (RF2a):** no CTA, o background:
1. `tabs.query({})` → para cada aba, `scripting.executeScript({ target: { tabId, allFrames: true }, func: pauseAllMedia })`, onde `pauseAllMedia` faz `document.querySelectorAll('video, audio')` e chama `.pause()` nos que não estão pausados.
2. Fallback para áudio não-pausável por elemento (Web Audio API, ex.: alguns players): `tabs.query({ audible: true })` e `tabs.update(tabId, { muted: true })` nas abas que continuarem audíveis após o passo 1.
3. Falhas por aba (páginas privilegiadas `chrome://`, `about:`, loja de extensões) são engolidas silenciosamente — não podem impedir o registro da interrupção.

**Permissões:** `storage`, `scripting`, `tabs`, e `host_permissions: ["<all_urls>"]` (necessário para injetar o pause em qualquer aba).

**Badge:** número de interrupções do dia. Fundo neutro quando focado; **vermelho** enquanto interrompido (feedback de estado sem abrir o popup).

## 5. Modelo de dados (`storage.local`)

```ts
type Category = 'chefia' | 'colega' | 'reuniao' | 'mensagem' | 'pessoal' | 'outro';

interface Interruption {
  id: string;            // crypto.randomUUID()
  startedAt: number;     // epoch ms
  endedAt: number | null;// null = em andamento
  category: Category;    // default: 'chefia' (RF4)
  note?: string;
}

interface DayRecord {
  date: string;              // 'YYYY-MM-DD' no fuso local
  interruptions: Interruption[];
}

// Chaves no storage:
// 'day:<YYYY-MM-DD>' -> DayRecord
// 'activeInterruption' -> { date: string, id: string } | null
```

## 6. Máquina de estados

```
        CTA "Fui interrompido"
FOCADO ─────────────────────────► INTERROMPIDO
  ▲     • pausa mídia (todas as abas)    │
  │     • cria Interruption              │
  │       (category:'chefia')            │
  │     • badge vermelho                 │
  └──────────────────────────────────────┘
        CTA "Retomar trabalho"
        • endedAt = Date.now()
        • activeInterruption = null
        • badge neutro, count atualizado
```

**Casos de borda:**
- **Interrupção aberta na virada do dia:** registro permanece no dia de início; o contador do novo dia começa em 0, mas o estado `interrompido` persiste até o usuário retomar.
- **Navegador fechado com interrupção aberta:** em `runtime.onStartup`, se `activeInterruption` existe e `startedAt` > 4h atrás, encerrar automaticamente com `endedAt = startedAt + 4h` e marcar `note: 'encerrada automaticamente'`. Se < 4h, manter aberta (pode ter sido só restart).
- **Service worker morto (Chrome MV3):** irrelevante por design — estado inteiro em `storage.local`, cronômetro por timestamp; o popup recalcula o tempo decorrido a cada abertura e atualiza a tela com `setInterval` local apenas para exibição.
- **Dois popups/janelas:** o background serializa as mutações; o toggle verifica o estado atual antes de agir (aperto duplo não cria registro duplicado).

## 7. UI do popup

**Tela 1 — Principal (home):**
- Contador grande: "N interrupções hoje" + tempo total interrompido.
- CTA gigante (o elemento dominante do popup):
  - Estado focado: botão vermelho **"🖐 FUI INTERROMPIDO"**.
  - Estado interrompido: cronômetro correndo (mm:ss) + botão verde **"▶ RETOMAR TRABALHO"**.
- Link "Ver detalhes do dia →".

**Tela 2 — Detalhe do dia:**
- Lista das interrupções: hora de início, duração, chip da categoria.
- Clicar no chip abre seletor das 6 categorias (reclassificação — RF5/RF6).
- Rodapé com métricas: total, tempo interrompido, custo estimado de retomada (n × 23 min) com nota explicando a referência.
- Interrupção em andamento aparece no topo com cronômetro vivo.

## 8. Fases de implementação

**Fase 1 — Scaffolding e build cross-browser**
Estrutura de pastas, TypeScript, esbuild, `manifest.base.json` + script que gera `dist/chrome/` e `dist/firefox/`. Popup "hello world" carregando nos dois navegadores.
✅ *Critério: extensão instala e abre popup no Chrome (unpacked) e no Firefox (`web-ext run`).*

**Fase 2 — Estado e storage**
`lib/storage.ts`, `lib/state.ts`, `lib/time.ts`. Background com handlers de mensagem `startInterruption` / `endInterruption` / `getState`. Badge com contagem.
✅ *Critério: toggle de estado via mensagens persiste após matar o service worker e reiniciar o navegador; badge reflete a contagem.*

**Fase 3 — Popup principal (contador + CTA)**
Tela 1 completa: contador, CTA toggle, cronômetro vivo por timestamp.
✅ *Critério: fluxo interromper → fechar popup → reabrir → cronômetro correto → retomar; contagem incrementa; registro salvo com `category: 'chefia'`.*

**Fase 4 — Pausa de mídia**
`lib/media.ts` + integração no `startInterruption`: pause em todas as abas/frames + mute fallback para abas ainda audíveis.
✅ *Critério: com YouTube tocando em 2 abas e um áudio em iframe, o CTA silencia tudo; abas privilegiadas não geram erro visível.*

**Fase 5 — Detalhe do dia e reclassificação**
Tela 2: lista, chips de categoria, métricas com custo estimado.
✅ *Critério: reclassificar uma interrupção de `chefia` para `colega` persiste após reload; métricas batem com os registros.*

**Fase 6 — Bordas e polimento**
Virada de dia, auto-encerramento de interrupção órfã (>4h), aperto duplo, ícones da extensão, revisão de textos.
✅ *Critério: todos os casos de borda da seção 6 testados manualmente nos dois navegadores.*

**Fase 7 (futuro) — Histórico e exportação**
Página de opções com histórico por dia e export CSV/JSON. Fora do escopo inicial.

## 9. Prompt de arranque

> Implemente a **Fase 1** do plano em `PLANO-IMPLEMENTACAO.md`: scaffolding da extensão cross-browser (Chrome MV3 service worker / Firefox MV3 event page), TypeScript + esbuild, geração de manifests por target em `dist/chrome` e `dist/firefox`, e popup hello-world. Siga a estrutura de pastas da seção 4 e as permissões definidas. Ao final, informe os comandos de build e como carregar a extensão em cada navegador.

Depois, avance fase a fase: "Implemente a Fase N do PLANO-IMPLEMENTACAO.md", validando os critérios de aceite antes de seguir.
