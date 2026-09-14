
// ============================================================
// GLOBAL FOREST CHANGE RS
// APP PRINCIPAL
// ============================================================


// ------------------------------------------------------------
// ESTADO GLOBAL
// ------------------------------------------------------------

const state = {

    ano: 2025,

    limiar: 10,

    modo: "acumulado",

    medida: "pct",

    playing: false,

    timer: null,

    geometry: null,

    atributos: [],

    cards: [],

    estadoSerie: [],

    map: null,

    geoLayer: null

};


// ------------------------------------------------------------
// PALETAS
// ------------------------------------------------------------

const palette = [

    "#fff7bc",

    "#fec44f",

    "#fe9929",

    "#ec7014",

    "#cc4c02",

    "#8c2d04"

];


const zeroColor =
    "#edf0ed";


// ------------------------------------------------------------
// FORMATADORES
// ------------------------------------------------------------

const fmtBR = (
    value,
    digits = 1
) => {

    if (
        value === null ||
        value === undefined ||
        Number.isNaN(value)
    ) {

        return "—";

    }

    return Number(value).toLocaleString(
        "pt-BR",
        {

            minimumFractionDigits:
                digits,

            maximumFractionDigits:
                digits

        }
    );

};


const fmtPct = (
    value,
    digits = 1
) => {

    if (
        value === null ||
        value === undefined ||
        Number.isNaN(value)
    ) {

        return "—";

    }

    return `${fmtBR(
        value,
        digits
    )}%`;

};


// ------------------------------------------------------------
// CARREGAR DADOS
// ------------------------------------------------------------

async function loadJSON(
    path
) {

    const response =
        await fetch(
            path
        );

    if (
        !response.ok
    ) {

        throw new Error(
            `Erro ao carregar ${path}`
        );

    }

    return await response.json();

}


async function loadData() {

    [

        state.geometry,

        state.atributos,

        state.cards,

        state.estadoSerie

    ] = await Promise.all([

        loadJSON(
            "dados/mapa_municipios.geojson"
        ),

        loadJSON(
            "dados/mapa_atributos.json"
        ),

        loadJSON(
            "dados/cards.json"
        ),

        loadJSON(
            "dados/estado_serie.json"
        )

    ]);

}


// ------------------------------------------------------------
// FILTRAR REGISTROS MUNICIPAIS
// ------------------------------------------------------------

function getMunicipalData() {

    return state.atributos.filter(
        d =>
            Number(d.ano) ===
                Number(state.ano)
            &&
            Number(d.limiar) ===
                Number(state.limiar)
    );

}


// ------------------------------------------------------------
// DEFINIR CAMPO ATUAL
// ------------------------------------------------------------

function getField() {

    if (
        state.modo ===
        "anual"
    ) {

        if (
            state.medida ===
            "ha"
        ) {

            return "perda_anual_ha";

        }

        if (
            state.medida ===
            "km2"
        ) {

            return "perda_anual_km2";

        }

        return "pct_area_municipal_anual";

    }


    if (
        state.medida ===
        "ha"
    ) {

        return "perda_acumulada_ha";

    }

    if (
        state.medida ===
        "km2"
    ) {

        return "perda_acumulada_km2";

    }

    return "pct_area_municipal_acumulado";

}


// ------------------------------------------------------------
// RÓTULO DA MEDIDA
// ------------------------------------------------------------

function getUnitLabel() {

    if (
        state.medida ===
        "ha"
    ) {

        return "ha";

    }

    if (
        state.medida ===
        "km2"
    ) {

        return "km²";

    }

    return "% da área municipal";

}


// ------------------------------------------------------------
// QUANTIS
// ------------------------------------------------------------

function quantile(
    sorted,
    q
) {

    if (
        sorted.length === 0
    ) {

        return 0;

    }

    const pos =
        (
            sorted.length - 1
        ) * q;

    const base =
        Math.floor(
            pos
        );

    const rest =
        pos - base;


    if (
        sorted[
            base + 1
        ] !== undefined
    ) {

        return (
            sorted[base]
            +
            rest
            *
            (
                sorted[
                    base + 1
                ]
                -
                sorted[base]
            )
        );

    }

    return sorted[base];

}


function getBreaks(
    rows,
    field
) {

    const vals =
        rows
        .map(
            d =>
                Number(
                    d[field]
                )
        )
        .filter(
            x =>
                Number.isFinite(x)
                &&
                x > 0
        )
        .sort(
            (
                a,
                b
            ) =>
                a - b
        );


    if (
        vals.length === 0
    ) {

        return [
            0,
            1,
            2,
            3,
            4,
            5
        ];

    }


    return [

        quantile(
            vals,
            0
        ),

        quantile(
            vals,
            0.20
        ),

        quantile(
            vals,
            0.40
        ),

        quantile(
            vals,
            0.60
        ),

        quantile(
            vals,
            0.80
        ),

        quantile(
            vals,
            1
        )

    ];

}


// ------------------------------------------------------------
// COR
// ------------------------------------------------------------

function colorFor(
    value,
    breaks
) {

    if (
        !Number.isFinite(value)
        ||
        value <= 0
    ) {

        return zeroColor;

    }


    for (
        let i = 0;
        i < breaks.length - 1;
        i++
    ) {

        if (
            value <=
            breaks[
                i + 1
            ]
        ) {

            return palette[i];

        }

    }

    return palette[
        palette.length - 1
    ];

}


// ------------------------------------------------------------
// MAPA
// ------------------------------------------------------------

function initMap() {

    state.map =
        L.map(
            "map",
            {

                zoomControl:
                    true,

                attributionControl:
                    false,

                preferCanvas:
                    true

            }
        );


    state.map.setView(
        [
            -30.1,
            -53.2
        ],
        6
    );


    // Fundo propositalmente neutro.
    // Sem basemap externo.

    const pane =
        state.map.getPane(
            "mapPane"
        );

    pane.style.background =
        "#edf1ed";

}


function updateMap() {

    const rows =
        getMunicipalData();

    const field =
        getField();

    const breaks =
        getBreaks(
            rows,
            field
        );


    const lookup =
        new Map(
            rows.map(
                d => [
                    String(
                        d.code_muni
                    ),
                    d
                ]
            )
        );


    if (
        state.geoLayer
    ) {

        state.map.removeLayer(
            state.geoLayer
        );

    }


    state.geoLayer =
        L.geoJSON(
            state.geometry,
            {

                style:
                    feature => {

                        const code =
                            String(
                                feature
                                .properties
                                .code_muni
                            );

                        const row =
                            lookup.get(
                                code
                            );

                        const value =
                            row
                            ?
                            Number(
                                row[field]
                            )
                            :
                            0;


                        return {

                            fillColor:
                                colorFor(
                                    value,
                                    breaks
                                ),

                            fillOpacity:
                                0.90,

                            color:
                                "#5f675f",

                            weight:
                                0.55

                        };

                    },


                onEachFeature:
                    (
                        feature,
                        layer
                    ) => {

                        const code =
                            String(
                                feature
                                .properties
                                .code_muni
                            );

                        const row =
                            lookup.get(
                                code
                            );


                        layer.on({

                            mouseover:
                                e => {

                                    e.target
                                    .setStyle({

                                        color:
                                            "#17201b",

                                        weight:
                                            2.1,

                                        fillOpacity:
                                            1

                                    });

                                },


                            mouseout:
                                e => {

                                    state.geoLayer
                                    .resetStyle(
                                        e.target
                                    );

                                }

                        });


                        if (
                            row
                        ) {

                            const html = `

                                <div class="map-tooltip">

                                <strong>
                                ${row.name_muni}
                                </strong>

                                <hr>

                                Ano:
                                <b>
                                ${state.ano}
                                </b>
                                <br>

                                Perda anual:
                                <b>
                                ${fmtBR(
                                    row.perda_anual_ha,
                                    1
                                )} ha
                                </b>
                                <br>

                                Acumulado:
                                <b>
                                ${fmtBR(
                                    row.perda_acumulada_ha,
                                    1
                                )} ha
                                </b>
                                <br>

                                % anual:
                                <b>
                                ${fmtPct(
                                    row.pct_area_municipal_anual,
                                    2
                                )}
                                </b>
                                <br>

                                % acumulado:
                                <b>
                                ${fmtPct(
                                    row.pct_area_municipal_acumulado,
                                    2
                                )}
                                </b>

                                </div>
                            `;


                            layer.bindTooltip(
                                html,
                                {

                                    sticky:
                                        true,

                                    direction:
                                        "auto"

                                }
                            );

                        }

                    }

            }
        )
        .addTo(
            state.map
        );


    if (
        !state.map._fittedOnce
    ) {

        state.map.fitBounds(
            state.geoLayer
            .getBounds(),
            {

                padding:
                    [
                        15,
                        15
                    ]

            }
        );

        state.map._fittedOnce =
            true;

    }


    updateLegend(
        breaks
    );

}


// ------------------------------------------------------------
// LEGENDA
// ------------------------------------------------------------

function formatLegendValue(
    x
) {

    if (
        state.medida ===
        "pct"
    ) {

        return fmtBR(
            x,
            2
        );

    }

    if (
        state.medida ===
        "ha"
    ) {

        return fmtBR(
            x,
            0
        );

    }

    return fmtBR(
        x,
        1
    );

}


function updateLegend(
    breaks
) {

    const el =
        document.getElementById(
            "legendContent"
        );

    let html = `

        <div class="legend-item">

            <span
                class="legend-swatch"
                style="
                    background:
                    ${zeroColor};
                "
            ></span>

            Sem perda

        </div>
    `;


    for (
        let i = 0;
        i < breaks.length - 1;
        i++
    ) {

        html += `

            <div class="legend-item">

                <span
                    class="legend-swatch"
                    style="
                        background:
                        ${palette[i]};
                    "
                ></span>

                ${formatLegendValue(
                    breaks[i]
                )}
                –
                ${formatLegendValue(
                    breaks[i + 1]
                )}

            </div>
        `;

    }


    el.innerHTML =
        html;

}


// ------------------------------------------------------------
// CARDS
// ------------------------------------------------------------

function updateCards() {

    const row =
        state.cards.find(
            d =>
                Number(d.ano) ===
                    Number(state.ano)
                &&
                Number(d.limiar) ===
                    Number(state.limiar)
        );


    if (
        !row
    ) {

        return;

    }


    document
    .getElementById(
        "cardPerdaAno"
    )
    .textContent =
        fmtBR(
            row.perda_estado_ha,
            0
        );


    document
    .getElementById(
        "cardPerdaAnoSub"
    )
    .textContent =
        "hectares";


    document
    .getElementById(
        "cardAcumulado"
    )
    .textContent =
        fmtBR(
            row.acumulado_estado_ha,
            0
        );


    document
    .getElementById(
        "cardAcumuladoSub"
    )
    .textContent =
        `hectares entre 2001 e ${state.ano}`;


    const variacao =
        row.variacao_estado_pct;


    const variacaoEl =
        document
        .getElementById(
            "cardVariacao"
        );


    if (
        variacao === null
        ||
        variacao === undefined
    ) {

        variacaoEl
        .textContent =
            "—";

        variacaoEl
        .style.color =
            "";

    }

    else {

        variacaoEl
        .textContent =
            `${
                variacao > 0
                ?
                "+"
                :
                ""
            }${fmtPct(
                variacao,
                1
            )}`;


        variacaoEl
        .style.color =
            variacao > 0
            ?
            "#c83f3f"
            :
            "#1f7a52";

    }


    document
    .getElementById(
        "cardMunicipios"
    )
    .textContent =
        row.municipios_com_perda;


    document
    .getElementById(
        "cardTopAno"
    )
    .textContent =
        row.municipio_maior_perda_ano;


    document
    .getElementById(
        "cardTopAnoValor"
    )
    .textContent =
        `${fmtBR(
            row.maior_perda_ano_ha,
            1
        )} ha`;


    document
    .getElementById(
        "cardTopAcumulado"
    )
    .textContent =
        row.municipio_maior_acumulado;


    document
    .getElementById(
        "cardTopAcumuladoValor"
    )
    .textContent =
        `${fmtBR(
            row.maior_acumulado_ha,
            1
        )} ha`;

}


// ------------------------------------------------------------
// SÉRIE TEMPORAL
// ------------------------------------------------------------

function updateSerieChart() {

    const rows =
        state.estadoSerie
        .filter(
            d =>
                Number(d.limiar) ===
                Number(state.limiar)
        )
        .sort(
            (
                a,
                b
            ) =>
                a.ano - b.ano
        );


    const anos =
        rows.map(
            d => d.ano
        );


    const anual =
        rows.map(
            d => d.perda_ha
        );


    const acumulado =
        rows.map(
            d => d.acumulado_ha
        );


    const traceAnual = {

        x:
            anos,

        y:
            anual,

        name:
            "Perda anual",

        type:
            "scatter",

        mode:
            "lines+markers",

        line: {

            color:
                "#c83f3f",

            width:
                2.5

        },

        marker: {

            size:
                5

        },

        hovertemplate:
            "%{x}<br>%{y:,.0f} ha<extra></extra>"

    };


    const traceAcum = {

        x:
            anos,

        y:
            acumulado,

        name:
            "Acumulado",

        type:
            "scatter",

        mode:
            "lines",

        yaxis:
            "y2",

        line: {

            color:
                "#1f7a52",

            width:
                2.2

        },

        hovertemplate:
            "%{x}<br>%{y:,.0f} ha<extra></extra>"

    };


    const layout = {

        margin: {
            l: 55,
            r: 55,
            t: 10,
            b: 45
        },

        paper_bgcolor:
            "rgba(0,0,0,0)",

        plot_bgcolor:
            "rgba(0,0,0,0)",

        font: {

            family:
                "Inter, Arial, sans-serif",

            color:
                "#465049",

            size:
                11

        },

        hovermode:
            "x unified",

        xaxis: {

            title:
                "",

            showgrid:
                false,

            dtick:
                2

        },

        yaxis: {

            title:
                "Perda anual (ha)",

            gridcolor:
                "#e8ece8",

            zeroline:
                false

        },

        yaxis2: {

            title:
                "Acumulado (ha)",

            overlaying:
                "y",

            side:
                "right",

            showgrid:
                false

        },

        legend: {

            orientation:
                "h",

            x:
                0,

            y:
                1.08

        },

        shapes: [

            {

                type:
                    "line",

                x0:
                    state.ano,

                x1:
                    state.ano,

                y0:
                    0,

                y1:
                    1,

                xref:
                    "x",

                yref:
                    "paper",

                line: {

                    color:
                        "#17201b",

                    width:
                        1.3,

                    dash:
                        "dot"

                }

            }

        ]

    };


    Plotly.react(
        "chartSerie",
        [
            traceAnual,
            traceAcum
        ],
        layout,
        {

            responsive:
                true,

            displayModeBar:
                false

        }
    );

}


// ------------------------------------------------------------
// RANKING
// ------------------------------------------------------------

function updateRanking() {

    const rows =
        getMunicipalData();

    const field =
        getField();


    const sorted =
        rows
        .slice()
        .sort(
            (
                a,
                b
            ) =>
                Number(
                    b[field]
                )
                -
                Number(
                    a[field]
                )
        )
        .slice(
            0,
            15
        )
        .reverse();


    const names =
        sorted.map(
            d =>
                d.name_muni
        );


    const values =
        sorted.map(
            d =>
                Number(
                    d[field]
                )
        );


    const trace = {

        x:
            values,

        y:
            names,

        type:
            "bar",

        orientation:
            "h",

        marker: {

            color:
                "#2e8b61"

        },

        hovertemplate:
            "%{y}<br>%{x:,.2f}<extra></extra>"

    };


    const layout = {

        margin: {

            l:
                135,

            r:
                20,

            t:
                10,

            b:
                40

        },

        paper_bgcolor:
            "rgba(0,0,0,0)",

        plot_bgcolor:
            "rgba(0,0,0,0)",

        font: {

            family:
                "Inter, Arial, sans-serif",

            color:
                "#465049",

            size:
                10

        },

        xaxis: {

            gridcolor:
                "#e8ece8",

            zeroline:
                false

        },

        yaxis: {

            automargin:
                true

        }

    };


    Plotly.react(
        "chartRanking",
        [
            trace
        ],
        layout,
        {

            responsive:
                true,

            displayModeBar:
                false

        }
    );


    document
    .getElementById(
        "rankingTitle"
    )
    .textContent =
        state.modo ===
        "anual"
        ?
        `Ranking municipal — ${state.ano}`
        :
        `Ranking acumulado — 2001–${state.ano}`;

}


// ------------------------------------------------------------
// TÍTULOS DINÂMICOS
// ------------------------------------------------------------

function updateLabels() {

    document
    .getElementById(
        "anoSelecionado"
    )
    .textContent =
        state.ano;


    document
    .getElementById(
        "statusAno"
    )
    .textContent =
        state.ano;


    document
    .getElementById(
        "mapUnit"
    )
    .textContent =
        getUnitLabel();


    const titulo =
        state.modo ===
        "anual"
        ?
        `Perda de cobertura arbórea em ${state.ano}`
        :
        `Perda acumulada de 2001 a ${state.ano}`;


    document
    .getElementById(
        "tituloMapa"
    )
    .textContent =
        titulo;

}


// ------------------------------------------------------------
// ATUALIZAR PAINEL -->
// ------------------------------------------------------------

function updateDashboard() {

    updateLabels();

    updateCards();

    updateMap();

    updateSerieChart();

    updateRanking();

}


// ------------------------------------------------------------
// CONTROLES
// ------------------------------------------------------------

function bindControls() {

    const ano =
        document
        .getElementById(
            "anoRange"
        );


    const limiar =
        document
        .getElementById(
            "limiarSelect"
        );


    const modo =
        document
        .getElementById(
            "modoSelect"
        );


    const medida =
        document
        .getElementById(
            "medidaSelect"
        );


    const play =
        document
        .getElementById(
            "playButton"
        );


    ano.addEventListener(
        "input",
        e => {

            state.ano =
                Number(
                    e.target.value
                );

            updateDashboard();

        }
    );


    limiar.addEventListener(
        "change",
        e => {

            state.limiar =
                Number(
                    e.target.value
                );

            updateDashboard();

        }
    );


    modo.addEventListener(
        "change",
        e => {

            state.modo =
                e.target.value;

            updateDashboard();

        }
    );


    medida.addEventListener(
        "change",
        e => {

            state.medida =
                e.target.value;

            updateDashboard();

        }
    );


    play.addEventListener(
        "click",
        () => {

            togglePlay();

        }
    );

}


// ------------------------------------------------------------
// ANIMAÇÃO DOS ANOS
// ------------------------------------------------------------

function togglePlay() {

    const button =
        document
        .getElementById(
            "playButton"
        );


    if (
        state.playing
    ) {

        clearInterval(
            state.timer
        );

        state.timer =
            null;

        state.playing =
            false;

        button.textContent =
            "▶ Reproduzir";

        return;

    }


    state.playing =
        true;

    button.textContent =
        "❚❚ Pausar";


    state.timer =
        setInterval(
            () => {

                state.ano++;


                if (
                    state.ano >
                    2025
                ) {

                    state.ano =
                        2001;

                }


                document
                .getElementById(
                    "anoRange"
                )
                .value =
                    state.ano;


                updateDashboard();

            },
            1300
        );

}


// ------------------------------------------------------------
// START
// ------------------------------------------------------------

async function main() {

    try {

        await loadData();

        initMap();

        bindControls();

        updateDashboard();

    }

    catch (
        error
    ) {

        console.error(
            error
        );


        document.body
        .insertAdjacentHTML(
            "afterbegin",
            `

            <div style="
                padding:15px;
                background:#ffe5e5;
                color:#8b1d1d;
                font-family:Arial;
            ">

            Erro ao carregar o painel:
            ${error.message}

            </div>

            `
        );

    }

}


main();
