

## Plano: Carrossel de Banners com Gestao Admin

### 1. Criar tabela `carousel_slides` no banco de dados
- Campos: `id`, `image_url`, `link`, `position` (1-3), `active`, `created_at`, `updated_at`
- Maximo 3 registros
- RLS: leitura publica, gestao apenas admin

### 2. Criar pagina admin "Design do Site" (`src/pages/admin/AdminDesign.tsx`)
- Secao "Carrossel da Pagina Inicial"
- Upload de ate 3 imagens (1920x560) para o bucket `product-images`
- Preview das imagens com opcao de substituir/remover
- Botao "Salvar alteracoes"
- Apenas admin tem acesso

### 3. Adicionar rota e menu
- Nova rota `/admin/design` no `App.tsx`
- Novo item "Design do Site" no `AdminSidebar.tsx` (icone `Palette`)
- Importar e registrar `AdminDesign`

### 4. Criar componente `HeroCarousel` (`src/components/HeroCarousel.tsx`)
- Usa Embla Carousel (ja instalado)
- Busca slides da tabela `carousel_slides`
- Autoplay a cada 5 segundos
- Setas laterais e indicadores (dots)
- Responsivo com aspect ratio adequado
- Fallback para banner padrao se nenhum slide existir

### 5. Atualizar `Index.tsx`
- Substituir a secao do banner estatico pelo componente `HeroCarousel`

