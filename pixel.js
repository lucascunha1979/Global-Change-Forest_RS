
// ============================================================
// GLOBAL FOREST CHANGE RS
// PIXEL.JS — VERSÃO 4F
//
// MAPA POR PIXEL COM:
// - Forest Loss cumulativo
// - Forest Extent
// - Forest Gain
// - frames V2
// - pré-carregamento
// - troca sem tela vazia
// - transição suave
// ============================================================


// ============================================================
// ESTADO DO MÓDULO
// ============================================================

let pixelManifest =
    null;

let pixelGeometry =
    null;

let pixelMap =
    null;

let pixelMunicipalLayer =
    null;

let pixelSatelliteLayer =
    null;


// ------------------------------------------------------------
// Dois overlays para permitir troca sem "piscar"
// ------------------------------------------------------------

let pixelOverlayCurrent =
    null;

let pixelOverlayIncoming =
    null;

let pixelCurrentURL =
    null;


// ------------------------------------------------------------
// Configuração
// ------------------------------------------------------------

let pixelCurrentMode =
    "loss";

let pixelOpacity =
    0.92;


// ------------------------------------------------------------
// Controle contra corridas de carregamento
// ------------------------------------------------------------

let pixelRenderToken =
    0;


// ------------------------------------------------------------
// Cache/preload
// ------------------------------------------------------------

const pixelImageCache =
    new Map();

const pixelThresholdsLoaded =
    new Set();


// ------------------------------------------------------------
// Estado observado
// ------------------------------------------------------------

let pixelLastState = {

    ano:
        null,

    limiar:
        null,

    playing:
        null

};


// ============================================================
// FUNÇÃO DE FETCH
// ============================================================

async function loadPixelJSON(
    url
) {

    const response =
        await fetch(
            url
        );


    if (
        !response.ok
    ) {

        throw new Error(
            `Erro ao carregar ${url}`
        );

    }


    return await response.json();

}


// ============================================================
// PRELOAD DE IMAGENS
// ============================================================

function preloadPixelImage(
    url
) {

    if (
        !url
    ) {

        return Promise.reject(
            new Error(
                "URL de imagem vazia."
            )
        );

    }


    // Já existe no cache
    if (
        pixelImageCache.has(
            url
        )
    ) {

        return pixelImageCache.get(
            url
        );

    }


    const promise =
        new Promise(
            (
                resolve,
                reject
            ) => {

                const img =
                    new Image();


                img.onload =
                    () => {

                        resolve(
                            url
                        );

                    };


                img.onerror =
                    () => {

                        pixelImageCache.delete(
                            url
                        );

                        reject(
                            new Error(
                                `Erro ao pré-carregar ${url}`
                            )
                        );

                    };


                img.src =
                    url;

            }
        );


    pixelImageCache.set(
        url,
        promise
    );


    return promise;

}


// ============================================================
// OBTER FRAMES DE UM LIMIAR
// ============================================================

function getLossFramesForThreshold(
    limiar
) {

    if (
        !pixelManifest
        ||
        !pixelManifest
            .loss_extent_cumulative
    ) {

        return [];

    }


    const grupo =
        pixelManifest
        .loss_extent_cumulative[
            String(
                limiar
            )
        ];


    if (
        !grupo
        ||
        !Array.isArray(
            grupo.frames
        )
    ) {

        return [];

    }


    return grupo.frames;

}


// ============================================================
// URL LOSS PARA ANO/LIMIAR
// ============================================================

function getLossFrameURL(
    ano,
    limiar
) {

    const frames =
        getLossFramesForThreshold(
            limiar
        );


    const frame =
        frames.find(
            d =>
                Number(
                    d.year
                )
                ===
                Number(
                    ano
                )
        );


    return (
        frame
        ?
        frame.image
        :
        null
    );

}


// ============================================================
// URL GAIN
// ============================================================

function getGainURL(
    limiar
) {

    const item =
        pixelManifest
        ?.gain_extent_static
        ?.[
            String(
                limiar
            )
        ];


    if (
        !item
    ) {

        return null;

    }


    return item.image;

}


// ============================================================
// PRELOAD DOS 25 ANOS DO LIMIAR
// ============================================================

async function preloadThresholdFrames(
    limiar
) {

    const chave =
        String(
            limiar
        );


    if (
        pixelThresholdsLoaded.has(
            chave
        )
    ) {

        return;

    }


    const frames =
        getLossFramesForThreshold(
            limiar
        );


    if (
        frames.length === 0
    ) {

        return;

    }


    console.log(
        `Pré-carregando frames ≥${limiar}%...`
    );


    // Primeiro: ano atual
    const atual =
        getLossFrameURL(
            state.ano,
            limiar
        );


    if (
        atual
    ) {

        try {

            await preloadPixelImage(
                atual
            );

        }

        catch (
            error
        ) {

            console.warn(
                error
            );

        }

    }


    // Segundo: anos seguintes e anteriores
    const ordenados =
        frames
        .slice()
        .sort(
            (
                a,
                b
            ) => {

                const da =
                    Math.abs(
                        Number(
                            a.year
                        )
                        -
                        Number(
                            state.ano
                        )
                    );

                const db =
                    Math.abs(
                        Number(
                            b.year
                        )
                        -
                        Number(
                            state.ano
                        )
                    );

                return da - db;

            }
        );


    // Carregamento sequencial evita excesso de
    // requisições simultâneas no navegador.
    for (
        const item
        of ordenados
    ) {

        try {

            await preloadPixelImage(
                item.image
            );

        }

        catch (
            error
        ) {

            console.warn(
                "Falha no preload:",
                item.image
            );

        }

    }


    pixelThresholdsLoaded.add(
        chave
    );


    console.log(
        `Frames ≥${limiar}% em cache.`
    );

}


// ============================================================
// PRELOAD DO PRÓXIMO ANO
// ============================================================

function preloadNextYear() {

    if (
        pixelCurrentMode !==
        "loss"
    ) {

        return;

    }


    let proximo =
        Number(
            state.ano
        )
        +
        1;


    if (
        proximo >
        2025
    ) {

        proximo =
            2001;

    }


    const url =
        getLossFrameURL(
            proximo,
            state.limiar
        );


    if (
        url
    ) {

        preloadPixelImage(
            url
        )
        .catch(
            () => {}
        );

    }

}


// ============================================================
// 1. CRIAR SISTEMA DE ABAS
// ============================================================

function setupTabs() {

    const dashboard =
        document.querySelector(
            ".dashboard"
        );


    if (
        !dashboard
    ) {

        return;

    }


    // Evitar duplicação
    if (
        document.querySelector(
            ".view-tabs"
        )
    ) {

        return;

    }


    const footer =
        dashboard.querySelector(
            "footer"
        );


    const controls =
        dashboard.querySelector(
            ".controls-panel"
        );

    const cards =
        dashboard.querySelector(
            ".cards-grid"
        );

    const mapPanel =
        dashboard.querySelector(
            ".map-panel"
        );

    const charts =
        dashboard.querySelector(
            ".charts-grid"
        );

    const pixelPanel =
        dashboard.querySelector(
            ".pixel-panel"
        );

    const methodology =
        dashboard.querySelector(
            ".methodology"
        );


    // ========================================================
    // Navegação
    // ========================================================

    const tabs =
        document.createElement(
            "nav"
        );


    tabs.className =
        "view-tabs";


    tabs.innerHTML = `

        <button
            type="button"
            class="view-tab active"
            data-tab="municipal"
        >
            Municípios e série temporal
        </button>

        <button
            type="button"
            class="view-tab"
            data-tab="pixel"
        >
            Mapa por pixel / Landsat
        </button>

    `;


    // ========================================================
    // Views
    // ========================================================

    const municipalView =
        document.createElement(
            "div"
        );


    municipalView.id =
        "municipalView";

    municipalView.className =
        "tab-view active";


    const pixelView =
        document.createElement(
            "div"
        );


    pixelView.id =
        "pixelView";

    pixelView.className =
        "tab-view";


    // ========================================================
    // Mover componentes
    // ========================================================

    if (controls) {

        municipalView.appendChild(
            controls
        );

    }


    if (cards) {

        municipalView.appendChild(
            cards
        );

    }


    if (mapPanel) {

        municipalView.appendChild(
            mapPanel
        );

    }


    if (charts) {

        municipalView.appendChild(
            charts
        );

    }


    if (pixelPanel) {

        pixelView.appendChild(
            pixelPanel
        );

    }


    if (methodology) {

        pixelView.appendChild(
            methodology
        );

    }


    dashboard.insertBefore(
        tabs,
        footer
    );


    dashboard.insertBefore(
        municipalView,
        footer
    );


    dashboard.insertBefore(
        pixelView,
        footer
    );


    // ========================================================
    // Eventos
    // ========================================================

    tabs
    .querySelectorAll(
        ".view-tab"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const target =
                        button.dataset.tab;


                    tabs
                    .querySelectorAll(
                        ".view-tab"
                    )
                    .forEach(
                        b => {

                            b.classList
                            .remove(
                                "active"
                            );

                        }
                    );


                    button.classList.add(
                        "active"
                    );


                    municipalView
                    .classList
                    .toggle(
                        "active",
                        target ===
                        "municipal"
                    );


                    pixelView
                    .classList
                    .toggle(
                        "active",
                        target ===
                        "pixel"
                    );


                    setTimeout(
                        () => {

                            if (
                                target ===
                                "municipal"
                                &&
                                state.map
                            ) {

                                state.map
                                .invalidateSize();

                            }


                            if (
                                target ===
                                "pixel"
                                &&
                                pixelMap
                            ) {

                                pixelMap
                                .invalidateSize();


                                // Quando abre a aba pixel,
                                // iniciar cache do limiar atual.
                                preloadThresholdFrames(
                                    state.limiar
                                );

                            }

                        },
                        150
                    );

                }
            );

        }
    );

}


// ============================================================
// 2. CONSTRUIR PAINEL PIXEL
// ============================================================

function buildPixelPanel() {

    const panel =
        document.querySelector(
            ".pixel-panel"
        );


    if (
        !panel
    ) {

        return;

    }


    panel.innerHTML = `

        <div class="pixel-intro">

            <div class="pixel-intro-text">

                <span class="section-kicker">
                    VISUALIZAÇÃO EM ALTA RESOLUÇÃO
                </span>

                <h2>
                    Mudança da cobertura arbórea em nível de pixel
                </h2>

                <p>
                    Visualização temática do Global Forest Change
                    derivada de imagens Landsat.
                    A perda é apresentada de forma acumulada,
                    permanecendo visível à medida que os anos
                    avançam.
                </p>

            </div>

            <span class="pixel-badge">
                GFC 2025 v1.13
            </span>

        </div>


        <div class="pixel-controls">


            <div class="pixel-control">

                <label for="pixelLayerSelect">
                    Camada
                </label>

                <select id="pixelLayerSelect">

                    <option
                        value="loss"
                        selected
                    >
                        Perda acumulada + cobertura
                    </option>

                    <option value="gain">
                        Ganho 2000–2012 + cobertura
                    </option>

                </select>

            </div>


            <div class="pixel-control">

                <label for="pixelLimiarSelect">
                    Cobertura arbórea em 2000
                </label>

                <select id="pixelLimiarSelect">

                    <option
                        value="10"
                        selected
                    >
                        ≥ 10%
                    </option>

                    <option value="30">
                        ≥ 30%
                    </option>

                    <option value="50">
                        ≥ 50%
                    </option>

                </select>

            </div>


            <div class="
                pixel-control
                pixel-year-control
            ">

                <label for="pixelAnoRange">
                    Ano da perda acumulada
                </label>

                <div class="pixel-year-row">

                    <input
                        id="pixelAnoRange"
                        type="range"
                        min="2001"
                        max="2025"
                        value="2025"
                        step="1"
                    >

                    <span
                        id="pixelAnoValue"
                        class="pixel-year-value"
                    >
                        2025
                    </span>

                </div>

            </div>


            <div class="pixel-control">

                <label>
                    Animação temporal
                </label>

                <button
                    type="button"
                    id="pixelPlayButton"
                    class="pixel-play"
                >
                    ▶ Reproduzir
                </button>

            </div>


            <div class="pixel-control">

                <label for="pixelBaseSelect">
                    Fundo cartográfico
                </label>

                <select id="pixelBaseSelect">

                    <option
                        value="satellite"
                        selected
                    >
                        Imagem de satélite
                    </option>

                    <option value="neutral">
                        Fundo neutro
                    </option>

                </select>

            </div>


            <div class="pixel-control">

                <label for="pixelOpacityRange">
                    Opacidade do GFC
                </label>

                <input
                    id="pixelOpacityRange"
                    type="range"
                    min="0.35"
                    max="1"
                    step="0.05"
                    value="0.92"
                >

            </div>

        </div>


        <div class="pixel-map-grid">

            <div class="pixel-map-wrap">

                <div id="pixelMap"></div>

                <div
                    id="pixelYearWatermark"
                    class="pixel-year-watermark"
                >
                    2025
                </div>

            </div>


            <aside class="pixel-side">

                <div class="pixel-legend">

                    <h3>
                        Legenda
                    </h3>

                    <div id="pixelLegend">
                    </div>

                </div>


                <div
                    id="pixelTimeNote"
                    class="pixel-side-note"
                >
                </div>


                <div class="pixel-side-note">

                    As fronteiras municipais são apresentadas
                    somente como referência espacial.
                    A classificação é realizada pixel a pixel.

                </div>


                <div class="pixel-side-note">

                    Os pixels vermelhos são realçados
                    cartograficamente na versão web para
                    melhorar sua visibilidade.
                    Esse realce não participa dos cálculos
                    de hectares, km² ou percentuais.

                </div>

            </aside>

        </div>


        <div class="pixel-info-grid">

            <div class="pixel-info-card">

                <span>
                    Produto
                </span>

                <strong id="pixelInfoProduto">
                    —
                </strong>

            </div>


            <div class="pixel-info-card">

                <span>
                    Período
                </span>

                <strong id="pixelInfoPeriodo">
                    —
                </strong>

            </div>


            <div class="pixel-info-card">

                <span>
                    Limiar
                </span>

                <strong id="pixelInfoLimiar">
                    —
                </strong>

            </div>


            <div class="pixel-info-card">

                <span>
                    Imagem web
                </span>

                <strong id="pixelInfoResolucao">
                    —
                </strong>

            </div>

        </div>

    `;

}


// ============================================================
// 3. CONSTRUIR METODOLOGIA PIXEL
// ============================================================

function buildPixelMethodology() {

    const section =
        document.querySelector(
            ".methodology"
        );


    if (
        !section
    ) {

        return;

    }


    section.innerHTML = `

        <div class="section-heading">

            <div>

                <span class="section-kicker">
                    METODOLOGIA
                </span>

                <h2>
                    Como interpretar o mapa por pixel
                </h2>

            </div>

        </div>


        <p class="pixel-method-intro">

            Esta aba apresenta uma visualização espacial
            do produto Global Forest Change.
            Os mapas são derivados dos rasters analíticos
            utilizados nos cálculos do projeto.

            As imagens apresentadas no navegador possuem
            resolução reduzida exclusivamente para
            visualização web.

        </p>


        <div
            id="pixelMethodGrid"
            class="method-grid pixel-method-grid"
        >
        </div>


        <div class="method-warning">

            <strong>
                Importante:
            </strong>

            Forest Loss representa perda de cobertura
            arbórea ou distúrbio de substituição do dossel
            detectado pelo GFC.

            O indicador não corresponde automaticamente
            a desmatamento e pode incluir alterações
            associadas à silvicultura e outros distúrbios.

        </div>

    `;

}


// ============================================================
// 4. INICIALIZAR MAPA
// ============================================================

function initPixelMap() {

    pixelMap =
        L.map(
            "pixelMap",
            {

                zoomControl:
                    true,

                attributionControl:
                    true,

                preferCanvas:
                    true,

                minZoom:
                    5,

                maxZoom:
                    15

            }
        );


    // ========================================================
    // PANES
    // ========================================================

    pixelMap.createPane(
        "gfcRasterPane"
    );


    pixelMap.getPane(
        "gfcRasterPane"
    ).style.zIndex =
        450;


    pixelMap.createPane(
        "gfcBoundaryPane"
    );


    pixelMap.getPane(
        "gfcBoundaryPane"
    ).style.zIndex =
        470;


    // ========================================================
    // SATÉLITE
    // ========================================================

    pixelSatelliteLayer =
        L.tileLayer(

            (
                "https://server.arcgisonline.com/"
                "ArcGIS/rest/services/"
                "World_Imagery/MapServer/"
                "tile/{z}/{y}/{x}"
            ),

            {

                maxZoom:
                    18,

                attribution:
                    "Imagem de fundo © Esri"

            }
        );


    pixelSatelliteLayer.addTo(
        pixelMap
    );


    // ========================================================
    // LIMITES MUNICIPAIS
    // ========================================================

    pixelMunicipalLayer =
        L.geoJSON(
            pixelGeometry,
            {

                pane:
                    "gfcBoundaryPane",

                style: {

                    fill:
                        false,

                    color:
                        "#f5f6f5",

                    weight:
                        0.55,

                    opacity:
                        0.76

                },

                interactive:
                    false

            }
        );


    pixelMunicipalLayer.addTo(
        pixelMap
    );


    // ========================================================
    // EXTENSÃO
    // ========================================================

    pixelMap.fitBounds(

        pixelManifest
        .bounds_leaflet,

        {

            padding:
                [
                    12,
                    12
                ]

        }
    );

}


// ============================================================
// 5. URL ATUAL
// ============================================================

function getPixelImageURL() {

    if (
        pixelCurrentMode ===
        "gain"
    ) {

        return getGainURL(
            state.limiar
        );

    }


    return getLossFrameURL(
        state.ano,
        state.limiar
    );

}


// ============================================================
// 6. TROCA DE FRAME SEM PISCAR
// ============================================================

async function setPixelFrameSmooth(
    url
) {

    if (
        !url
    ) {

        console.warn(
            "URL do frame não encontrada."
        );

        return;

    }


    // Já estamos mostrando esta imagem
    if (
        url ===
        pixelCurrentURL
    ) {

        return;

    }


    // Cada solicitação ganha um token
    const meuToken =
        ++pixelRenderToken;


    // ========================================================
    // PRIMEIRO GARANTIR QUE A IMAGEM JÁ ESTEJA CARREGADA
    // ========================================================

    try {

        await preloadPixelImage(
            url
        );

    }

    catch (
        error
    ) {

        console.error(
            error
        );

        return;

    }


    // Uma solicitação mais nova chegou enquanto carregávamos
    if (
        meuToken !==
        pixelRenderToken
    ) {

        return;

    }


    // ========================================================
    // CRIAR NOVO OVERLAY INVISÍVEL
    // ========================================================

    const incoming =
        L.imageOverlay(

            url,

            pixelManifest
            .bounds_leaflet,

            {

                opacity:
                    0,

                pane:
                    "gfcRasterPane",

                interactive:
                    false,

                crossOrigin:
                    true,

                className:
                    "gfc-pixel-frame"

            }
        );


    pixelOverlayIncoming =
        incoming;


    incoming.addTo(
        pixelMap
    );


    // ========================================================
    // Quando Leaflet terminar de montar a imagem,
    // fazemos a transição.
    // ========================================================

    const realizarTroca =
        () => {

            if (
                meuToken !==
                pixelRenderToken
            ) {

                if (
                    pixelMap.hasLayer(
                        incoming
                    )
                ) {

                    pixelMap.removeLayer(
                        incoming
                    );

                }

                return;

            }


            const anterior =
                pixelOverlayCurrent;


            pixelOverlayCurrent =
                incoming;


            pixelOverlayIncoming =
                null;


            pixelCurrentURL =
                url;


            // próximo frame aparece
            incoming.setOpacity(
                pixelOpacity
            );


            // frame anterior continua durante a transição
            if (
                anterior
            ) {

                setTimeout(
                    () => {

                        anterior.setOpacity(
                            0
                        );

                    },
                    60
                );


                // Só remover depois da transição
                setTimeout(
                    () => {

                        if (
                            pixelMap.hasLayer(
                                anterior
                            )
                        ) {

                            pixelMap.removeLayer(
                                anterior
                            );

                        }

                    },
                    320
                );

            }


            pixelMunicipalLayer
            .bringToFront();


            preloadNextYear();

        };


    // Em geral o preload já colocou a imagem em cache,
    // por isso o load ocorre imediatamente.
    incoming.once(
        "load",
        realizarTroca
    );


    // Fallback para cache extremamente rápido,
    // onde o evento pode ter ocorrido antes da associação.
    setTimeout(
        () => {

            if (
                pixelOverlayCurrent !==
                incoming
                &&
                meuToken ===
                pixelRenderToken
                &&
                incoming
                .getElement()
                &&
                incoming
                .getElement()
                .complete
            ) {

                realizarTroca();

            }

        },
        100
    );

}


// ============================================================
// 7. LEGENDA
// ============================================================

function updatePixelLegend() {

    const el =
        document.getElementById(
            "pixelLegend"
        );


    if (
        !el
    ) {

        return;

    }


    if (
        pixelCurrentMode ===
        "loss"
    ) {

        el.innerHTML = `

            <div class="pixel-legend-item">

                <span
                    class="pixel-legend-swatch"
                    style="
                        background:#00BE1E;
                    "
                ></span>

                Cobertura arbórea elegível
                ainda sem perda registrada
                até ${state.ano}

            </div>


            <div class="pixel-legend-item">

                <span
                    class="pixel-legend-swatch"
                    style="
                        background:#FF0020;
                    "
                ></span>

                Perda acumulada entre
                2001 e ${state.ano}

            </div>


            <div class="pixel-legend-item">

                <span
                    class="pixel-legend-swatch"
                    style="
                        background:#070908;
                    "
                ></span>

                Área terrestre abaixo
                do limiar selecionado

            </div>

        `;

    }

    else {

        el.innerHTML = `

            <div class="pixel-legend-item">

                <span
                    class="pixel-legend-swatch"
                    style="
                        background:#149436;
                    "
                ></span>

                Cobertura arbórea em 2000
                acima do limiar selecionado

            </div>


            <div class="pixel-legend-item">

                <span
                    class="pixel-legend-swatch"
                    style="
                        background:#1441f5;
                    "
                ></span>

                Ganho de cobertura arbórea
                identificado em 2000–2012

            </div>


            <div class="pixel-legend-item">

                <span
                    class="pixel-legend-swatch"
                    style="
                        background:#070908;
                    "
                ></span>

                Área terrestre abaixo
                do limiar selecionado

            </div>

        `;

    }

}


// ============================================================
// 8. ATUALIZAR MAPA
// ============================================================

async function updatePixelMap() {

    if (
        !pixelMap
        ||
        !pixelManifest
    ) {

        return;

    }


    const url =
        getPixelImageURL();


    if (
        !url
    ) {

        console.warn(
            "Imagem não encontrada:",
            {
                ano:
                    state.ano,

                limiar:
                    state.limiar,

                modo:
                    pixelCurrentMode
            }
        );

        return;

    }


    await setPixelFrameSmooth(
        url
    );


    updatePixelUI();

}


// ============================================================
// 9. UI
// ============================================================

function updatePixelUI() {

    const anoRange =
        document.getElementById(
            "pixelAnoRange"
        );

    const anoValue =
        document.getElementById(
            "pixelAnoValue"
        );

    const watermark =
        document.getElementById(
            "pixelYearWatermark"
        );

    const limiarSelect =
        document.getElementById(
            "pixelLimiarSelect"
        );

    const playButton =
        document.getElementById(
            "pixelPlayButton"
        );


    if (
        !anoRange
    ) {

        return;

    }


    anoRange.value =
        state.ano;


    anoValue.textContent =
        state.ano;


    limiarSelect.value =
        state.limiar;


    // ========================================================
    // GAIN
    // ========================================================

    if (
        pixelCurrentMode ===
        "gain"
    ) {

        anoRange.disabled =
            true;


        playButton.disabled =
            true;


        watermark.textContent =
            "2000–2012";


        document
        .getElementById(
            "pixelTimeNote"
        )
        .innerHTML = `

            <strong>
                Gain não possui ano individual.
            </strong>

            <br><br>

            A banda Gain do Global Forest Change
            indica ganho detectado em algum momento
            entre 2000 e 2012.

            Portanto, esta camada não deve ser
            interpretada como série anual.

        `;

    }


    // ========================================================
    // LOSS
    // ========================================================

    else {

        anoRange.disabled =
            false;


        playButton.disabled =
            false;


        watermark.textContent =
            state.ano;


        document
        .getElementById(
            "pixelTimeNote"
        )
        .innerHTML = `

            <strong>
                Perda acumulada.
            </strong>

            <br><br>

            Em vermelho permanecem todos os pixels
            cuja perda foi registrada entre 2001 e
            <strong>${state.ano}</strong>.

            Os pixels vermelhos não desaparecem quando
            o ano avança.

        `;

    }


    playButton.textContent =
        state.playing
        ?
        "❚❚ Pausar"
        :
        "▶ Reproduzir";


    document
    .getElementById(
        "pixelInfoProduto"
    )
    .textContent =
        pixelCurrentMode ===
        "loss"
        ?
        "Forest Loss + Extent"
        :
        "Forest Gain + Extent";


    document
    .getElementById(
        "pixelInfoPeriodo"
    )
    .textContent =
        pixelCurrentMode ===
        "loss"
        ?
        `2001–${state.ano}`
        :
        "2000–2012";


    document
    .getElementById(
        "pixelInfoLimiar"
    )
    .textContent =
        (
            "Treecover2000 ≥ "
            +
            `${state.limiar}%`
        );


    document
    .getElementById(
        "pixelInfoResolucao"
    )
    .textContent =
        (
            `${pixelManifest.web_size.width}`
            +
            " × "
            +
            `${pixelManifest.web_size.height} px`
        );


    updatePixelLegend();

}


// ============================================================
// 10. FUNDO
// ============================================================

function updatePixelBase() {

    const select =
        document.getElementById(
            "pixelBaseSelect"
        );


    if (
        !select
    ) {

        return;

    }


    const mode =
        select.value;


    if (
        mode ===
        "satellite"
    ) {

        if (
            !pixelMap.hasLayer(
                pixelSatelliteLayer
            )
        ) {

            pixelSatelliteLayer.addTo(
                pixelMap
            );

        }


        pixelMunicipalLayer
        .setStyle({

            color:
                "#f5f6f5",

            weight:
                0.55,

            opacity:
                0.76

        });

    }

    else {

        if (
            pixelMap.hasLayer(
                pixelSatelliteLayer
            )
        ) {

            pixelMap.removeLayer(
                pixelSatelliteLayer
            );

        }


        pixelMap
        .getContainer()
        .style
        .background =
            "#4e4e4e";


        pixelMunicipalLayer
        .setStyle({

            color:
                "#d0d5d0",

            weight:
                0.55,

            opacity:
                0.70

        });

    }


    if (
        pixelMunicipalLayer
    ) {

        pixelMunicipalLayer
        .bringToFront();

    }

}


// ============================================================
// 11. METODOLOGIA
// ============================================================

function populatePixelMethodology() {

    const grid =
        document.getElementById(
            "pixelMethodGrid"
        );


    if (
        !grid
    ) {

        return;

    }


    const cards = [

        [
            "Treecover2000",

            (
                "Percentual de cobertura do dossel "
                "arbóreo no ano 2000. Os cenários "
                "utilizados no painel aplicam limiares "
                "de 10%, 30% ou 50%."
            )
        ],

        [
            "Lossyear",

            (
                "Identifica o ano da perda detectada. "
                "Os códigos 1 a 25 representam os anos "
                "de 2001 a 2025."
            )
        ],

        [
            "Perda acumulada",

            (
                "Ao avançar o ano, permanecem em vermelho "
                "todas as perdas observadas desde 2001 "
                "até o ano selecionado."
            )
        ],

        [
            "Forest Gain",

            (
                "Indicador binário de ganho de cobertura "
                "arbórea no período 2000–2012. "
                "Não informa o ano específico do ganho."
            )
        ],

        [
            "Área dos pixels",

            (
                "Os cálculos utilizaram área real de pixel. "
                "Não foi adotado um valor fixo de 900 m² "
                "para toda a grade."
            )
        ],

        [
            "Resolução",

            (
                "Os rasters analíticos permanecem na grade "
                "original de 0,00025°. Os PNGs do painel "
                "são versões reduzidas apenas para exibição."
            )
        ],

        [
            "Realce cartográfico",

            (
                "Na versão web os pixels de perda foram "
                "ligeiramente realçados para permanecerem "
                "visíveis na redução de resolução. "
                "Esse recurso não altera os cálculos."
            )
        ],

        [
            "Interpretação",

            (
                "Forest Loss representa perda de cobertura "
                "arbórea ou distúrbio de substituição do "
                "dossel e não corresponde necessariamente "
                "a desmatamento."
            )
        ]

    ];


    grid.innerHTML =
        cards
        .map(
            item => `

                <article>

                    <h3>
                        ${item[0]}
                    </h3>

                    <p>
                        ${item[1]}
                    </p>

                </article>

            `
        )
        .join("");

}


// ============================================================
// 12. SINCRONIZAR PIXEL -> ABA MUNICIPAL
// ============================================================

function syncMainControls() {

    const mainAno =
        document.getElementById(
            "anoRange"
        );


    const mainLimiar =
        document.getElementById(
            "limiarSelect"
        );


    if (
        mainAno
    ) {

        mainAno.value =
            state.ano;

    }


    if (
        mainLimiar
    ) {

        mainLimiar.value =
            state.limiar;

    }


    if (
        typeof updateDashboard ===
        "function"
    ) {

        updateDashboard();

    }

}


// ============================================================
// 13. EVENTOS PIXEL
// ============================================================

function bindPixelControls() {

    // --------------------------------------------------------
    // Camada
    // --------------------------------------------------------

    document
    .getElementById(
        "pixelLayerSelect"
    )
    .addEventListener(
        "change",
        e => {

            pixelCurrentMode =
                e.target.value;


            updatePixelMap();

        }
    );


    // --------------------------------------------------------
    // Limiar
    // --------------------------------------------------------

    document
    .getElementById(
        "pixelLimiarSelect"
    )
    .addEventListener(
        "change",
        e => {

            state.limiar =
                Number(
                    e.target.value
                );


            syncMainControls();


            updatePixelMap();


            setTimeout(
                () => {

                    preloadThresholdFrames(
                        state.limiar
                    );

                },
                400
            );

        }
    );


    // --------------------------------------------------------
    // Ano
    // --------------------------------------------------------

    document
    .getElementById(
        "pixelAnoRange"
    )
    .addEventListener(
        "input",
        e => {

            state.ano =
                Number(
                    e.target.value
                );


            syncMainControls();


            updatePixelMap();

        }
    );


    // --------------------------------------------------------
    // Opacidade
    // --------------------------------------------------------

    document
    .getElementById(
        "pixelOpacityRange"
    )
    .addEventListener(
        "input",
        e => {

            pixelOpacity =
                Number(
                    e.target.value
                );


            if (
                pixelOverlayCurrent
            ) {

                pixelOverlayCurrent
                .setOpacity(
                    pixelOpacity
                );

            }

        }
    );


    // --------------------------------------------------------
    // Fundo
    // --------------------------------------------------------

    document
    .getElementById(
        "pixelBaseSelect"
    )
    .addEventListener(
        "change",
        () => {

            updatePixelBase();

        }
    );


    // --------------------------------------------------------
    // Play
    // --------------------------------------------------------

    document
    .getElementById(
        "pixelPlayButton"
    )
    .addEventListener(
        "click",
        () => {

            const mainPlay =
                document.getElementById(
                    "playButton"
                );


            if (
                mainPlay
            ) {

                mainPlay.click();

            }


            setTimeout(
                updatePixelUI,
                40
            );

        }
    );

}


// ============================================================
// 14. ESCUTAR CONTROLES MUNICIPAIS
// ============================================================

function bindMainPanelSync() {

    const mainAno =
        document.getElementById(
            "anoRange"
        );


    const mainLimiar =
        document.getElementById(
            "limiarSelect"
        );


    if (
        mainAno
    ) {

        mainAno.addEventListener(
            "input",
            () => {

                setTimeout(
                    updatePixelMap,
                    10
                );

            }
        );

    }


    if (
        mainLimiar
    ) {

        mainLimiar.addEventListener(
            "change",
            () => {

                setTimeout(
                    () => {

                        updatePixelMap();


                        preloadThresholdFrames(
                            state.limiar
                        );

                    },
                    10
                );

            }
        );

    }

}


// ============================================================
// 15. WATCHER DA ANIMAÇÃO
//
// app.js atualiza state.ano no seu timer.
// Aqui observamos essa mudança e atualizamos o raster.
// ============================================================

function startPixelStateWatcher() {

    setInterval(
        () => {

            const anoMudou =
                pixelLastState.ano
                !==
                state.ano;


            const limiarMudou =
                pixelLastState.limiar
                !==
                state.limiar;


            const playingMudou =
                pixelLastState.playing
                !==
                state.playing;


            if (
                anoMudou
                ||
                limiarMudou
            ) {

                pixelLastState.ano =
                    state.ano;


                pixelLastState.limiar =
                    state.limiar;


                updatePixelMap();

            }


            if (
                playingMudou
            ) {

                pixelLastState.playing =
                    state.playing;


                updatePixelUI();

            }

        },
        100
    );

}


// ============================================================
// 16. INICIALIZAR
// ============================================================

async function initPixelModule() {

    try {

        // ====================================================
        // Layout
        // ====================================================

        setupTabs();

        buildPixelPanel();

        buildPixelMethodology();


        // ====================================================
        // Dados
        // ====================================================

        [

            pixelManifest,

            pixelGeometry

        ] = await Promise.all([

            loadPixelJSON(
                "pixels/pixel_layers_v2.json"
            ),

            loadPixelJSON(
                "dados/mapa_municipios.geojson"
            )

        ]);


        console.log(
            "Manifesto pixel V2 carregado.",
            pixelManifest
        );


        // ====================================================
        // Inicializar controles
        // ====================================================

        document
        .getElementById(
            "pixelAnoRange"
        )
        .value =
            state.ano;


        document
        .getElementById(
            "pixelLimiarSelect"
        )
        .value =
            state.limiar;


        // ====================================================
        // Mapa
        // ====================================================

        initPixelMap();


        // ====================================================
        // Eventos
        // ====================================================

        bindPixelControls();

        bindMainPanelSync();


        // ====================================================
        // Metodologia
        // ====================================================

        populatePixelMethodology();


        // ====================================================
        // PRIMEIRO FRAME
        //
        // Garantimos que ele esteja carregado antes de
        // continuar.
        // ====================================================

        const primeiroURL =
            getPixelImageURL();


        if (
            primeiroURL
        ) {

            await preloadPixelImage(
                primeiroURL
            );

        }


        await updatePixelMap();


        updatePixelBase();


        // ====================================================
        // Pré-carregar os demais anos após abrir
        // ====================================================

        setTimeout(
            () => {

                preloadThresholdFrames(
                    state.limiar
                );

            },
            500
        );


        // ====================================================
        // Watcher
        // ====================================================

        startPixelStateWatcher();


        pixelLastState.ano =
            state.ano;


        pixelLastState.limiar =
            state.limiar;


        pixelLastState.playing =
            state.playing;


        console.log(
            "Módulo Pixel 4F iniciado."
        );

    }

    catch (
        error
    ) {

        console.error(
            "Erro no módulo pixel:",
            error
        );


        const panel =
            document.querySelector(
                ".pixel-panel"
            );


        if (
            panel
        ) {

            panel.innerHTML = `

                <div style="
                    padding:18px;
                    background:#ffe8e8;
                    color:#8d2222;
                    border-radius:12px;
                ">

                    <strong>
                        Erro ao carregar o mapa por pixel.
                    </strong>

                    <br><br>

                    ${error.message}

                </div>

            `;

        }

    }

}


// ============================================================
// START
// ============================================================

initPixelModule();
