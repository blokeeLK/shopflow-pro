

## Diagnóstico

A tabela `carousel_slides` está **vazia** — nenhum slide foi salvo. As políticas RLS estão corretas (permissivas). O problema é a **validação de dimensão exata (1920x560px)** que bloqueia o upload se a imagem não tiver exatamente essas dimensões. A imagem que você tentou enviar provavelmente foi rejeitada pela validação.

## Plano

### 1. Flexibilizar a validação de dimensão no AdminDesign
- Remover a exigência de dimensão **exata** 1920x560
- Converter para uma **recomendação** (aviso via toast informativo, mas permitir o upload)
- Aceitar qualquer imagem, apenas sugerindo a proporção ideal

### 2. Melhorar o feedback de erro no save
- Adicionar logs no console para debug em caso de falha no insert
- Mostrar toast de erro mais detalhado se o insert falhar

Nenhuma alteração de banco de dados necessária — a tabela e RLS já estão corretas.

