function applyIcons(map, className) {
    for (const selector in map) {

        if ($(selector).find("." + className).length > 0) {
            continue;
        }

        $(selector).prepend(
            `<span class="material-symbols-outlined ${className}">${map[selector]}</span>`
        );
    }
}

function closeFilters() {
    const h = $filters.height();
    $filters.css("height", h + "px");

    $filters.find(".filter-fields").css("opacity", "0");

    setTimeout(() => {
        $filters
            .addClass("closed")
            .removeClass("open")
            .css("height", "0px");
    }, 50);
}

function openFilters() {
    $filters.find(".filter-fields").css("opacity", "1");

    $filters.css("height", "auto");
    const h = $filters.prop("scrollHeight");

    $filters
        .removeClass("closed")
        .addClass("open")
        .css("height", h + "px");
}

$(function () {
    const $aggs = $("#Aggregations");

    function openAggs() {
        $aggs.css("height", "auto");
        const h = $aggs.prop("scrollHeight");

        $aggs
            .removeClass("closed")
            .addClass("open")
            .css("height", h + "px");
    }

    function closeAggs() {
        const h = $aggs.height();
        $aggs.css("height", h + "px");

        setTimeout(() => {
            $aggs
                .addClass("closed")
                .removeClass("open")
                .css("height", "0px");
        }, 30);
    }

    // 開閉ボタン
    $(document).on("click", "#ReduceAggregations", function () {
        closeAggs();
    });

    $(document).on("click", "#ExpandAggregations", function () {
        openAggs();
    });

    // 初期状態
    openAggs();
});
