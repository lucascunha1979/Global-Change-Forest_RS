

// ============================================================
// GLOBAL FOREST CHANGE RS
// BLOCO 4H
//
// DIDÁTICA + FUNDOS CARTOGRÁFICOS
// ============================================================


// ============================================================
// CAMADAS MUNICIPAIS
// ============================================================

let gfcMunicipalLightLayer =
    null;

let gfcMunicipalSatelliteLayer =
    null;

let gfcMunicipalAttributionControl =
    null;


// ============================================================
// CAMADA CLARA DO MAPA PIXEL
// ============================================================

let gfcPixelLightLayer =
    null;


// ============================================================
// 1. GUIA DIDÁTICO DA PRIMEIRA ABA
// ============================================================

function createGFCGuide() {

    const municipalView =
        document.getElementById(
            "municipalView"
        );


    if (
        !municipalView
    ) {

        return false;

    }


    if (
        document.getElementById(
            "gfcGuide"
        )
    ) {

        return true;

    }


    const guide =
        document.createElement(
            "section"
        );


    guide.id =
        "gfcGuide";


    guide.className =
        "gfc-guide";


    guide.innerHTML = `

        <div class="gfc-guide-header">

            <div>

                <span class="section-kicker">
                    COMO LER ESTES DADOS
                </span>

                <h2>
                    Da cobertura arbórea ao indicador municipal
                </h2>

                <p>
                    O Global Forest Change trabalha originalmente
                    com pixels. Antes de interpretar hectares,
                    percentuais e mapas municipais, é importante
                    entender o que significa cobertura arbórea,
                    limiar e perda.
                </p>

            </div>


            <div
                id="gfcCurrentThreshold"
                class="gfc-current-threshold"
            >
                Critério atual: ≥ 10%
            </div>

        </div>


        <div class="gfc-guide-grid">


            <article class="gfc-guide-card">

                <div class="gfc-guide-number">
                    1
                </div>

                <h3>
                    O que é cobertura arbórea?
                </h3>

                <p>
                    <strong>Treecover2000</strong>
                    mede, para cada pixel, o percentual
                    ocupado por copas de vegetação com
                    mais de 5 metros de altura no ano 2000.
                    O valor varia de 0% a 100%.
                </p>

            </article>


            <article class="gfc-guide-card">

                <div class="gfc-guide-number">
                    2
                </div>

                <h3>
                    O que é o limiar?
                </h3>

                <p>
                    O limiar define a
                    <strong>cobertura mínima em 2000</strong>
                    para que o pixel entre na análise.
                    Ele é um critério de seleção da cobertura
                    inicial, e não uma medida da perda.
                </p>

            </article>


            <article class="gfc-guide-card">

                <div class="gfc-guide-number">
                    3
                </div>

                <h3>
                    O que significa perda?
                </h3>

                <p>
                    <strong>Lossyear</strong>
                    registra o ano em que o produto detectou
                    uma perda de cobertura arbórea ou um
                    distúrbio de substituição do dossel.
                    Isso não significa automaticamente
                    desmatamento.
                </p>

            </article>


            <article class="gfc-guide-card">

                <div class="gfc-guide-number">
                    4
                </div>

                <h3>
                    Como chegamos ao município?
                </h3>

                <p>
                    Calculamos a área dos pixels selecionados
                    e somamos essas áreas dentro de cada
                    limite municipal. Assim obtemos hectares,
                    km² e percentual da área territorial
                    do município.
                </p>

            </article>

        </div>


        <div class="threshold-cards">

            <div
                class="threshold-card"
                data-threshold-help="10"
            >

                <strong>
                    ≥ 10%
                </strong>

                <span>
                    Critério mais abrangente.
                    Inclui pixels que tinham pelo menos
                    10% de cobertura arbórea em 2000.
                </span>

            </div>


            <div
                class="threshold-card"
                data-threshold-help="30"
            >

                <strong>
                    ≥ 30%
                </strong>

                <span>
                    Critério intermediário.
                    Exige maior cobertura arbórea inicial
                    para que o pixel seja considerado.
                </span>

            </div>


            <div
                class="threshold-card"
                data-threshold-help="50"
            >

                <strong>
                    ≥ 50%
                </strong>

                <span>
                    Critério mais restritivo.
                    Mantém apenas pixels cuja cobertura
                    arbórea em 2000 era de pelo menos 50%.
                </span>

            </div>

        </div>


        <div
            id="thresholdDynamicHelp"
            class="threshold-explainer"
        >
        </div>


        <div class="gfc-important">

            <div class="gfc-important-icon">
                !
            </div>

            <div>

                <strong>
                    Atenção à interpretação.
                </strong>

                Um limiar de 10% não significa
                “10% de floresta perdida”.

                Significa que o pixel só entra na análise
                se possuía pelo menos 10% de cobertura
                arbórea no ano 2000.

                Da mesma forma, o percentual municipal
                apresentado no painel é:

                <strong>
                    área mapeada com perda ÷ área territorial
                    do município × 100
                </strong>.

                Ele não representa o percentual da floresta
                original do município que foi perdido.

            </div>

        </div>

    `;


    const controls =
        municipalView.querySelector(
            ".controls-panel"
        );


    if (
        controls
    ) {

        municipalView.insertBefore(
            guide,
            controls
        );

    }

    else {

        municipalView.prepend(
            guide
        );

    }


    return true;

}


// ============================================================
// 2. TEXTO DINÂMICO DOS LIMIARES
// ============================================================

function updateGFCThresholdExplanation() {

    if (
        typeof state ===
        "undefined"
    ) {

        return;

    }


    const limiar =
        Number(
            state.limiar
        );


    const badge =
        document.getElementById(
            "gfcCurrentThreshold"
        );


    if (
        badge
    ) {

        badge.textContent =
            `Critério atual: ≥ ${limiar}%`;

    }


    document
    .querySelectorAll(
        "[data-threshold-help]"
    )
    .forEach(
        el => {

            el.classList.toggle(

                "active",

                Number(
                    el.dataset
                    .thresholdHelp
                )
                ===
                limiar
            );

        }
    );


    const dynamic =
        document.getElementById(
            "thresholdDynamicHelp"
        );


    if (
        !dynamic
    ) {

        return;

    }


    const textos = {

        10:
            `
            <strong>Com o limiar ≥10%:</strong>
            entram na análise todos os pixels que possuíam
            pelo menos 10% de cobertura arbórea em 2000.
            É o cenário mais abrangente dos três apresentados
            no painel.
            `,

        30:
            `
            <strong>Com o limiar ≥30%:</strong>
            pixels que tinham entre 10% e 29,9% de cobertura
            arbórea em 2000 deixam de entrar na análise.
            O critério passa a concentrar-se em áreas com
            maior cobertura inicial.
            `,

        50:
            `
            <strong>Com o limiar ≥50%:</strong>
            somente entram pixels nos quais pelo menos metade
            da superfície do pixel era coberta por copas
            arbóreas em 2000.
            É o cenário mais restritivo apresentado.
            `
    };


    dynamic.innerHTML =
        textos[
            limiar
        ]
        ||
        "";

}


// ============================================================
// 3. EXPLICAÇÃO RÁPIDA NA ABA PIXEL
// ============================================================

function createPixelThresholdHelp() {

    const controls =
        document.querySelector(
            ".pixel-controls"
        );


    if (
        !controls
        ||
        document.getElementById(
            "pixelThresholdHelp"
        )
    ) {

        return false;

    }


    const box =
        document.createElement(
            "div"
        );


    box.id =
        "pixelThresholdHelp";


    box.className =
        "pixel-threshold-help";


    box.innerHTML = `

        <strong>
            Como interpretar o limiar:
        </strong>

        o valor selecionado refere-se à
        <strong>cobertura arbórea existente em 2000</strong>,
        antes de observarmos a perda.

        Por exemplo, em
        <strong>≥10%</strong>,
        um pixel entra na análise se pelo menos 10%
        de sua superfície possuía cobertura de copas
        no ano 2000.

        Depois desse filtro inicial, a camada
        <strong>Lossyear</strong>
        informa se e quando houve perda detectada.

    `;


    controls.insertAdjacentElement(
        "beforebegin",
        box
    );


    return true;

}


// ============================================================
// 4. FONTE E REFERÊNCIAS
// ============================================================

function createGFCSourcePanel() {

    const dashboard =
        document.querySelector(
            ".dashboard"
        );


    if (
        !dashboard
        ||
        document.getElementById(
            "gfcSourcePanel"
        )
    ) {

        return false;

    }


    const footer =
        dashboard.querySelector(
            "footer"
        );


    const source =
        document.createElement(
            "section"
        );


    source.id =
        "gfcSourcePanel";


    source.className =
        "gfc-source-panel";


    source.innerHTML = `

        <div>

            <h3>
                Fonte dos dados
            </h3>

            <p>
                <strong>
                    Hansen/UMD/Google/USGS/NASA
                </strong>
                — Global Forest Change.
            </p>

            <p>
                O painel utiliza a série
                Global Forest Change 2025 v1.13.
                O produto é derivado de séries temporais
                de imagens Landsat.
            </p>

            <p>

                <a
                    href="https://glad.earthengine.app/view/global-forest-change"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Visualização oficial do Global Forest Change
                </a>

                &nbsp;·&nbsp;

                <a
                    href="https://storage.googleapis.com/earthenginepartners-hansen/GFC-2024-v1.12/download.html"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Documentação e página de download
                </a>

            </p>

        </div>


        <div class="gfc-credit">

            <h3>
                Referência e uso
            </h3>

            <p>
                Hansen, M. C. et al. (2013).
                High-Resolution Global Maps of
                21st-Century Forest Cover Change.
                <em>Science</em>, 342, 850–853.
            </p>

            <p>
                Os mapas do GFC devem ser interpretados
                como indicadores espaciais de cobertura
                e mudança. Comparações temporais exigem
                cautela devido a diferenças entre sensores,
                disponibilidade de imagens e atualizações
                metodológicas do produto.
            </p>

        </div>

    `;


    if (
        footer
    ) {

        dashboard.insertBefore(
            source,
            footer
        );

    }

    else {

        dashboard.appendChild(
            source
        );

    }


    return true;

}


// ============================================================
// 5. SELETOR DE FUNDO DO MAPA MUNICIPAL
// ============================================================

function createMunicipalBasemapSelector() {

    const controlsGrid =
        document.querySelector(
            "#municipalView .controls-grid"
        );


    if (
        !controlsGrid
        ||
        document.getElementById(
            "municipalBaseSelect"
        )
    ) {

        return false;

    }


    const group =
        document.createElement(
            "div"
        );


    group.className =
        "control-group municipal-base-control";


    group.innerHTML = `

        <label for="municipalBaseSelect">
            Fundo do mapa
        </label>

        <select id="municipalBaseSelect">

            <option
                value="light"
                selected

            >
                Mapa de referência — OpenStreetMap
            </option>


            <option value="satellite">
                Satélite
            </option>

            <option value="none">
                Sem fundo
            </option>

        </select>

    `;


    controlsGrid.appendChild(
        group
    );


    document
    .getElementById(
        "municipalBaseSelect"
    )
    .addEventListener(
        "change",
        updateMunicipalBasemap
    );


    return true;

}


// ============================================================
// 6. INICIALIZAR FUNDOS MUNICIPAIS
// ============================================================

function initMunicipalBasemaps() {

    if (
        typeof state ===
        "undefined"
        ||
        !state.map
    ) {

        return false;

    }


    if (
        !gfcMunicipalLightLayer
    ) {

        gfcMunicipalLightLayer =
            L.tileLayer(

                "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

                {

                    subdomains:
                        "abc",

                    maxZoom:
                        19

                }
            );

    }


    if (
        !gfcMunicipalSatelliteLayer
    ) {

        gfcMunicipalSatelliteLayer =
            L.tileLayer(

                (
                    "https://server.arcgisonline.com/"
                    +
                    "ArcGIS/rest/services/"
                    +
                    "World_Imagery/MapServer/"
                    +
                    "tile/{z}/{y}/{x}"
                ),

                {

                    maxZoom:
                        18

                }
            );

    }


    if (
        !gfcMunicipalAttributionControl
    ) {

        const Attribution =
            L.Control.extend({

                options: {

                    position:
                        "bottomright"

                },


                onAdd:
                    function () {

                        const div =
                            L.DomUtil.create(

                                "div",

                                "gfc-map-attribution"

                            );


                        div.id =
                            "gfcMunicipalAttribution";


                        return div;

                    }

            });


        gfcMunicipalAttributionControl =
            new Attribution();


        state.map.addControl(
            gfcMunicipalAttributionControl
        );

    }


    updateMunicipalBasemap();


    return true;

}


// ============================================================
// 7. TROCAR FUNDO MUNICIPAL
// ============================================================

function updateMunicipalBasemap() {

    if (
        typeof state ===
        "undefined"
        ||
        !state.map
    ) {

        return;

    }


    const select =
        document.getElementById(
            "municipalBaseSelect"
        );


    if (
        !select
    ) {

        return;

    }


    const mode =
        select.value;


    // retirar os dois
    if (
        gfcMunicipalLightLayer
        &&
        state.map.hasLayer(
            gfcMunicipalLightLayer
        )
    ) {

        state.map.removeLayer(
            gfcMunicipalLightLayer
        );

    }


    if (
        gfcMunicipalSatelliteLayer
        &&
        state.map.hasLayer(
            gfcMunicipalSatelliteLayer
        )
    ) {

        state.map.removeLayer(
            gfcMunicipalSatelliteLayer
        );

    }


    const attr =
        document.getElementById(
            "gfcMunicipalAttribution"
        );


    // --------------------------------------------------------
    // CLARO
    // --------------------------------------------------------

    if (
        mode ===
        "light"
    ) {

        gfcMunicipalLightLayer.addTo(
            state.map
        );


        if (
            attr
        ) {

            attr.innerHTML =
                (
                    "© OpenStreetMap "
                    +
                    ""
                );

        }

    }


    // --------------------------------------------------------
    // SATÉLITE
    // --------------------------------------------------------

    else if (
        mode ===
        "satellite"
    ) {

        gfcMunicipalSatelliteLayer.addTo(
            state.map
        );


        if (
            attr
        ) {

            attr.innerHTML =
                "Imagem © Esri";

        }

    }


    // --------------------------------------------------------
    // SEM FUNDO
    // --------------------------------------------------------

    else {

        if (
            attr
        ) {

            attr.innerHTML =
                "Limites municipais: IBGE";

        }

    }


    // manter polígonos por cima
    if (
        state.geoLayer
    ) {

        state.geoLayer
        .bringToFront();

    }

}


// ============================================================
// 8. AMPLIAR OPÇÕES DO FUNDO PIXEL
// ============================================================

function enhancePixelBasemapSelector() {

    const select =
        document.getElementById(
            "pixelBaseSelect"
        );


    if (
        !select
    ) {

        return false;

    }


    if (
        !select.querySelector(
            'option[value="light"]'
        )
    ) {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            "light";


        option.textContent =
            "Mapa de referência — OpenStreetMap";


        // colocar entre satélite e neutro
        const neutral =
            select.querySelector(
                'option[value="neutral"]'
            );


        if (
            neutral
        ) {

            select.insertBefore(
                option,
                neutral
            );

        }

        else {

            select.appendChild(
                option
            );

        }

    }


    return true;

}


// ============================================================
// 9. NOVA FUNÇÃO DE FUNDO PIXEL
// ============================================================

function installEnhancedPixelBasemap() {

    if (
        typeof pixelMap ===
        "undefined"
        ||
        !pixelMap
    ) {

        return false;

    }


    if (
        !gfcPixelLightLayer
    ) {

        gfcPixelLightLayer =
            L.tileLayer(

                "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

                {

                    subdomains:
                        "abc",

                    maxZoom:
                        19,

                    attribution:
                        "© OpenStreetMap contributors"

                }
            );

    }


    /*
    Substitui a função original definida em pixel.js.
    */

    updatePixelBase =
        function () {

            const select =
                document.getElementById(
                    "pixelBaseSelect"
                );


            if (
                !select
                ||
                !pixelMap
            ) {

                return;

            }


            const mode =
                select.value;


            // ---------------------------------------------
            // Remover bases existentes
            // ---------------------------------------------

            if (
                pixelSatelliteLayer
                &&
                pixelMap.hasLayer(
                    pixelSatelliteLayer
                )
            ) {

                pixelMap.removeLayer(
                    pixelSatelliteLayer
                );

            }


            if (
                gfcPixelLightLayer
                &&
                pixelMap.hasLayer(
                    gfcPixelLightLayer
                )
            ) {

                pixelMap.removeLayer(
                    gfcPixelLightLayer
                );

            }


            // ---------------------------------------------
            // SATÉLITE
            // ---------------------------------------------

            if (
                mode ===
                "satellite"
            ) {

                pixelSatelliteLayer.addTo(
                    pixelMap
                );


                pixelMunicipalLayer
                .setStyle({

                    color:
                        "#f5f6f5",

                    weight:
                        0.55,

                    opacity:
                        0.80

                });

            }


            // ---------------------------------------------
            // MAPA CLARO
            // ---------------------------------------------

            else if (
                mode ===
                "light"
            ) {

                gfcPixelLightLayer.addTo(
                    pixelMap
                );


                pixelMunicipalLayer
                .setStyle({

                    color:
                        "#5e685f",

                    weight:
                        0.55,

                    opacity:
                        0.72

                });

            }


            // ---------------------------------------------
            // SEM FUNDO / NEUTRO
            // ---------------------------------------------

            else {

                pixelMap
                .getContainer()
                .style
                .background =
                    "#4e4e4e";


                pixelMunicipalLayer
                .setStyle({

                    color:
                        "#d5dad5",

                    weight:
                        0.55,

                    opacity:
                        0.72

                });

            }


            // ---------------------------------------------
            // Raster e limites acima da base
            // ---------------------------------------------

            if (
                pixelOverlayCurrent
            ) {

                pixelOverlayCurrent
                .bringToFront();

            }


            if (
                pixelMunicipalLayer
            ) {

                pixelMunicipalLayer
                .bringToFront();

            }

        };


    return true;

}


// ============================================================
// 10. ESCUTAR ALTERAÇÕES DE LIMIAR
// ============================================================

function bindThresholdDidactics() {

    const main =
        document.getElementById(
            "limiarSelect"
        );


    const pixel =
        document.getElementById(
            "pixelLimiarSelect"
        );


    if (
        main
    ) {

        main.addEventListener(
            "change",
            () => {

                setTimeout(
                    updateGFCThresholdExplanation,
                    20
                );

            }
        );

    }


    if (
        pixel
    ) {

        pixel.addEventListener(
            "change",
            () => {

                setTimeout(
                    updateGFCThresholdExplanation,
                    20
                );

            }
        );

    }

}


// ============================================================
// 11. INICIALIZAÇÃO
// ============================================================

function initGFCEnhancements() {

    let tentativas =
        0;


    const timer =
        setInterval(
            () => {

                tentativas++;


                const guideOK =
                    createGFCGuide();


                const sourceOK =
                    createGFCSourcePanel();


                const selectorOK =
                    createMunicipalBasemapSelector();


                const municipalMapOK =
                    initMunicipalBasemaps();


                const pixelHelpOK =
                    createPixelThresholdHelp();


                const pixelSelectOK =
                    enhancePixelBasemapSelector();


                const pixelMapOK =
                    installEnhancedPixelBasemap();


                /*
                Quando os componentes principais já existem,
                concluímos a inicialização.
                */

                if (
                    guideOK
                    &&
                    sourceOK
                    &&
                    selectorOK
                    &&
                    municipalMapOK
                    &&
                    pixelHelpOK
                    &&
                    pixelSelectOK
                    &&
                    pixelMapOK
                ) {

                    clearInterval(
                        timer
                    );


                    bindThresholdDidactics();


                    updateGFCThresholdExplanation();


                    /*
                    manter satélite como padrão no pixel
                    */
                    const px =
                        document.getElementById(
                            "pixelBaseSelect"
                        );


                    if (
                        px
                    ) {

                        px.value =
                            "satellite";


                        updatePixelBase();

                    }


                    console.log(
                        "Bloco 4H carregado."
                    );

                }


                /*
                segurança: parar depois de 20 segundos
                */
                if (
                    tentativas >
                    200
                ) {

                    clearInterval(
                        timer
                    );


                    console.warn(
                        "Bloco 4H: alguns componentes "
                        +
                        "não foram encontrados."
                    );

                }

            },
            100
        );

}


// ============================================================
// START
// ============================================================

initGFCEnhancements();

