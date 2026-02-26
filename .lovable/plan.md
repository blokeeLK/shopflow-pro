

## Plano: Trocar a imagem do banner principal

### O que sera feito
1. Copiar a nova imagem enviada (`user-uploads://ChatGPT_Image_26_02_2026_00_40_47-2.png`) para `public/images/banner-nova-colecao.png`, substituindo a atual.
2. Aumentar o tamanho da logo no Header de `h-20 md:h-28` para `h-24 md:h-32` (96px mobile, 128px desktop).

### Detalhes tecnicos
- O arquivo `src/pages/Index.tsx` ja referencia `/images/banner-nova-colecao.png` com `object-contain`, entao basta substituir o arquivo de imagem.
- A logo no Header (`src/components/Header.tsx`) tera as classes de altura aumentadas.

