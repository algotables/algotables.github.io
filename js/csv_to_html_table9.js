var CsvToHtmlTable9 = CsvToHtmlTable9 || {};

CsvToHtmlTable9 = {
    init: function (options) {
        options = options || {};
        var {
            csv_path = "",
            element = "table-csv8",
            allow_download = false,
            csv_options = {},
            datatables_options = {},
            custom_formatting = [],
        } = options;

        var customTemplates = {};
        $.each(custom_formatting, (i, v) => {
            var [colIdx, func] = v;
            customTemplates[colIdx] = func;
        });

        var $table = $(`<table role='table' style='width:100%' class='table table-striped table-bordered hover display nowrap' id='${element}-table'></table>`);
        var $containerElement = $(`#${element}`);
        $containerElement.empty().append($table);

        var $tableHead = $("<thead></thead>");
        var $tableFoot = $("<tfoot></tfoot>");
        var $tableBody = $("<tbody></tbody>");

        var $tableHeadRow = $("<tr></tr>");
        var $tableFootRow = $("<tr></tr>");

        $.get(csv_path).then(function (data) {
            var csvData = $.csv.toArrays(data, csv_options);
            var csvHeaderRow = csvData[0];
            var csvFooterRow = csvData[0];

            for (var i = 0; i < csvHeaderRow.length; i++) {
                var $th = $("<th></th>").text(csvHeaderRow[i]);
                $tableHeadRow.append($th);
                $tableFootRow.append($("<th></th>").text(csvFooterRow[i]));
            }

            $tableHead.append($tableHeadRow);
            $tableFoot.append($tableFootRow);

            $('#table-csv8 tfoot th').html('<input type="text" placeholder="Search " />');

            var fragment = document.createDocumentFragment();
            for (var rowIdx = 1; rowIdx < csvData.length; rowIdx++) {
                var $tableBodyRow = $("<tr></tr>");
                for (var colIdx = 0; colIdx < csvData[rowIdx].length; colIdx++) {
                    var $tableBodyRowTd = $("<td></td>");
                    var cellTemplateFunc = customTemplates[colIdx];
                    if (cellTemplateFunc) {
                        $tableBodyRowTd.html(cellTemplateFunc(csvData[rowIdx][colIdx]));
                    } else {
                        $tableBodyRowTd.text(csvData[rowIdx][colIdx]);
                    }
                    $tableBodyRow.append($tableBodyRowTd);
                }
                fragment.appendChild($tableBodyRow[0]);
            }
            $tableBody.append(fragment);

            $table.append($tableHead);
            $table.append($tableFoot);
            $table.append($tableBody);

            $table.DataTable(datatables_options);

            if (allow_download) {
                $containerElement.append(`<p><a class='btn btn-info' href='${csv_path}'><i class='glyphicon glyphicon-download'></i> Download as CSV</a></p>`);
            }
        });
    },
};
