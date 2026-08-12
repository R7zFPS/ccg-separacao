# Nails & More Salon · App de Agendamentos

Aplicativo web de agendamentos para o **Nails & More Salon** (Rio de Janeiro · @nailsandmorerj), com identidade visual e preços transcritos do cardápio oficial do salão.

## O que o app faz

**Para a cliente** (tela inicial → "Agendar horário"):
1. **Serviços** — cardápio completo em 5 categorias (Mãos & Pés, Nail Designer & Alongamento, Embelezamento do Olhar, Spa & Experiência, Hair & Tratamentos), com os preços do menu físico e soma automática do total. Pode escolher mais de um serviço.
2. **Horário** — escolha de unidade (Shopping Tijuca, NorteShopping, Shopping Metropolitano), dia e horário. Horários de shopping (seg–sáb 10h–22h, dom 13h–21h), com bloqueio de horários passados e de horários lotados (3 vagas por meia hora por unidade).
3. **Seus dados** — nome, telefone/WhatsApp (com máscara) e observações.
4. **Pagamento** — quando pagar (**na hora** ou **antecipado**) e forma (**Pix, crédito, débito ou dinheiro** — dinheiro só disponível para pagamento na hora).
5. Confirmação com resumo e botão para enviar o resumo pelo WhatsApp.

**Para o salão** ("Área do salão" no topo, PIN `2016`):
- **Central de Agendamentos** com todos os agendamentos: nome da cliente, telefone (ligação e WhatsApp em um toque), serviços, total, dia/hora/unidade, **quando vai pagar e a forma de pagamento**, observações.
- Indicadores: agendamentos de hoje, próximos, receita prevista do dia e pagamentos em aberto.
- Ações: confirmar, concluir atendimento, marcar como pago, cancelar.
- Filtros por nome/telefone, dia e status + exportação para CSV (abre no Excel).

## Como usar

**App publicado (com banco de dados online):** https://nails-and-more-agenda.netlify.app

O app roda no Netlify com uma API serverless (`netlify/functions/api.mjs`) e banco **Netlify Blobs** — os agendamentos feitos em qualquer celular chegam à Central do salão, que se atualiza sozinha a cada 25 segundos.

### Recursos

- **Agenda inteligente** — duração por serviço; com equipe cadastrada, cada profissional atende uma cliente por vez e a cliente escolhe "com quem"; sem equipe, 3 vagas por meia hora. Bloqueios de horário (folga, feriado) pela central.
- **Combos com desconto** ("Combos & Pacotes" no cardápio — preços sugeridos, ajuste em `app.js`) e **upsell** de adicionais na etapa de pagamento.
- **Fidelidade** — a cada 10 atendimentos concluídos, um brinde; selos aparecem para a cliente e na central.
- **Central com 4 abas** — Agendamentos (com sino + notificação de novo agendamento), Relatórios (faturamento por unidade/profissional, serviços mais pedidos, top clientes, taxa de comparecimento), Equipe e Bloqueios.
- **Pós-atendimento** — botão "Pedir avaliação" (WhatsApp + link do Google) ao concluir.
- **Repetir último atendimento** — a cliente refaz a última reserva em dois toques.
- **PWA** — instalável na tela do celular (manifest + service worker + ícones).

### Rotas da API

| Rota | Método | Acesso | Função |
|---|---|---|---|
| `/api/ping` | GET | público | o front detecta o modo online (e se o Pix está ativo) |
| `/api/contexto?unidade=` | GET | público | equipe da unidade (escolha de profissional) |
| `/api/disponibilidade?data=&unidade=&dur=&profissional=` | GET | público | horários de início livres para a duração pedida |
| `/api/agendamentos` | POST | público | cria agendamento (validação, lotação e atribuição de profissional no servidor) |
| `/api/agendamentos` | GET | PIN (header `x-pin`) | lista completa + selos de fidelidade |
| `/api/agendamentos/:id` | PATCH | PIN | atualiza status e/ou pagamento |
| `/api/equipe` | GET/PUT | PIN | profissionais |
| `/api/bloqueios` | GET/PUT | PIN | bloqueios de agenda |
| `/api/webhooks/mercadopago` | POST | webhook | confirma Pix pago automaticamente |

O PIN da central é validado no servidor — padrão `2016`, trocável pela variável de ambiente `ADMIN_PIN` no painel do Netlify (sem mexer no código).

### Integrações que ligam sozinhas (variáveis de ambiente no painel do Netlify)

- **Pix na tela (Mercado Pago)** — defina `MP_ACCESS_TOKEN` (token de produção da conta Mercado Pago do salão). Quem escolher "pagar antes + Pix" recebe QR Code e copia-e-cola na confirmação; o webhook `/api/webhooks/mercadopago` (cadastre a URL nas notificações do Mercado Pago) marca o pagamento como recebido sozinho.
- **Lembrete automático de WhatsApp** — defina `ZAPI_SEND_TEXT_URL` e `ZAPI_CLIENT_TOKEN` (conta Z-API). Todo dia às 9h (Brasília) a função `lembretes` avisa as clientes do dia seguinte ("responda SIM para confirmar"). Sem as variáveis, nada é enviado.

### Rodar/publicar de novo

- **Local (demo):** abra `index.html` no navegador — sem API o app cai automaticamente no modo local (localStorage), útil para testar o fluxo.
- **Deploy:** `npx netlify-cli deploy --prod` dentro de `nails-and-more/` (site `nails-and-more-agenda`), ou conecte a pasta ao Netlify pelo painel.

## Identidade visual

Derivada do cardápio físico e da marca do salão: vinho profundo (`#6B2544`) sobre creme rosado (`#FAF3F2`), mandala/flor de lótus no logo, títulos serifados (Marcellus/Cormorant) e corpo arredondado (Quicksand), cartões de cantos amplos com borda fina e linhas pontilhadas entre serviço e preço — como no menu impresso.
