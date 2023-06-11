var CsvToHtmlTable2 = CsvToHtmlTable2 || {};

CsvToHtmlTable2 = {
    init: function (options) {
        var {
            csv_path = "",
            element = "table-csv1",
            allow_download = false,
            csv_options = {},
            datatables_options = {},
            custom_formatting = [],
        } = options;

        var customTemplates = {};
        $.each(custom_formatting, function (i, v) {
            var [colIdx, func] = v;
            customTemplates[colIdx] = func;
        });

        var $table = $("<table role='table' style='width:100%' class='table table-striped table-bordered hover display nowrap' id='" + element + "-table'></table>");
        var $containerElement = $("#" + element);
        $containerElement.empty().append($table);

        $.get(csv_path).then(function (data) {
            var csvData = $.csv.toArrays(data, csv_options);
            var $tableHead = $("<thead></thead>");
            var $tableFoot = $("<tfoot></tfoot>");
            var csvHeaderRow = csvData[0];
            var csvFooterRow = csvData[0];
            var $tableHeadRow = $("<tr></tr>");
            var $tableFootRow = $("<tr></tr>");

            for (var headerIdx = 0; headerIdx < csvHeaderRow.length; headerIdx++) {
                $tableHeadRow.append($("<th></th>").text(csvHeaderRow[headerIdx]));
                $tableFootRow.append($("<th></th>").text(csvFooterRow[headerIdx]));
            }

            $tableHead.append($tableHeadRow);
            $tableFoot.append($tableFootRow);

            var $tableBody = $("<tbody></tbody>");

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
                $tableBody.append($tableBodyRow);
            }

            $table.append($tableHead);
            $table.append($tableFoot);
            $table.append($tableBody);

            $table.DataTable(datatables_options);

            if (allow_download) {
                $containerElement.append("<p><a class='btn btn-info' href='" + csv_path + "'><i class='glyphicon glyphicon-download'></i> Download as CSV</a></p>");
            }
        });
    },
};
