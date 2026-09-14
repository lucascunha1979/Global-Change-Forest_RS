# Global Forest Change — Rio Grande do Sul

Painel interativo para exploração espacial e temporal da perda de cobertura arbórea no Rio Grande do Sul, com base no **Global Forest Change (GFC)**.

O painel combina duas escalas de análise:

1. **Municípios e série temporal** — indicadores agregados para os 497 municípios do Rio Grande do Sul.
2. **Mapa por pixel / Landsat** — visualização espacial da cobertura arbórea, perda acumulada e ganho de cobertura em nível de pixel.

---

## Dados

A análise utiliza o produto:

**Hansen/UMD Global Forest Change 2025 v1.13**

Asset utilizado no Google Earth Engine:

`UMD/hansen/global_forest_change_2025_v1_13`

Principais bandas utilizadas:

- `treecover2000`
- `lossyear`
- `gain`
- `datamask`

O produto Global Forest Change é derivado de séries temporais de imagens Landsat.

Crédito recomendado para exibição dos dados:

**Source: Hansen/UMD/Google/USGS/NASA**

Referência principal:

Hansen, M. C. et al. (2013). *High-Resolution Global Maps of 21st-Century Forest Cover Change*. Science, 342, 850–853.

Visualização oficial do projeto:

https://glad.earthengine.app/view/global-forest-change

Documentação e página técnica de download:

https://storage.googleapis.com/earthenginepartners-hansen/GFC-2024-v1.12/download.html

---

## Cobertura arbórea em 2000

A banda `treecover2000` informa, para cada pixel, o percentual de cobertura de copas de vegetação arbórea existente no ano 2000.

Os valores variam de **0% a 100%**.

O Global Forest Change considera vegetação com altura superior a aproximadamente 5 metros.

### Exemplo

`Treecover2000 = 40%`

significa que aproximadamente 40% da área daquele pixel estava coberta por copas arbóreas em 2000.

---

## Limiares de cobertura arbórea

O limiar é um **filtro aplicado à cobertura arbórea existente em 2000**, antes da análise da perda.

O painel apresenta três cenários.

### ≥10%

Entram pixels que possuíam pelo menos 10% de cobertura arbórea em 2000.

É o cenário mais abrangente.

### ≥30%

Entram apenas pixels com pelo menos 30% de cobertura arbórea inicial.

É o cenário intermediário.

### ≥50%

Entram somente pixels cuja cobertura arbórea em 2000 era igual ou superior a 50%.

É o cenário mais restritivo.

### Exemplo

Considere um pixel com:

`Treecover2000 = 42%`

Esse pixel:

- entra no cenário ≥10%;
- entra no cenário ≥30%;
- não entra no cenário ≥50%.

Portanto, o limiar **não representa percentual de perda**.

Ele determina quais pixels podem entrar na análise com base na cobertura arbórea existente no ano 2000.

---

## Forest Loss

A banda `lossyear` identifica o ano em que uma perda de cobertura arbórea foi detectada.

No painel, a perda é apresentada para o período **2001–2025**.

Os mapas temporais utilizam perda **acumulada**.

Assim, um pixel identificado como perda em 2005 permanece classificado como perda nos mapas de 2006, 2007 e anos posteriores.

A interpretação adequada é **perda de cobertura arbórea** ou distúrbio de substituição do dossel.

O indicador não deve ser automaticamente interpretado como desmatamento, pois pode incluir outros processos, como intervenções associadas à silvicultura e diferentes tipos de distúrbio da vegetação.

---

## Forest Gain

A banda `gain` identifica ganho de cobertura arbórea no intervalo **2000–2012**.

É uma variável binária:

- 1 = ganho detectado;
- 0 = ganho não detectado.

Essa camada não informa o ano específico em que ocorreu o ganho.

Por esse motivo, o painel apresenta `Gain` como camada espacial estática, e não como série anual.

---

## Do pixel ao município

Os indicadores municipais foram construídos a partir dos pixels do Global Forest Change.

O procedimento geral foi:

**Global Forest Change → Treecover2000 → aplicação do limiar (10%, 30% ou 50%) → Lossyear → área real dos pixels → agregação pelos limites municipais → hectares, km² e percentual territorial.**

A área foi calculada utilizando a área real de cada pixel, e não uma área fixa de 900 m².

Os resultados foram posteriormente agregados aos limites dos municípios do Rio Grande do Sul.

---

## Percentual municipal

O percentual mostrado no painel corresponde a:

**área mapeada com perda ÷ área territorial do município × 100**

Portanto, ele **não representa o percentual da cobertura florestal original que foi perdido**.

---

## Mapas municipais

O painel permite visualizar:

- perda anual;
- perda acumulada;
- hectares;
- quilômetros quadrados;
- percentual da área territorial municipal;
- ranking de municípios;
- evolução temporal;
- comparação entre limiares de cobertura.

Os limites municipais utilizados correspondem à malha municipal do IBGE.

A geometria exibida na aplicação web foi simplificada para melhorar o desempenho do navegador.

Essa simplificação é exclusivamente cartográfica e não altera os valores analíticos.

---

## Mapas por pixel

A aba de mapas por pixel apresenta duas visualizações principais.

### Loss + Extent

- **verde:** cobertura arbórea elegível segundo o limiar selecionado;
- **vermelho:** perda acumulada entre 2001 e o ano selecionado;
- **escuro:** áreas abaixo do limiar;
- **transparente:** áreas externas ou sem dado.

### Gain + Extent

Apresenta a cobertura arbórea inicial e os pixels em que foi detectado ganho no intervalo 2000–2012.

Os pixels vermelhos da versão web recebem um pequeno realce cartográfico para melhorar sua visualização em resolução reduzida.

Esse realce **não participa dos cálculos de área**.

---

## Resolução espacial

Os dados analíticos originais foram mantidos na grade do Global Forest Change.

Para a aplicação web, os mapas raster foram convertidos para imagens de visualização reduzidas com dimensão de aproximadamente **2200 × 1844 pixels**.

Essa redução é utilizada apenas na apresentação do mapa.

Os cálculos foram realizados a partir dos dados analíticos originais.

---

## Séries temporais

Período disponível para perda:

**2001–2025**

Limiares analisados:

- ≥10%;
- ≥30%;
- ≥50%.

A série municipal contém:

**497 municípios × 25 anos × 3 limiares = 37.275 registros.**

---

## Estrutura da aplicação

Principais arquivos da aplicação:

- `index.html`
- `style.css`
- `app.js`
- `pixel.css`
- `pixel.js`
- `municipal_methodology.js`
- `gfc_explicacao.css`
- `gfc_explicacao.js`
- `gfc_ajustes_v2.css`
- `gfc_ajustes_v2.js`

### Pasta dados

Contém, entre outros:

- `metadata.json`
- `cards.json`
- `estado_serie.json`
- `ranking_top20.json`
- `mapa_atributos.json`
- `mapa_municipios.geojson`

### Pasta pixels

Contém:

- `pixel_layers_v2.json`
- `gain_extent/`
- `loss_extent_cumulative_v2/`

Os frames temporais de perda estão separados pelos limiares de 10%, 30% e 50%.

---

## Fundos cartográficos

O painel oferece mapas de referência externos para facilitar a orientação espacial.

Entre eles estão:

- OpenStreetMap;
- Esri World Imagery.

Essas bases são utilizadas somente como contexto cartográfico.

Os dados temáticos apresentados sobre elas são provenientes do Global Forest Change e das agregações realizadas neste projeto.

---

## Considerações metodológicas

O Global Forest Change é particularmente útil para analisar padrões espaciais e temporais de mudança da cobertura arbórea.

Entretanto, a comparação direta entre anos deve ser interpretada com cautela devido, entre outros fatores, a:

- diferenças entre sensores Landsat;
- mudanças na disponibilidade de observações;
- atualizações dos algoritmos;
- alterações metodológicas realizadas ao longo das versões do produto.

Os resultados deste painel devem, portanto, ser interpretados dentro dessas características metodológicas.

---

## Tecnologias

A construção do projeto utilizou, entre outras ferramentas:

- Google Earth Engine;
- Python;
- Rasterio;
- GeoPandas;
- Pandas;
- Leaflet;
- JavaScript;
- HTML;
- CSS;
- GitHub Pages.

---

## Publicação

A aplicação é totalmente estática e pode ser publicada diretamente através do GitHub Pages.

Configuração recomendada:

- Branch: `main`
- Folder: `/ (root)`

O arquivo `.nojekyll` evita processamento desnecessário pelo Jekyll.

---

## Fonte

**Global Forest Change**

**Hansen/UMD/Google/USGS/NASA**

Visualização oficial:

https://glad.earthengine.app/view/global-forest-change

Documentação técnica:

https://storage.googleapis.com/earthenginepartners-hansen/GFC-2024-v1.12/download.html
