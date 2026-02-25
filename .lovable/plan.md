

# Plano Completo de Implementacao — Loja E-commerce

## Situacao Atual

O projeto tem o **frontend basico** implementado:
- Home, Produto, Categoria, Carrinho (com dados estaticos/mock)
- Header, Footer, WhatsApp button, Social proof popup
- Carrinho funcional (context local)

**O que falta construir e praticamente todo o backend e funcionalidades avancadas** — sao dezenas de paginas, tabelas, integracoes e logicas.

---

## Pre-requisito Critico: Conectar Supabase

O Supabase **nao esta conectado** ao projeto. Sem ele, nao e possivel implementar banco de dados, autenticacao, edge functions, pagamentos, etc.

**Voce precisa conectar o Supabase primeiro:**
1. Clique na aba **Cloud** no painel lateral direito
2. Ative o Lovable Cloud / Supabase
3. Apos conectar, me avise para comecar a implementacao

---

## Plano de Implementacao em Fases

Devido ao tamanho enorme do escopo, o trabalho sera dividido em **6 fases**, cada uma implementada em mensagens separadas para evitar erros.

### Fase 1 — Banco de Dados (Esquema Completo)

Criacao de todas as tabelas via migracoes:

```text
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│     profiles     │   │   user_roles     │   │    addresses     │
│ id, name, cpf,   │   │ user_id, role    │   │ user_id, cep,    │
│ phone, email     │   │ (enum: admin,    │   │ street, number,  │
│ cpf_locked=true  │   │  user)           │   │ city, state...   │
└──────────────────┘   └──────────────────┘   └──────────────────┘

┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│   categories     │   │    products      │   │ product_variants │
│ name, slug,      │   │ name, slug,      │   │ product_id,      │
│ image, active    │   │ description,     │   │ size, stock      │
│                  │   │ price, promo...  │   │                  │
└──────────────────┘   └──────────────────┘   └──────────────────┘

┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│ product_images   │   │    reviews       │   │     orders       │
│ product_id, url, │   │ user_id,         │   │ user_id, status, │
│ position         │   │ product_id,      │   │ shipping, total, │
│                  │   │ rating, comment  │   │ tracking_code    │
└──────────────────┘   └──────────────────┘   └──────────────────┘

┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│   order_items    │   │   admin_logs     │   │    banners       │
│ order_id,        │   │ admin_id, action │   │ title, image,    │
│ product_id,      │   │ entity, details, │   │ link, active,    │
│ size, qty, price │   │ timestamp        │   │ position, dates  │
└──────────────────┘   └──────────────────┘   └──────────────────┘

┌──────────────────┐
│  site_settings   │
│ key, value       │
│ (frete gratis,   │
│  whatsapp, etc)  │
└──────────────────┘
```

- RLS em todas as tabelas
- Funcao `has_role()` security definer para checar admin
- Trigger para criar profile automaticamente no signup
- Validacao de CPF unico e imutavel

### Fase 2 — Autenticacao e Area do Cliente

- Pagina de **Login** (email + senha)
- Pagina de **Cadastro** com validacao de CPF (algoritmo matematico)
- Pagina de **Recuperacao de Senha** + pagina `/reset-password`
- Pagina **Minha Conta** (`/conta`):
  - Editar nome, telefone, endereco
  - CPF exibido mas bloqueado
  - Historico de pedidos com status e rastreio
  - Avaliar produtos entregues
- Rotas protegidas (redirecionar para login se nao autenticado)
- Atribuir role `admin` ao email master via insert

### Fase 3 — Checkout Completo

- Fluxo em etapas:
  1. Login obrigatorio (redirecionar se nao logado)
  2. Endereco (salvar/selecionar)
  3. Calculo de frete (Edge Function com API Correios — PAC e SEDEX)
  4. Selecao de frete
  5. Pagamento (Pix + Cartao via Stripe)
  6. Confirmacao do pedido
- Criacao do pedido no banco com status "Aguardando pagamento"
- Baixa automatica de estoque apos confirmacao
- Webhook Stripe para atualizar status

### Fase 4 — Painel Administrativo

- Rota `/admin` protegida (somente role admin)
- **Dashboard**: vendas hoje/mes, ticket medio, produto mais vendido, alertas estoque, pedidos por status
- **Produtos CRUD**: criar, editar, ativar/desativar, upload de imagens, variacoes de tamanho/estoque, promo com data final, destaque
- **Pedidos**: lista com filtros, detalhes, atualizar status (Criado → Pago → Separando → Enviado → Entregue → Cancelado), inserir rastreio
- **Estoque**: visao por categoria/tamanho, alertas, historico de movimentacao
- **Clientes**: lista, busca, detalhes, bloquear
- **Banners**: CRUD, agendar, ordenar
- **Marketing**: configurar popup social proof, barra frete gratis, parcelamento, WhatsApp, timer promo
- **Relatorio Financeiro**: faturamento por periodo/categoria, ticket medio, export CSV
- **Log de Auditoria**: registro automatico de todas as alteracoes

### Fase 5 — Melhorias no Frontend

- Migrar dados mock para Supabase (produtos, categorias vem do banco)
- Filtros completos na categoria (tamanho, preco, promo)
- Timer regressivo real na pagina do produto
- Galeria de imagens com zoom
- Sistema de busca
- Reviews visíveis na pagina do produto
- Pop-up social proof com dados reais (produtos com estoque)

### Fase 6 — Integracoes Finais

- Edge Function para calculo de frete Correios (peso + dimensoes)
- Integracao Stripe (Pix + Cartao)
- Notificacoes (email de confirmacao, status, rastreio)
- Otimizacao de imagens e performance

---

## Detalhes Tecnicos

- **Autenticacao**: Supabase Auth com email/senha
- **Roles**: Tabela separada `user_roles` com enum `app_role` e funcao `has_role()` security definer
- **CPF**: Validacao matematica client-side + constraint unique no banco + coluna imutavel via RLS
- **Pagamentos**: Stripe (via integracao Lovable) para Pix e Cartao
- **Frete**: Edge Function chamando API Correios com peso/dimensoes do carrinho
- **Admin**: Verificacao server-side via `has_role(auth.uid(), 'admin')` — nunca client-side

---

## Proximos Passos

Preciso que voce **conecte o Supabase ao projeto** (aba Cloud) para que eu possa comecar pela Fase 1 (criar todas as tabelas). Apos isso, seguimos fase por fase.

