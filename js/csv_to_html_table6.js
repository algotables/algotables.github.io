var CsvToHtmlTable6 = CsvToHtmlTable6 || {};

CsvToHtmlTable6 = {
    init: function (options) {
        options = options || {};
        var csv_path = options.csv_path || "";
        var el = options.element || "table-csv5"; 
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
                var $tableHead = $("<thead></thead>"); //add this but for tableFoot
                var $tableFoot = $("<tfoot></tfoot>"); //added
                var csvHeaderRow = csvData[0];
                var csvFooterRow = csvData[0]; //added
                var $tableHeadRow = $("<tr></tr>"); //add this but for tableFootRow
                var $tableFootRow = $("<tr></tr>"); //added
                for (var headerIdx = 0; headerIdx < csvHeaderRow.length; headerIdx++) {
                    $tableHeadRow.append($("<th></th>").text(csvHeaderRow[headerIdx]));
                } //add this but for TableFootRow ?
                $tableHead.append($tableHeadRow);
                
                for (var footerIdx = 0; footerIdx < csvFooterRow.length; footerIdx++) {
                    $tableFootRow.append($("<th></th>").text(csvFooterRow[footerIdx]));
                } //added
                $tableFoot.append($tableFootRow); //added

                $table.append($tableHead);
                $table.append($tableFoot); //added
                var $tableBody = $("<tbody></tbody>");

                $('#table-csv5 tfoot th').each( function () {
                    //var title = csvData[0]
                    //$(this).html( '<input type="text" placeholder="Search '+title+'" />' );
                    $(this).html( '<input type="text" placeholder="Search '+'" />' );
                } );

                for (var rowIdx = 1; rowIdx < csvData.length; rowIdx++) {
                    var $tableBodyRow = $("<tr></tr>");
                    for (var colIdx = 0; colIdx < csvData[rowIdx].length; colIdx++) {
                        var $tableBodyRowTd = $("<td></td>");
                        var cellTemplateFunc = customTemplates[colIdx];
                        if (cellTemplateFunc) {
                            $tableBodyRowTd.html(cellTemplateFunc(csvData[rowIdx][colIdx]));
                            //console.log($tableBodyRowTd.html(cellTemplateFunc(csvData[rowIdx][colIdx])));
                        } else {
                            $tableBodyRowTd.text(csvData[rowIdx][colIdx]);
                            //console.log($tableBodyRowTd.text(csvData[rowIdx][colIdx]));
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

                //var test = document.querySelector("#table-csv4-table > tbody > tr:nth-child(2) > td:nth-child(2)");
                //console.log(test);
                //console.log($tableBody[0].childNodes[0]);
                //console.log($tableBody[0].childNodes[1]);
                //console.log($tableBody[0].childNodes[2].childNodes[0].innerText); //FINALLY !!! 

                /*$(function() {
                    $('tr td:nth-child(2).sorting_1').each(function() {
                    var cellValue = $(this).text();
                      console.log(cellValue)
                    //do something with cellValue 
                    if(cellValue) {
                      //not null  
                    } else {
                      //null
                    }
                  });
                });*/

                /*$(function() {
                    $('tr td:nth-child(2)').each(function() {
                    var cellValue = $(this).text();
                      console.log(cellValue)
                    //do something with cellValue 
                    if(cellValue) {
                      //not null  
                    } else {
                      //null
                    }
                  });
                });*/                

            });
    }
};
