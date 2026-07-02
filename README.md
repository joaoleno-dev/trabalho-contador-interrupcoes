# Contador de Interrupções

Extensão de navegador (Chrome-based e Firefox-based) para **registrar e medir interrupções no trabalho de programadores**, com foco especial nas interrupções causadas pela **chefia imediata**.

> Quase tudo sobre interrupções é invisível e não medido. Empresas medem entregas, story points e horas — mas ninguém mede quantas vezes um desenvolvedor foi interrompido nem quanto isso custou. Este projeto transforma um custo difuso e anedótico ("sinto que não rendo") em dado concreto ("fui interrompido 14 vezes hoje, ~5h de custo estimado de retomada").

O plano técnico completo está em [PLANO-IMPLEMENTACAO.md](PLANO-IMPLEMENTACAO.md).

---

## A motivação: por que interrupções são especialmente danosas para programadores

### 1. O custo do "context switch" mental

Programar exige manter um modelo mental complexo na cabeça: a estrutura do código, o estado das variáveis, o fluxo sendo depurado, as hipóteses em teste. Esse modelo não fica salvo em lugar nenhum — existe só na memória de trabalho. Uma interrupção de 30 segundos pode destruir algo que levou 20 minutos para construir. A analogia clássica: é como derrubar um castelo de cartas quase pronto.

### 2. O tempo de retomada é muito maior que a interrupção

A pesquisa de Gloria Mark (UC Irvine) mediu em média **~23 minutos** para retornar plenamente à tarefa original após uma interrupção [[1]](#referências). Estudos específicos com desenvolvedores (Parnin & Rugaber, analisando dados de uso do Visual Studio) mostraram que, após uma interrupção, o programador leva **10–15 minutos** só para voltar a editar código, e que em apenas ~10% das vezes retoma o trabalho em menos de um minuto [[2]](#referências). Ou seja: 5 interrupções "rapidinhas" por dia podem custar 1–2 horas de produtividade real.

### 3. Interrupções não se somam, se multiplicam

Um dia de 8 horas fragmentado em blocos de 30 minutos não equivale a 8 horas de trabalho — tarefas complexas (arquitetura, debugging difícil, refatoração) simplesmente *não cabem* em blocos pequenos [[3]](#referências). O programador acaba preenchendo o dia com tarefas rasas e adiando as importantes, o que gera a sensação de "trabalhei o dia todo e não produzi nada" [[4]](#referências).

### 4. Mais bugs

Retomar código no meio de um raciocínio interrompido aumenta a chance de erro: a pessoa acha que lembra onde estava, mas o modelo mental reconstruído é incompleto. Estudos sobre retomada de tarefas de programação mostram que editar código logo após uma retomada de contexto eleva a probabilidade de introduzir defeitos [[2]](#referências)[[5]](#referências).

### 5. Custo emocional e esgotamento

Trabalho interrompido é compensado com mais pressa: as pessoas trabalham mais rápido para recuperar o tempo, ao custo de mais estresse, frustração e pressão percebida [[1]](#referências). No longo prazo, isso alimenta burnout — e programadores frequentemente citam "não consigo me concentrar no escritório" como motivo para trabalhar à noite ou preferir trabalho remoto [[6]](#referências).

### 6. O problema do estado de "flow"

O estado de concentração profunda (Csikszentmihalyi) leva em torno de 15–25 minutos para ser atingido [[7]](#referências). Em um ambiente onde chega uma mensagem de Slack/Teams a cada 10 minutos, o programador literalmente nunca entra em flow — passa o dia inteiro em concentração superficial [[6]](#referências).

### Fontes típicas de interrupção em ambientes de TI

- **Mensageria corporativa** (Slack, Teams) com expectativa cultural de resposta imediata;
- **Reuniões espalhadas** pelo dia, que picotam a agenda — uma reunião às 14h "mata" o bloco das 13h30 às 14h, porque não vale a pena começar nada;
- **Interrupções presenciais** ("só uma perguntinha rápida") — as mais custosas, porque são síncronas e impossíveis de adiar;
- **Notificações** de e-mail, CI/CD, alertas de monitoramento;
- **Auto-interrupções**: depois de um dia fragmentado, o próprio cérebro se acostuma e passa a se interromper sozinho a cada poucos minutos [[8]](#referências).

---

## O caso especial: interrupções da chefia imediata

As interrupções vindas do gestor imediato são, em vários aspectos, as mais danosas de todas — e por isso são o **foco principal** deste projeto.

### Por que a interrupção do chefe é pior que as outras

**1. Ela não pode ser recusada nem adiada.** Uma mensagem de colega pode esperar; uma notificação pode ser silenciada. Mas quando o gestor imediato interrompe — na mesa, por chamada ou com "tem 5 minutinhos?" — existe uma assimetria de poder que obriga resposta imediata. O programador perde até o mecanismo básico de defesa: escolher *quando* ser interrompido. Interrupções em momento inoportuno (no meio de uma subtarefa, e não na fronteira entre tarefas) custam muito mais [[5]](#referências) — e o chefe interrompe no momento *dele*, não no momento oportuno do desenvolvedor.

**2. Carga cognitiva dupla: a tarefa + a hierarquia.** Além de destruir o modelo mental do código, a interrupção do gestor ativa preocupações sociais: "estou sendo avaliado?", "preciso parecer produtivo". Essa ruminação pós-interrupção prolonga o tempo de retomada além dos ~23 minutos médios, porque a mente continua processando a interação depois que ela terminou.

**3. O padrão "status a qualquer hora" cria vigilância permanente.** Quando o chefe pede status fora de rito ("e aí, como tá aquilo?"), o dano não é só a interrupção em si — é a **antecipação** dela. O desenvolvedor passa a trabalhar em estado de alerta, evitando mergulhar fundo porque "posso ser chamado a qualquer momento". Mesmo sem nenhuma interrupção naquele dia, a *possibilidade* constante já impede a concentração profunda — efeito análogo ao documentado para a mera presença do celular na mesa, que degrada a capacidade cognitiva disponível [[9]](#referências).

**4. Interrupções gerenciais frequentemente trocam a tarefa, não só a pausam.** O colega pergunta e vai embora; o chefe interrompe e muitas vezes **reprioriza**: "deixa isso, olha aquele bug do cliente X primeiro". Isso transforma interrupção em *task switching* completo — o custo não é só retomar, é abandonar contexto, construir outro do zero e depois reconstruir o primeiro [[3]](#referências)[[8]](#referências). Com repriorizações frequentes, acumula-se trabalho 80% pronto e nada entregue.

**5. Sinal de desconfiança → queda de motivação e autonomia.** Microgerenciamento por interrupção comunica, mesmo sem intenção: "não confio que você esteja trabalhando". Isso corrói a autonomia — que, junto com maestria e propósito, é um dos pilares da motivação intrínseca (teoria da autodeterminação, Deci & Ryan [[10]](#referências); popularizada por Daniel Pink [[11]](#referências)). Baixa autonomia percebida prediz menor engajamento e maior intenção de sair da empresa — e turnover em TI é caríssimo.

**6. Efeito cascata na equipe.** O comportamento da chefia define a norma cultural. Se o gestor interrompe livremente, os pares se sentem autorizados a fazer o mesmo, e a equipe inteira perde a noção de que foco é um recurso a proteger.

**7. A ironia da produtividade: o chefe interrompe para acelerar e consegue atrasar.** Cada pedido de status *atrasa o andamento* que ele quer acompanhar. O ensaio "Maker's Schedule, Manager's Schedule" de Paul Graham descreve exatamente esse conflito: o gestor opera em blocos de 30–60 minutos e não percebe que, para quem faz, uma reunião ou interrupção no meio da tarde custa a tarde inteira [[12]](#referências).

### Resumo dos malefícios específicos da chefia imediata

| Malefício | Mecanismo |
|---|---|
| Retomada mais lenta que interrupções comuns | Ruminação social pós-interação com figura de autoridade |
| Impossibilidade de defesa | Assimetria de poder impede adiar ou recusar |
| Estado de vigilância constante | Antecipação da interrupção já impede o flow |
| Multitarefa forçada | Repriorizações geram trabalho 80% pronto acumulado |
| Queda de motivação e autonomia | Interrupção frequente sinaliza desconfiança |
| Cultura de interrupção no time | Gestor define a norma que os pares copiam |
| Turnover | Perda de autonomia é forte preditor de saída em TI |

---

## Da discussão para a ferramenta

As conclusões acima moldaram diretamente o desenho da extensão:

- **Um CTA único e imediato** — no momento em que a interrupção acontece, o desenvolvedor aperta um botão que pausa todo áudio/vídeo do navegador, inicia um cronômetro e cria o registro. Registrar não pode custar atenção: a interrupção já custou o suficiente.
- **Retomada manual** — só o próprio desenvolvedor sabe quando de fato voltou ao trabalho; o cronômetro mede o tempo real da interrupção, não uma estimativa.
- **Pré-classificação como `chefia`** — a origem prioritária do projeto é o caso mais frequente e mais custoso; as demais categorias (`colega`, `reuniao`, `mensagem`, `pessoal`, `outro`) ficam num fluxo secundário de reclassificação no detalhe do dia.
- **Custo estimado de retomada** — o relatório do dia multiplica as interrupções pelos ~23 minutos da literatura [[1]](#referências). Mostrar ao próprio gestor que 40% das interrupções do time vêm dele, com custo estimado em horas, é o tipo de dado que muda comportamento sem virar confronto pessoal.

## Referências

1. **Mark, G., Gudith, D., & Klocke, U. (2008).** *The Cost of Interrupted Work: More Speed and Stress.* Proceedings of CHI 2008. ACM. — Estudo que mediu o tempo médio de ~23 minutos para retomada plena e o aumento de estresse e pressa como compensação. https://www.ics.uci.edu/~gmark/chi08-mark.pdf
2. **Parnin, C., & Rugaber, S. (2011).** *Resumption strategies for interrupted programming tasks.* Software Quality Journal, 19(1). — Análise de dados reais de programadores no Visual Studio: 10–15 min para voltar a editar código; só ~10% das retomadas em menos de 1 minuto.
3. **Czerwinski, M., Horvitz, E., & Wilhite, S. (2004).** *A Diary Study of Task Switching and Interruptions.* Proceedings of CHI 2004. ACM (Microsoft Research). — Fragmentação do trabalho e dificuldade de retomar tarefas complexas após trocas de contexto.
4. **Meyer, A. N., Fritz, T., Murphy, G. C., & Zimmermann, T. (2014).** *Software Developers' Perceptions of Productivity.* Proceedings of FSE 2014. ACM. — Desenvolvedores associam dias produtivos a poucas trocas de contexto e poucas interrupções.
5. **Iqbal, S. T., & Horvitz, E. (2007).** *Disruption and Recovery of Computing Tasks: Field Study, Analysis, and Directions.* Proceedings of CHI 2007. ACM (Microsoft Research). — Custo de recuperação de tarefas interrompidas e o efeito do momento da interrupção.
6. **DeMarco, T., & Lister, T. (2013).** *Peopleware: Productive Projects and Teams* (3ª ed.). Addison-Wesley. — Clássico sobre ambiente de trabalho em engenharia de software; conceito de flow aplicado a programadores e o custo do escritório interruptivo.
7. **Csikszentmihalyi, M. (1990).** *Flow: The Psychology of Optimal Experience.* Harper & Row. — Base teórica do estado de concentração profunda.
8. **Mark, G., González, V. M., & Harris, J. (2005).** *No Task Left Behind? Examining the Nature of Fragmented Work.* Proceedings of CHI 2005. ACM. — Fragmentação do trabalho de conhecimento e o fenômeno das auto-interrupções em ambientes já fragmentados.
9. **Ward, A. F., Duke, K., Gneezy, A., & Bos, M. W. (2017).** *Brain Drain: The Mere Presence of One's Own Smartphone Reduces Available Cognitive Capacity.* Journal of the Association for Consumer Research, 2(2). — A mera possibilidade de demanda já consome capacidade cognitiva, mesmo sem interrupção efetiva.
10. **Ryan, R. M., & Deci, E. L. (2000).** *Self-Determination Theory and the Facilitation of Intrinsic Motivation, Social Development, and Well-Being.* American Psychologist, 55(1). — Autonomia como pilar da motivação intrínseca.
11. **Pink, D. H. (2009).** *Drive: The Surprising Truth About What Motivates Us.* Riverhead Books. — Popularização de autonomia, maestria e propósito como motores de motivação no trabalho criativo.
12. **Graham, P. (2009).** *Maker's Schedule, Manager's Schedule.* — Ensaio sobre o conflito estrutural entre a agenda de quem gerencia e a de quem produz. http://www.paulgraham.com/makersschedule.html

---

*Projeto acadêmico — trabalho sobre contagem e medição de interrupções no ambiente de trabalho de TI.*
