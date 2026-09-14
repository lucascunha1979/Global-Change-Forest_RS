
// ============================================================
// METODOLOGIA DA ABA MUNICIPAL
// ============================================================

(function () {

    function criarMetodologiaMunicipal() {

        const municipalView =
            document.getElementById(
                "municipalView"
            );

        if (!municipalView) {
            return false;
        }


        // Evitar duplicação
        if (
            document.getElementById(
                "municipalMethodology"
            )
        ) {
            return true;
        }


        const section =
            document.createElement(
                "section"
            );


        section.id =
            "municipalMethodology";

        section.className =
            "panel methodology municipal-methodology";


        section.innerHTML = `

        <div class="section-heading">

            <div>

                <span class="section-kicker">
                    METODOLOGIA
                </span>

                <h2>
                    Do pixel ao município
                </h2>

            </div>

        </div>


        <p class="municipal-method-intro">

            Os indicadores municipais não são obtidos
            a partir de uma classificação do município
            como um todo. A análise começa na grade de
            pixels do Global Forest Change e, somente
            depois, as áreas dos pixels são agregadas
            aos limites municipais.

        </p>


        <!-- ================================================= -->
        <!-- FLUXO -->
        <!-- ================================================= -->

        <div class="municipal-flow">

            <div class="method-step">

                <span class="method-step-number">
                    1
                </span>

                <strong>
                    Pixel GFC
                </strong>

                <small>
                    Treecover2000 e Lossyear
                </small>

            </div>


            <div class="method-arrow">
                →
            </div>


            <div class="method-step">

                <span class="method-step-number">
                    2
                </span>

                <strong>
                    Aplicação do limiar
                </strong>

                <small>
                    ≥10%, ≥30% ou ≥50%
                </small>

            </div>


            <div class="method-arrow">
                →
            </div>


            <div class="method-step">

                <span class="method-step-number">
                    3
                </span>

                <strong>
                    Identificação da perda
                </strong>

                <small>
                    Ano registrado no Lossyear
                </small>

            </div>


            <div class="method-arrow">
                →
            </div>


            <div class="method-step">

                <span class="method-step-number">
                    4
                </span>

                <strong>
                    Área real do pixel
                </strong>

                <small>
                    ee.Image.pixelArea()
                </small>

            </div>


            <div class="method-arrow">
                →
            </div>


            <div class="method-step">

                <span class="method-step-number">
                    5
                </span>

                <strong>
                    Município
                </strong>

                <small>
                    Soma das áreas dos pixels
                </small>

            </div>

        </div>


        <!-- ================================================= -->
        <!-- CARDS METODOLÓGICOS -->
        <!-- ================================================= -->

        <div class="method-grid municipal-method-grid">


            <article>

                <h3>
                    1. Unidade original
                </h3>

                <p>
                    A unidade original de análise é o pixel
                    do Global Forest Change, organizado em
                    uma grade de 0,00025° de resolução,
                    aproximadamente 30 metros em escala
                    nominal.
                </p>

            </article>


            <article>

                <h3>
                    2. Cobertura de referência
                </h3>

                <p>
                    Para cada cenário são considerados
                    somente pixels cuja cobertura arbórea
                    no ano 2000 seja igual ou superior ao
                    limiar selecionado: 10%, 30% ou 50%.
                </p>

            </article>


            <article>

                <h3>
                    3. Perda anual
                </h3>

                <p>
                    A perda de cada ano é calculada a partir
                    da banda Lossyear. Por exemplo, o código
                    1 representa 2001, o código 2 representa
                    2002 e assim sucessivamente até 2025.
                </p>

            </article>


            <article>

                <h3>
                    4. Perda acumulada
                </h3>

                <p>
                    O indicador acumulado soma todas as áreas
                    com perda registradas entre 2001 e o ano
                    selecionado pelo usuário.
                </p>

            </article>


            <article>

                <h3>
                    5. Área real dos pixels
                </h3>

                <p>
                    Como a grade do GFC está em latitude e
                    longitude, não foi adotada uma área fixa
                    de 900 m² por pixel. A área foi calculada
                    com ee.Image.pixelArea(), considerando
                    a área efetiva de cada célula.
                </p>

            </article>


            <article>

                <h3>
                    6. Agregação municipal
                </h3>

                <p>
                    As áreas dos pixels selecionados são
                    somadas dentro de cada limite municipal.
                    O resultado é convertido para hectares
                    e quilômetros quadrados.
                </p>

            </article>


            <article>

                <h3>
                    7. Percentual municipal
                </h3>

                <p>
                    O percentual apresentado no painel é a
                    área de perda dividida pela área territorial
                    total do município.
                    Portanto, não representa o percentual da
                    floresta original que foi perdido.
                </p>

            </article>


            <article>

                <h3>
                    8. Geometria no painel
                </h3>

                <p>
                    Os limites municipais mostrados no navegador
                    foram simplificados apenas para tornar o mapa
                    mais leve. Essa simplificação não altera os
                    valores estatísticos, que foram calculados
                    anteriormente com a base espacial de análise.
                </p>

            </article>

        </div>


        <!-- ================================================= -->
        <!-- FÓRMULAS -->
        <!-- ================================================= -->

        <div class="municipal-formulas">

            <div class="formula-box">

                <span>
                    Perda municipal
                </span>

                <strong>
                    Σ área dos pixels com perda
                </strong>

            </div>


            <div class="formula-box">

                <span>
                    Hectares
                </span>

                <strong>
                    área em m² ÷ 10.000
                </strong>

            </div>


            <div class="formula-box">

                <span>
                    Quilômetros quadrados
                </span>

                <strong>
                    área em m² ÷ 1.000.000
                </strong>

            </div>


            <div class="formula-box">

                <span>
                    % da área municipal
                </span>

                <strong>
                    perda ÷ área do município × 100
                </strong>

            </div>

        </div>


        <div class="method-warning municipal-warning">

            <strong>
                Como interpretar:
            </strong>

            os valores representam perda de cobertura
            arbórea detectada pelo Global Forest Change.
            O indicador não deve ser interpretado
            automaticamente como desmatamento.

            Pequenas diferenças residuais entre a soma dos
            municípios e o cálculo estadual podem ocorrer
            nas bordas dos polígonos e na relação entre
            a grade raster e os limites vetoriais.
            Essas diferenças foram verificadas durante
            a validação do banco municipal e são muito
            pequenas.

        </div>

        `;


        const charts =
            municipalView.querySelector(
                ".charts-grid"
            );


        if (charts) {

            charts.insertAdjacentElement(
                "afterend",
                section
            );

        } else {

            municipalView.appendChild(
                section
            );

        }


        return true;

    }


    // pixel.js cria municipalView dinamicamente.
    // Esperamos alguns milissegundos caso necessário.

    let tentativas = 0;

    const timer =
        setInterval(
            () => {

                tentativas++;

                if (
                    criarMetodologiaMunicipal()
                    ||
                    tentativas > 50
                ) {

                    clearInterval(
                        timer
                    );

                }

            },
            100
        );


    window.addEventListener(
        "load",
        criarMetodologiaMunicipal
    );

})();
