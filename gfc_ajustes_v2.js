

// ============================================================
// GLOBAL FOREST CHANGE RS
// BLOCO 4J
//
// FUNDO CARTOGRÁFICO + TRANSPARÊNCIA +
// DIDÁTICA DE TREECOVER / LIMIAR
// ============================================================


// ============================================================
// ESTADO LOCAL
// ============================================================

let gfcReferenceMap =
    null;

let gfcSatelliteMap =
    null;

let gfcMunicipalOpacity =
    0.62;

let gfcMunicipalBaseMode =
    "reference";

let gfcLastGeoLayer =
    null;


// ============================================================
// 1. REMOVER CONTROLE DE FUNDO ANTIGO
// ============================================================

function removeOldMunicipalBasemapControl() {

    const old =
        document.getElementById(
            "municipalBaseSelect"
        );


    if (
        old
        &&
        old.closest(
            ".control-group"
        )
    ) {

        old.closest(
            ".control-group"
        ).remove();

    }

}


// ============================================================
// 2. CRIAR NOVOS CONTROLES
// ============================================================

function createMunicipalMapControls() {

    const grid =
        document.querySelector(
            "#municipalView .controls-grid"
        );


    if (
        !grid
    ) {

        return false;

    }


    if (
        document.getElementById(
            "municipalBaseSelectV2"
        )
    ) {

        return true;

    }


    // --------------------------------------------------------
    // FUNDO
    // --------------------------------------------------------

    const fundo =
        document.createElement(
            "div"
        );


    fundo.className =
        "municipal-map-control";


    fundo.innerHTML = `

        <label for="municipalBaseSelectV2">
            Fundo do mapa
        </label>

        <select id="municipalBaseSelectV2">

            <option
                value="reference"
                selected
            >
                Mapa de referência
            </option>

            <option value="satellite">
                Imagem de satélite
            </option>

            <option value="none">
                Sem fundo
            </option>

        </select>

    `;


    // --------------------------------------------------------
    // OPACIDADE
    // --------------------------------------------------------

    const opacity =
        document.createElement(
            "div"
        );


    opacity.className =
        "municipal-map-control";


    opacity.innerHTML = `

        <label for="municipalOpacityRange">
            Transparência das áreas
        </label>

        <div class="opacity-row">

            <input
                id="municipalOpacityRange"
                type="range"
                min="0.25"
                max="0.90"
                step="0.05"
                value="0.62"
            >

            <span id="municipalOpacityValue">
                62%
            </span>

        </div>

    `;


    grid.appendChild(
        fundo
    );

    grid.appendChild(
        opacity
    );


    // --------------------------------------------------------
    // EVENTOS
    // --------------------------------------------------------

    document
    .getElementById(
        "municipalBaseSelectV2"
    )
    .addEventListener(
        "change",
        e => {

            gfcMunicipalBaseMode =
                e.target.value;

            setMunicipalBasemap();

        }
    );


    document
    .getElementById(
        "municipalOpacityRange"
    )
    .addEventListener(
        "input",
        e => {

            gfcMunicipalOpacity =
                Number(
                    e.target.value
                );


            document
            .getElementById(
                "municipalOpacityValue"
            )
            .textContent =
                Math.round(
                    gfcMunicipalOpacity
                    *
                    100
                )
                +
                "%";


            applyMunicipalOpacity();

        }
    );


    return true;

}


// ============================================================
// 3. CRIAR BASEMAPS
// ============================================================

function initMunicipalBasemapsV2() {

    if (
        typeof state ===
        "undefined"
        ||
        !state.map
    ) {

        return false;

    }


    // --------------------------------------------------------
    // Pane próprio: abaixo do GeoJSON
    // --------------------------------------------------------

    if (
        !state.map.getPane(
            "municipalBasemap"
        )
    ) {

        state.map.createPane(
            "municipalBasemap"
        );


        state.map.getPane(
            "municipalBasemap"
        ).style.zIndex =
            150;


        state.map.getPane(
            "municipalBasemap"
        ).classList.add(
            "municipal-basemap-pane"
        );

    }


    // --------------------------------------------------------
    // Remover eventuais camadas criadas no Bloco 4H
    // --------------------------------------------------------

    try {

        if (
            typeof gfcMunicipalLightLayer
            !==
            "undefined"
            &&
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

    }

    catch (
        error
    ) {}


    try {

        if (
            typeof gfcMunicipalSatelliteLayer
            !==
            "undefined"
            &&
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

    }

    catch (
        error
    ) {}


    // ========================================================
    // MAPA DE REFERÊNCIA
    //
    // OpenStreetMap padrão:
    // municípios, cidades, estradas, rios e relevo contextual.
    // ========================================================

    if (
        !gfcReferenceMap
    ) {

        gfcReferenceMap =
            L.tileLayer(

                "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

                {

                    pane:
                        "municipalBasemap",

                    subdomains:
                        "abc",

                    maxZoom:
                        19,

                    attribution:
                        (
                            "&copy; OpenStreetMap contributors"
                        )

                }
            );

    }


    // ========================================================
    // SATÉLITE
    // ========================================================

    if (
        !gfcSatelliteMap
    ) {

        gfcSatelliteMap =
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

                    pane:
                        "municipalBasemap",

                    maxZoom:
                        18,

                    attribution:
                        "Imagery &copy; Esri"

                }
            );

    }


    setMunicipalBasemap();


    return true;

}


// ============================================================
// 4. TROCAR BASE
// ============================================================

function setMunicipalBasemap() {

    if (
        typeof state ===
        "undefined"
        ||
        !state.map
    ) {

        return;

    }


    // --------------------------------------------------------
    // retirar bases
    // --------------------------------------------------------

    if (
        gfcReferenceMap
        &&
        state.map.hasLayer(
            gfcReferenceMap
        )
    ) {

        state.map.removeLayer(
            gfcReferenceMap
        );

    }


    if (
        gfcSatelliteMap
        &&
        state.map.hasLayer(
            gfcSatelliteMap
        )
    ) {

        state.map.removeLayer(
            gfcSatelliteMap
        );

    }


    // --------------------------------------------------------
    // referência
    // --------------------------------------------------------

    if (
        gfcMunicipalBaseMode ===
        "reference"
    ) {

        gfcReferenceMap.addTo(
            state.map
        );

    }


    // --------------------------------------------------------
    // satélite
    // --------------------------------------------------------

    else if (
        gfcMunicipalBaseMode ===
        "satellite"
    ) {

        gfcSatelliteMap.addTo(
            state.map
        );

    }


    // --------------------------------------------------------
    // manter coroplético acima
    // --------------------------------------------------------

    if (
        state.geoLayer
    ) {

        state.geoLayer
        .bringToFront();

    }


    applyMunicipalOpacity();

}


// ============================================================
// 5. APLICAR TRANSPARÊNCIA
// ============================================================

function applyMunicipalOpacity() {

    if (
        typeof state ===
        "undefined"
        ||
        !state.geoLayer
    ) {

        return;

    }


    state.geoLayer.setStyle(
        {

            fillOpacity:
                gfcMunicipalOpacity,

            opacity:
                0.88,

            weight:
                0.65

        }
    );


    state.geoLayer
    .bringToFront();

}


// ============================================================
// 6. OBSERVAR QUANDO O MAPA MUNICIPAL É RECRIADO
//
// app.js recria state.geoLayer ao mudar:
// - ano
// - limiar
// - modo
// - medida
//
// Então reaplicamos automaticamente a transparência.
// ============================================================

function watchMunicipalGeoLayer() {

    setInterval(
        () => {

            if (
                typeof state ===
                "undefined"
                ||
                !state.geoLayer
            ) {

                return;

            }


            if (
                state.geoLayer
                !==
                gfcLastGeoLayer
            ) {

                gfcLastGeoLayer =
                    state.geoLayer;


                applyMunicipalOpacity();


                setMunicipalBasemap();

            }

        },
        200
    );

}


// ============================================================
// 7. SUBSTITUIR TEXTOS ANTIGOS DA METODOLOGIA
// ============================================================

function replaceOldMethodologyTexts() {

    const artigos =
        document.querySelectorAll(
            ".methodology article"
        );


    artigos.forEach(
        article => {

            const h3 =
                article.querySelector(
                    "h3"
                );


            if (
                !h3
            ) {

                return;

            }


            const titulo =
                h3.textContent
                .trim()
                .toLowerCase();


            // =================================================
            // COBERTURA ARBÓREA
            // =================================================

            if (
                titulo ===
                "cobertura arbórea"
            ) {

                article.innerHTML = `

                    <h3>
                        Cobertura arbórea
                    </h3>

                    <p>

                        O Global Forest Change atribui a
                        cada pixel um valor entre
                        <strong>0% e 100%</strong>,
                        indicando quanto daquele pixel
                        estava coberto por copas de
                        vegetação com mais de 5 metros
                        de altura no ano 2000.

                        <span class="gfc-definition-example">

                            <strong>Exemplo:</strong>

                            Treecover2000 = 40% significa
                            que aproximadamente 40% da área
                            daquele pixel estava coberta
                            por copas de árvores em 2000.

                        </span>

                    </p>

                `;

            }


            // =================================================
            // LIMIAR
            // =================================================

            if (
                titulo ===
                "limiar"
            ) {

                article.innerHTML = `

                    <h3>
                        Limiar de cobertura
                    </h3>

                    <p>

                        O limiar é um
                        <strong>filtro aplicado à cobertura
                        existente em 2000</strong>.

                        Ele define quais pixels podem entrar
                        na análise antes de observarmos a perda.

                        <span class="gfc-definition-example">

                            <strong>Exemplo:</strong>

                            um pixel com Treecover2000 = 42%
                            entra nos cenários ≥10% e ≥30%,
                            mas não entra no cenário ≥50%.

                        </span>

                        <span class="gfc-definition-example">

                            O limiar
                            <strong>não significa</strong>
                            que 10%, 30% ou 50% da floresta
                            foi perdida.

                        </span>

                    </p>

                `;

            }

        }
    );

}


// ============================================================
// 8. MELHORAR TAMBÉM OS CARDS "COMO LER"
// ============================================================

function rewriteGuideCards() {

    const guide =
        document.getElementById(
            "gfcGuide"
        );


    if (
        !guide
    ) {

        return false;

    }


    const cards =
        guide.querySelectorAll(
            ".gfc-guide-card"
        );


    if (
        cards.length <
        2
    ) {

        return false;

    }


    // --------------------------------------------------------
    // Cobertura
    // --------------------------------------------------------

    cards[0].innerHTML = `

        <div class="gfc-guide-number">
            1
        </div>

        <h3>
            Primeiro: quanto havia de cobertura arbórea?
        </h3>

        <p>

            Cada pixel recebe um valor de
            <strong>0 a 100%</strong>.

            Esse número indica qual parcela do pixel
            estava coberta por copas de vegetação
            com mais de 5 m de altura em 2000.

            <span class="gfc-definition-example">

                Treecover2000 = 40% →
                cerca de 40% daquele pixel tinha
                cobertura de copas no ano 2000.

            </span>

        </p>

    `;


    // --------------------------------------------------------
    // Limiar
    // --------------------------------------------------------

    cards[1].innerHTML = `

        <div class="gfc-guide-number">
            2
        </div>

        <h3>
            Depois: quais pixels entram na análise?
        </h3>

        <p>

            O limiar funciona como uma
            <strong>porta de entrada</strong>.

            Em ≥10%, entram pixels com cobertura inicial
            entre 10% e 100%.

            Em ≥30%, entram somente pixels entre
            30% e 100%.

            Em ≥50%, entram apenas pixels entre
            50% e 100%.

        </p>

    `;


    return true;

}


// ============================================================
// 9. NOVA EXPLICAÇÃO DINÂMICA DO LIMIAR
// ============================================================

function installBetterThresholdExplanation() {

    if (
        typeof updateGFCThresholdExplanation
        !==
        "function"
    ) {

        return false;

    }


    updateGFCThresholdExplanation =
        function () {

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


            // -------------------------------------------------
            // Badge
            // -------------------------------------------------

            const badge =
                document.getElementById(
                    "gfcCurrentThreshold"
                );


            if (
                badge
            ) {

                badge.textContent =
                    `Cobertura mínima em 2000: ${limiar}%`;

            }


            // -------------------------------------------------
            // Destaques
            // -------------------------------------------------

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


            const box =
                document.getElementById(
                    "thresholdDynamicHelp"
                );


            if (
                !box
            ) {

                return;

            }


            // -------------------------------------------------
            // Texto 10
            // -------------------------------------------------

            if (
                limiar ===
                10
            ) {

                box.innerHTML = `

                    <strong>
                        Limiar ≥10% — cenário mais abrangente.
                    </strong>

                    Entram todos os pixels que possuíam
                    <strong>10% ou mais de cobertura arbórea
                    em 2000</strong>.

                    Um pixel com 8% fica de fora;
                    um pixel com 42% entra.

                    <span class="limiar-rule">
                        Regra:
                        Treecover2000 ≥ 10%.
                    </span>

                `;

            }


            // -------------------------------------------------
            // Texto 30
            // -------------------------------------------------

            else if (
                limiar ===
                30
            ) {

                box.innerHTML = `

                    <strong>
                        Limiar ≥30% — cenário intermediário.
                    </strong>

                    Entram somente pixels que possuíam
                    <strong>30% ou mais de cobertura arbórea
                    em 2000</strong>.

                    Um pixel com 20% fica de fora;
                    um pixel com 42% entra.

                    <span class="limiar-rule">
                        Regra:
                        Treecover2000 ≥ 30%.
                    </span>

                `;

            }


            // -------------------------------------------------
            // Texto 50
            // -------------------------------------------------

            else {

                box.innerHTML = `

                    <strong>
                        Limiar ≥50% — cenário mais restritivo.
                    </strong>

                    Entram somente pixels nos quais
                    <strong>pelo menos metade da área do pixel
                    estava coberta por copas arbóreas
                    em 2000</strong>.

                    Um pixel com 42% fica de fora;
                    um pixel com 65% entra.

                    <span class="limiar-rule">
                        Regra:
                        Treecover2000 ≥ 50%.
                    </span>

                `;

            }


            box.insertAdjacentHTML(

                "beforeend",

                `

                <div class="gfc-simple-note">

                    Quanto maior o limiar,
                    menor tende a ser a área inicial
                    considerada na análise.

                    O limiar altera o
                    <strong>critério de inclusão dos pixels</strong>,
                    não a definição de perda.

                </div>

                `
            );

        };


    updateGFCThresholdExplanation();


    return true;

}


// ============================================================
// 10. MELHORAR EXPLICAÇÃO DA ABA PIXEL
// ============================================================

function rewritePixelThresholdHelp() {

    const box =
        document.getElementById(
            "pixelThresholdHelp"
        );


    if (
        !box
    ) {

        return false;

    }


    box.innerHTML = `

        <strong>
            O limiar é aplicado antes da perda.
        </strong>

        Primeiro observamos quanto de cada pixel estava
        coberto por copas arbóreas em 2000.

        Depois selecionamos somente os pixels que atendem
        ao limiar escolhido.

        <br><br>

        <strong>≥10%</strong>:
        entram pixels com cobertura inicial de 10% a 100%.

        &nbsp;·&nbsp;

        <strong>≥30%</strong>:
        entram pixels de 30% a 100%.

        &nbsp;·&nbsp;

        <strong>≥50%</strong>:
        entram pixels de 50% a 100%.

        <br><br>

        Só depois desse filtro usamos
        <strong>Lossyear</strong>
        para identificar em que ano ocorreu a perda detectada.

        O limiar não representa percentual de perda.

    `;


    return true;

}


// ============================================================
// 11. INICIALIZAÇÃO
// ============================================================

function initGFC4J() {

    let tentativas =
        0;


    const timer =
        setInterval(
            () => {

                tentativas++;


                // ---------------------------------------------
                // Componentes que dependem do painel já criado
                // ---------------------------------------------

                const controls =
                    createMunicipalMapControls();


                const basemap =
                    initMunicipalBasemapsV2();


                const guide =
                    rewriteGuideCards();


                const threshold =
                    installBetterThresholdExplanation();


                const pixelHelp =
                    rewritePixelThresholdHelp();


                replaceOldMethodologyTexts();


                // ---------------------------------------------
                // Concluído
                // ---------------------------------------------

                if (
                    controls
                    &&
                    basemap
                    &&
                    guide
                    &&
                    threshold
                    &&
                    pixelHelp
                ) {

                    clearInterval(
                        timer
                    );


                    watchMunicipalGeoLayer();


                    applyMunicipalOpacity();


                    setMunicipalBasemap();


                    console.log(
                        "Bloco 4J carregado com sucesso."
                    );

                }


                // ---------------------------------------------
                // Segurança
                // ---------------------------------------------

                if (
                    tentativas >
                    200
                ) {

                    clearInterval(
                        timer
                    );


                    console.warn(
                        "Bloco 4J: inicialização incompleta."
                    );

                }

            },
            100
        );

}


// ============================================================
// START
// ============================================================

initGFC4J();

