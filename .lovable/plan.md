

# Plano de Implementacao Completo — Fases 3 a 6

## Estado Atual

Ja implementado:
- **Fase 1 (Banco de Dados)**: Todas as tabelas, RLS, triggers, funcoes auxiliares
- **Fase 2 (Auth)**: Login, Cadastro com CPF, Recuperacao de senha, Pagina Minha Conta
- **Frontend basico**: Home, Produto, Categoria, Carrinho (todos com dados mock estaticos)

Tudo ainda usa dados mock de `src/data/store.ts`. O banco existe mas nao esta sendo consumido pelo frontend.

---

## O Que Sera Implementado

Devido ao tamanho, vou dividir em **4 mensagens de implementacao** sequenciais:

### Mensagem 1 — Migrar Frontend para Banco de Dados + Checkout

**Migrar dados mock para consultas reais ao banco:**
- Criar hooks React Query: `useProducts`, `useCategories`, `useProduct(slug)`, `useProductVariants`, `useProductImages`, `useReviews`, `useSiteSettings`
- Reescrever `Index.tsx` para buscar categorias e produtos do banco (com filtro de estoque via join em `product_variants`)
- Reescrever `CategoryPage.tsx` com filtros reais (tamanho, preco, promo) e ordenacao
- Reescrever `ProductPage.tsx` com galeria de imagens do banco, variantes reais, reviews reais, timer regressivo funcional
- Reescrever `ProductCard.tsx` para aceitar dados do banco
- Atualizar `SocialProofPopup.tsx` para usar produtos reais do banco
- Atualizar `Header.tsx` e `Footer.tsx` para categorias do banco
- Atualizar `CartContext.tsx` para trabalhar com IDs do banco
- Atualizar `WhatsAppButton.tsx` para ler numero do `site_settings`

**Checkout completo** (`/checkout`):
- Etapa 1: Login obrigatorio (redirect se nao logado)
- Etapa 2: Selecionar/adicionar endereco
- Etapa 3: Calculo de frete (PAC/SEDEX via edge function)
- Etapa 4: Resumo + selecao de pagamento
- Etapa 5: Confirmacao
- Criar pedido no banco com status `criado`

### Mensagem 2 — Painel Administrativo (Parte 1)

**Estrutura do admin:**
- Layout admin separado (`/admin`) com sidebar e protecao de rota
- **Dashboard**: cards de vendas hoje/mes, ticket medio, produto mais vendido, alertas estoque baixo, pedidos por status (com queries agregadas)
- **Produtos CRUD**: lista com busca/filtros, formulario completo (nome, slug, descricao, categoria, preco, promo, peso, dimensoes, destaque, ativo), upload de imagens para storage bucket, gerenciamento de variantes (tamanhos + estoque)
- **Categorias CRUD**: criar, editar, ativar/desativar, ordenar

### Mensagem 3 — Painel Administrativo (Parte 2)

- **Pedidos**: lista com filtros por status, detalhes do pedido com itens, atualizar status (Criado > Pago > Separando > Enviado > Entregue > Cancelado), inserir codigo de rastreio
- **Estoque**: visao consolidada por categoria/tamanho, alertas de estoque baixo
- **Clientes**: lista com busca, detalhes, CPF visivel para admin
- **Banners**: CRUD com upload de imagem, agendar datas, ordenar
- **Marketing**: configurar popup social proof (intervalos), barra frete gratis (valor), parcelamento, WhatsApp, timer promo
- **Relatorio Financeiro**: faturamento por periodo/categoria, ticket medio, exportar CSV
- **Log de Auditoria**: lista de todas alteracoes registradas automaticamente

### Mensagem 4 — Edge Functions + Integracoes

- **Edge Function de Frete**: calculo com peso/dimensoes usando API Correios (PAC + SEDEX)
- **Integracao Stripe**: habilitar via ferramenta Stripe, criar edge function para checkout (Pix + Cartao), webhook para atualizar status do pedido e baixar estoque
- **Sistema de busca**: campo de busca no header com resultados em tempo real
- **Reviews**: formulario de avaliacao na pagina Minha Conta para pedidos entregues, exibicao na pagina do produto

---

## Detalhes Tecnicos

**Queries ao banco:**
- Produtos serao buscados com joins em `product_variants` (para estoque), `product_images`, `categories`, e `reviews`
- Categorias so aparecem se tiverem produtos com estoque > 0
- Produtos so aparecem se tiverem pelo menos uma variante com estoque > 0

**Admin:**
- Todas as rotas `/admin/*` protegidas via `useAuth().isAdmin`
- Todas as mutacoes de admin geram registro em `admin_logs` automaticamente
- Upload de imagens vai para o bucket `product-images` existente

**Checkout:**
- Edge function para frete retorna opcoes PAC e SEDEX com preco e prazo
- Pedido criado com `address_snapshot` (copia do endereco no momento da compra)
- Stripe para processar pagamento, webhook para confirmar e baixar estoque

**Cart refactor:**
- `CartContext` passa a guardar `productId` (UUID) + `size` + `quantity` ao inves do objeto Product inteiro
- Dados do produto sao buscados do banco na hora de renderizar

---

## Ordem de Execucao

Implementarei na seguinte ordem, uma mensagem por vez:

1. **Hooks + Migracao frontend + Checkout** — tudo conectado ao banco
2. **Admin parte 1** — dashboard, produtos CRUD, categorias
3. **Admin parte 2** — pedidos, estoque, clientes, banners, marketing, relatorios, logs
4. **Edge functions + Stripe + busca + reviews**

Vou comecar agora pela Mensagem 1.

