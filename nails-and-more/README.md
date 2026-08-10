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

É um app estático — não precisa de servidor nem instalação:

- **Testar agora:** abra `index.html` no navegador.
- **Publicar:** suba a pasta `nails-and-more/` em qualquer hospedagem estática (Netlify, Vercel, GitHub Pages, Render Static Site).

## Onde ficam os dados

Os agendamentos ficam salvos no navegador (localStorage). Isso significa que a central mostra os agendamentos feitos **no mesmo navegador/dispositivo** — ideal para testar o fluxo e para uso em um tablet/computador único na recepção.

Para que os agendamentos feitos no celular das clientes cheguem à central do salão em tempo real, o próximo passo é ligar o app a um backend (por exemplo o mesmo padrão Node + SQLite já usado neste repositório, ou Firebase/Supabase). A estrutura de dados já está pronta para isso (`app.js`, objeto `agendamento`).

## Identidade visual

Derivada do cardápio físico e da marca do salão: vinho profundo (`#6B2544`) sobre creme rosado (`#FAF3F2`), mandala/flor de lótus no logo, títulos serifados (Marcellus/Cormorant) e corpo arredondado (Quicksand), cartões de cantos amplos com borda fina e linhas pontilhadas entre serviço e preço — como no menu impresso.
