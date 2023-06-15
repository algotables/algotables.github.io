var CsvToHtmlTable = CsvToHtmlTable || {};
var CsvToHtmlTable2 = CsvToHtmlTable2 || {};
var CsvToHtmlTable3 = CsvToHtmlTable3 || {};
var CsvToHtmlTable4 = CsvToHtmlTable4 || {};
var CsvToHtmlTable5 = CsvToHtmlTable5 || {};
var CsvToHtmlTable6 = CsvToHtmlTable6 || {};
var CsvToHtmlTable7 = CsvToHtmlTable7 || {};
var CsvToHtmlTable8 = CsvToHtmlTable8 || {};
var CsvToHtmlTable9 = CsvToHtmlTable9 || {};
var CsvToHtmlTable10 = CsvToHtmlTable10 || {};
var CsvToHtmlTable11 = CsvToHtmlTable11 || {};
var CsvToHtmlTable12 = CsvToHtmlTable12 || {};
var CsvToHtmlTable13 = CsvToHtmlTable13 || {};
var CsvToHtmlTable14 = CsvToHtmlTable14 || {};
var CsvToHtmlTable15 = CsvToHtmlTable15 || {};
var CsvToHtmlTable16 = CsvToHtmlTable16 || {};
var CsvToHtmlTable17 = CsvToHtmlTable17 || {};

CsvToHtmlTable = {
    init: function (options) {
        var {
            csv_path = "",
            element = "table-csv0",
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

            $('#table-csv0 tfoot th').each(function () {
                $(this).html('<input type="text" placeholder="Search ' + '" />');
            });

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

CsvToHtmlTable3 = {
    init: function (options) {
        var {
            csv_path = "",
            element = "table-csv2",
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

            $('#table-csv2 tfoot th').each(function () {
                $(this).html('<input type="text" placeholder="Search ' + '" />');
            });

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
    }
};

CsvToHtmlTable4 = {
    init: function (options) {
        var {
            csv_path = "",
            element = "table-csv3",
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

            $('#table-csv3 tfoot th').each(function () {
                $(this).html('<input type="text" placeholder="Search ' + csvHeaderRow[$(this).index()] + '" />');
            });

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
    }
};

CsvToHtmlTable5 = {
    init: function (options) {
        var {
            csv_path = "",
            element = "table-csv4",
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

            $('#table-csv4 tfoot th').each(function () {
                $(this).html('<input type="text" placeholder="Search ' + csvHeaderRow[$(this).index()] + '" />');
            });

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

CsvToHtmlTable6 = {
    init: function (options) {
        options = options || {};
        var {
            csv_path = "",
            element = "table-csv5",
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

            $('#table-csv5 tfoot th').each(function () {
                $(this).html('<input type="text" placeholder="Search ' + csvHeaderRow[$(this).index()] + '" />');
            });

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

CsvToHtmlTable7 = {
    init: function (options) {
        options = options || {};
        var {
            csv_path = "",
            element = "table-csv6",
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
            var $tableBody = $("<tbody></tbody>");

            var $tableHeadRow = $("<tr></tr>");
            var $tableFootRow = $("<tr></tr>");

            for (var i = 0; i < csvHeaderRow.length; i++) {
                var $th = $("<th></th>").text(csvHeaderRow[i]);
                $tableHeadRow.append($th);
                $tableFootRow.append($("<th></th>").text(csvFooterRow[i]));
            }

            $tableHead.append($tableHeadRow);
            $tableFoot.append($tableFootRow);

            $('#table-csv6 tfoot th').html('<input type="text" placeholder="Search " />');

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
                $containerElement.append("<p><a class='btn btn-info' href='" + csv_path + "'><i class='glyphicon glyphicon-download'></i> Download as CSV</a></p>");
            }
        });
    },
};

CsvToHtmlTable8 = {
    init: function (options) {
        options = options || {};
        var {
            csv_path = "",
            element = "table-csv7",
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

            $('#table-csv7 tfoot th').html('<input type="text" placeholder="Search " />');

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
    }
};

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

CsvToHtmlTable10 = {
    init: function (options) {
        options = options || {};
        var csv_path = options.csv_path || "";
        var el = options.element || "table-csv9";
        var allow_download = options.allow_download || false;
        var csv_options = options.csv_options || {};
        var datatables_options = options.datatables_options || {};
        var custom_formatting = options.custom_formatting || [];
        var customTemplates = {};
        $.each(custom_formatting, function (i, v) {
            var colIdx = v[0];
            var func = v[1];
            customTemplates[colIdx] = func;
        });

        var $table = $("<table role='table' style='width:100%' class='table table-striped table-bordered hover display nowrap' id='" + el + "-table'></table>");
        var $containerElement = $("#" + el);
        $containerElement.empty().append($table);

        $.when($.get(csv_path)).then(
            function (data) {
                var csvData = $.csv.toArrays(data, csv_options);
                var $tableHead = $("<thead></thead>");
                var $tableFoot = $("<tfoot></tfoot>");
                var csvHeaderRow = csvData[0];
                var csvFooterRow = csvData[0];
                var $tableHeadRow = $("<tr></tr>");
                var $tableFootRow = $("<tr></tr>");
                for (var headerIdx = 0; headerIdx < csvHeaderRow.length; headerIdx++) {
                    $tableHeadRow.append($("<th></th>").text(csvHeaderRow[headerIdx]));
                }
                $tableHead.append($tableHeadRow);

                for (var footerIdx = 0; footerIdx < csvFooterRow.length; footerIdx++) {
                    $tableFootRow.append($("<th></th>").text(csvFooterRow[footerIdx]));
                }
                $tableFoot.append($tableFootRow);

                $table.append($tableHead);
                $table.append($tableFoot);
                var $tableBody = $("<tbody></tbody>");

                $('#table-csv9 tfoot th').each(function () {
                    $(this).html('<input type="text" placeholder="Search " />');
                });

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
                        $tableBody.append($tableBodyRow);
                    }
                }
                $table.append($tableBody);

                $table.DataTable(datatables_options);

                if (allow_download) {
                    $containerElement.append("<p><a class='btn btn-info' href='" + csv_path + "'><i class='glyphicon glyphicon-download'></i> Download as CSV</a></p>");
                }
            });
    }
};

CsvToHtmlTable11 = {
    init: function (options) {
        options = options || {};
        var csv_path = options.csv_path || "";
        var el = options.element || "table-csv10";
        var allow_download = options.allow_download || false;
        var csv_options = options.csv_options || {};
        var datatables_options = options.datatables_options || {};
        var custom_formatting = options.custom_formatting || [];
        var customTemplates = {};
        $.each(custom_formatting, function (i, v) {
            var colIdx = v[0];
            var func = v[1];
            customTemplates[colIdx] = func;
        });

        var $table = $("<table role='table' style='width:100%' class='table table-striped table-bordered hover display nowrap' id='" + el + "-table'></table>");
        var $containerElement = $("#" + el);
        $containerElement.empty().append($table);

        $.when($.get(csv_path)).then(
            function (data) {
                var csvData = $.csv.toArrays(data, csv_options);
                var $tableHead = $("<thead></thead>");
                var $tableFoot = $("<tfoot></tfoot>");
                var csvHeaderRow = csvData[0];
                var csvFooterRow = csvData[0];
                var $tableHeadRow = $("<tr></tr>");
                var $tableFootRow = $("<tr></tr>");
                for (var headerIdx = 0; headerIdx < csvHeaderRow.length; headerIdx++) {
                    $tableHeadRow.append($("<th></th>").text(csvHeaderRow[headerIdx]));
                }
                $tableHead.append($tableHeadRow);

                for (var footerIdx = 0; footerIdx < csvFooterRow.length; footerIdx++) {
                    $tableFootRow.append($("<th></th>").text(csvFooterRow[footerIdx]));
                }
                $tableFoot.append($tableFootRow);

                $table.append($tableHead);
                $table.append($tableFoot);
                var $tableBody = $("<tbody></tbody>");

                $('#table-csv10 tfoot th').each(function () {
                    $(this).html('<input type="text" placeholder="Search " />');
                });

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
                $table.append($tableBody);

                $table.DataTable(datatables_options);

                if (allow_download) {
                    $containerElement.append("<p><a class='btn btn-info' href='" + csv_path + "'><i class='glyphicon glyphicon-download'></i> Download as CSV</a></p>");
                }
            });
    }
};

CsvToHtmlTable12 = {
    init: function (options) {
        options = options || {};
        var csv_path = options.csv_path || "";
        var el = options.element || "table-csv11";
        var allow_download = options.allow_download || false;
        var csv_options = options.csv_options || {};
        var datatables_options = options.datatables_options || {};
        var custom_formatting = options.custom_formatting || [];
        var customTemplates = {};
        $.each(custom_formatting, function (i, v) {
            var colIdx = v[0];
            var func = v[1];
            customTemplates[colIdx] = func;
        });

        var $table = $("<table role='table' style='width:100%' class='table table-striped table-bordered hover display nowrap' id='" + el + "-table'></table>");
        var $containerElement = $("#" + el);
        $containerElement.empty().append($table);

        $.when($.get(csv_path)).then(
            function (data) {
                var csvData = $.csv.toArrays(data, csv_options);
                var $tableHead = $("<thead></thead>");
                var $tableFoot = $("<tfoot></tfoot>");
                var csvHeaderRow = csvData[0];
                var csvFooterRow = csvData[0];
                var $tableHeadRow = $("<tr></tr>");
                var $tableFootRow = $("<tr></tr>");
                for (var headerIdx = 0; headerIdx < csvHeaderRow.length; headerIdx++) {
                    $tableHeadRow.append($("<th></th>").text(csvHeaderRow[headerIdx]));
                }
                $tableHead.append($tableHeadRow);

                for (var footerIdx = 0; footerIdx < csvFooterRow.length; footerIdx++) {
                    $tableFootRow.append($("<th></th>").text(csvFooterRow[footerIdx]));
                }
                $tableFoot.append($tableFootRow);

                $table.append($tableHead);
                $table.append($tableFoot);
                var $tableBody = $("<tbody></tbody>");

                $('#table-csv11 tfoot th').each(function () {
                    $(this).html('<input type="text" placeholder="Search " />');
                });

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
                $table.append($tableBody);

                $table.DataTable(datatables_options);

                if (allow_download) {
                    $containerElement.append("<p><a class='btn btn-info' href='" + csv_path + "'><i class='glyphicon glyphicon-download'></i> Download as CSV</a></p>");
                }
            });
    }
};

var CsvToHtmlTable13 = {
init: function(options) {
    options = options || {};
    var csv_path = options.csv_path || "";
    var el = options.element || "table-csv12";
    var allow_download = options.allow_download || false;
    var csv_options = options.csv_options || {};
    var datatables_options = options.datatables_options || {};
    var custom_formatting = options.custom_formatting || [];
    var customTemplates = {};

    $.each(custom_formatting, function(i, v) {
    var colIdx = v[0];
    var func = v[1];
    customTemplates[colIdx] = func;
    });

    var $table = $("<table role='table' style='width:100%' class='table table-striped table-bordered hover display nowrap' id='" + el + "-table'></table>");
    var $containerElement = $("#" + el);
    $containerElement.empty().append($table);

    var processDataChunk = function(csvData, startRow, endRow) {
    var $tableBody = $table.find("tbody");

    for (var rowIdx = startRow; rowIdx <= endRow; rowIdx++) {
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

    if (endRow < csvData.length - 1) {
        // Process next chunk
        setTimeout(function() {
        processDataChunk(csvData, endRow + 1, Math.min(endRow + 10, csvData.length - 1));
        }, 0);
    } else {
        // All rows processed
        $table.DataTable(datatables_options);

        if (allow_download) {
        $containerElement.append("<p><a class='btn btn-info' href='" + csv_path + "'><i class='glyphicon glyphicon-download'></i> Download as CSV</a></p>");
        }
    }
    };

    $.get(csv_path).done(function(data) {
    var csvData = $.csv.toArrays(data, csv_options);
    var $tableHead = $("<thead></thead>");
    var $tableFoot = $("<tfoot></tfoot>");
    var csvHeaderRow = csvData[0];
    var csvFooterRow = csvData[0];
    var $tableHeadRow = $("<tr></tr>");
    var $tableFootRow = $("<tr></tr>");

    $.each(csvHeaderRow, function(headerIdx, header) {
        $tableHeadRow.append($("<th></th>").text(header));
    });

    $.each(csvFooterRow, function(footerIdx, footer) {
        $tableFootRow.append($("<th></th>").text(footer));
    });

    $tableHead.append($tableHeadRow);
    $tableFoot.append($tableFootRow);
    $table.append($tableHead).append($tableFoot);

    $table.append("<tbody></tbody>");
    $('#' + el + ' tfoot th').each(function() {
        $(this).html('<input type="text" placeholder="Search " />');
    });

    // Start processing rows in chunks
    processDataChunk(csvData, 1, Math.min(10, csvData.length - 1));
    });
}
};  

CsvToHtmlTable14 = {
    init: function (options) {
        options = options || {};
        var csv_path = options.csv_path || "";
        var el = options.element || "table-csv13";
        var allow_download = options.allow_download || false;
        var csv_options = options.csv_options || {};
        var datatables_options = options.datatables_options || {};
        var custom_formatting = options.custom_formatting || [];
        var customTemplates = {};
        $.each(custom_formatting, function (i, v) {
            var colIdx = v[0];
            var func = v[1];
            customTemplates[colIdx] = func;
        });

        var $table = $("<table role='table' style='width:100%' class='table table-striped table-bordered hover display nowrap' id='" + el + "-table'></table>");
        var $containerElement = $("#" + el);
        $containerElement.empty().append($table);

        $.when($.get(csv_path)).then(
            function (data) {
                var csvData = $.csv.toArrays(data, csv_options);
                var $tableHead = $("<thead></thead>");
                var $tableFoot = $("<tfoot></tfoot>");
                var csvHeaderRow = csvData[0];
                var csvFooterRow = csvData[0];
                var $tableHeadRow = $("<tr></tr>");
                var $tableFootRow = $("<tr></tr>");
                for (var headerIdx = 0; headerIdx < csvHeaderRow.length; headerIdx++) {
                    $tableHeadRow.append($("<th></th>").text(csvHeaderRow[headerIdx]));
                }
                $tableHead.append($tableHeadRow);

                for (var footerIdx = 0; footerIdx < csvFooterRow.length; footerIdx++) {
                    $tableFootRow.append($("<th></th>").text(csvFooterRow[footerIdx]));
                }
                $tableFoot.append($tableFootRow);

                $table.append($tableHead);
                $table.append($tableFoot);
                var $tableBody = $("<tbody></tbody>");

                $('#table-csv13 tfoot th').each(function () {
                    $(this).html('<input type="text" placeholder="Search " />');
                });

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
                $table.append($tableBody);

                $table.DataTable(datatables_options);

                if (allow_download) {
                    $containerElement.append("<p><a class='btn btn-info' href='" + csv_path + "'><i class='glyphicon glyphicon-download'></i> Download as CSV</a></p>");
                }
            });
    }
};

CsvToHtmlTable15 = {
    init: function (options) {
        options = options || {};
        var csv_path = options.csv_path || "";
        var el = options.element || "table-csv14";
        var allow_download = options.allow_download || false;
        var csv_options = options.csv_options || {};
        var datatables_options = options.datatables_options || {};
        var custom_formatting = options.custom_formatting || [];
        var customTemplates = {};
        $.each(custom_formatting, function (i, v) {
            var colIdx = v[0];
            var func = v[1];
            customTemplates[colIdx] = func;
        });

        var $table = $("<table role='table' style='width:100%' class='table table-striped table-bordered hover display nowrap' id='" + el + "-table'></table>");
        var $containerElement = $("#" + el);
        $containerElement.empty().append($table);

        $.when($.get(csv_path)).then(
            function (data) {
                var csvData = $.csv.toArrays(data, csv_options);
                var $tableHead = $("<thead></thead>");
                var $tableFoot = $("<tfoot></tfoot>");
                var csvHeaderRow = csvData[0];
                var csvFooterRow = csvData[0];
                var $tableHeadRow = $("<tr></tr>");
                var $tableFootRow = $("<tr></tr>");
                for (var headerIdx = 0; headerIdx < csvHeaderRow.length; headerIdx++) {
                    $tableHeadRow.append($("<th></th>").text(csvHeaderRow[headerIdx]));
                }
                $tableHead.append($tableHeadRow);

                for (var footerIdx = 0; footerIdx < csvFooterRow.length; footerIdx++) {
                    $tableFootRow.append($("<th></th>").text(csvFooterRow[footerIdx]));
                }
                $tableFoot.append($tableFootRow);

                $table.append($tableHead);
                $table.append($tableFoot);
                var $tableBody = $("<tbody></tbody>");

                $('#table-csv14 tfoot th').each(function () {
                    $(this).html('<input type="text" placeholder="Search " />');
                });

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
                $table.append($tableBody);

                $table.DataTable(datatables_options);

                if (allow_download) {
                    $containerElement.append("<p><a class='btn btn-info' href='" + csv_path + "'><i class='glyphicon glyphicon-download'></i> Download as CSV</a></p>");
                }
            });
    }
};

CsvToHtmlTable16 = {
    init: function (options) {
        options = options || {};
        var csv_path = options.csv_path || "";
        var el = options.element || "table-csv15";
        var allow_download = options.allow_download || false;
        var csv_options = options.csv_options || {};
        var datatables_options = options.datatables_options || {};
        var custom_formatting = options.custom_formatting || [];
        var customTemplates = {};
        $.each(custom_formatting, function (i, v) {
            var colIdx = v[0];
            var func = v[1];
            customTemplates[colIdx] = func;
        });

        var $table = $("<table role='table' style='width:100%' class='table table-striped table-bordered hover display nowrap' id='" + el + "-table'></table>");
        var $containerElement = $("#" + el);
        $containerElement.empty().append($table);

        $.when($.get(csv_path)).then(
            function (data) {
                var csvData = $.csv.toArrays(data, csv_options);
                var $tableHead = $("<thead></thead>");
                var $tableFoot = $("<tfoot></tfoot>");
                var csvHeaderRow = csvData[0];
                var csvFooterRow = csvData[0];
                var $tableHeadRow = $("<tr></tr>");
                var $tableFootRow = $("<tr></tr>");
                for (var headerIdx = 0; headerIdx < csvHeaderRow.length; headerIdx++) {
                    $tableHeadRow.append($("<th></th>").text(csvHeaderRow[headerIdx]));
                }
                $tableHead.append($tableHeadRow);

                for (var footerIdx = 0; footerIdx < csvFooterRow.length; footerIdx++) {
                    $tableFootRow.append($("<th></th>").text(csvFooterRow[footerIdx]));
                }
                $tableFoot.append($tableFootRow);

                $table.append($tableHead);
                $table.append($tableFoot);
                var $tableBody = $("<tbody></tbody>");

                $('#table-csv15 tfoot th').each(function () {
                    $(this).html('<input type="text" placeholder="Search " />');
                });

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
                $table.append($tableBody);

                $table.DataTable(datatables_options);

                if (allow_download) {
                    $containerElement.append("<p><a class='btn btn-info' href='" + csv_path + "'><i class='glyphicon glyphicon-download'></i> Download as CSV</a></p>");
                }
            });
    }
};

CsvToHtmlTable17 = {
    init: function (options) {
        options = options || {};
        var csv_path = options.csv_path || "";
        var el = options.element || "table-csv16";
        var allow_download = options.allow_download || false;
        var csv_options = options.csv_options || {};
        var datatables_options = options.datatables_options || {};
        var custom_formatting = options.custom_formatting || [];
        var customTemplates = {};
        $.each(custom_formatting, function (i, v) {
            var colIdx = v[0];
            var func = v[1];
            customTemplates[colIdx] = func;
        });

        var $table = $("<table role='table' style='width:100%' class='table table-striped table-bordered hover display nowrap' id='" + el + "-table'></table>");
        var $containerElement = $("#" + el);
        $containerElement.empty().append($table);

        $.when($.get(csv_path)).then(
            function (data) {
                var csvData = $.csv.toArrays(data, csv_options);
                var $tableHead = $("<thead></thead>");
                var $tableFoot = $("<tfoot></tfoot>");
                var csvHeaderRow = csvData[0];
                var csvFooterRow = csvData[0];
                var $tableHeadRow = $("<tr></tr>");
                var $tableFootRow = $("<tr></tr>");
                for (var headerIdx = 0; headerIdx < csvHeaderRow.length; headerIdx++) {
                    $tableHeadRow.append($("<th></th>").text(csvHeaderRow[headerIdx]));
                }
                $tableHead.append($tableHeadRow);

                for (var footerIdx = 0; footerIdx < csvFooterRow.length; footerIdx++) {
                    $tableFootRow.append($("<th></th>").text(csvFooterRow[footerIdx]));
                }
                $tableFoot.append($tableFootRow);

                $table.append($tableHead);
                $table.append($tableFoot);
                var $tableBody = $("<tbody></tbody>");

                $('#table-csv16 tfoot th').each(function () {
                    $(this).html('<input type="text" placeholder="Search " />');
                });

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
                $table.append($tableBody);

                $table.DataTable(datatables_options);

                if (allow_download) {
                    $containerElement.append("<p><a class='btn btn-info' href='" + csv_path + "'><i class='glyphicon glyphicon-download'></i> Download as CSV</a></p>");
                }
            });
    }
};
