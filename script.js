$(document)
    .ready(function() {

      function getJSON(url) {
        return fetch(url)
          .then(response => {
            if (!response.ok) {
              throw new Error(response.status);
            }
            return response.json();
          });
      }      
        
      $.extend($.fn.dataTable.defaults, {
          // Display
          dom: '<"top"f><"data-table"rt<"bottom"Blip>>', // https://datatables.net/examples/basic_init/dom.html
          lengthMenu: [ // https://datatables.net/examples/advanced_init/length_menu.html
            [10, 25, 50, -1],
            [10, 25, 50, "All"],
          ],
          language: {
            search: '_INPUT_',
            searchPlaceholder: 'Search', // https://datatables.net/reference/option/language.searchPlaceholder
            info: '_START_-_END_ of _TOTAL_', // https://datatables.net/examples/basic_init/language.html
            lengthMenu: 'Rows per page _MENU_',
            infoEmpty: '0 of _MAX_',
            infoFiltered: '',
            paginate: {
              first: '<svg class="dataTables-svg" viewBox="0 0 24 24"><path d="M18.41 16.59L13.82 12l4.59-4.59L6l-6 6 6 6zM6 6h2v12H6z"/></svg>',
              previous: '<svg class="dataTables-svg" viewBox="0 0 24 24"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.4141z"/></svg>',
              next: '<svg class="dataTables-svg" viewBox="0 0 24 24"><path d="M8.59 16.34l4.58-4.59-4.58-4.59L10 5.75l6 6-6 6z"/></svg>',
              last: '<svg class="dataTables-svg" viewBox="0 0 24 24"><path d="M5.59 7.41L10.18 12l-4.59 4.59L7 18l6-6-6-6zM6h2v12h-2z"/></svg>'
            },
            decimal: ',',
            thousands: '.',
            zeroRecords: 'No results found'
          },
          buttons: {
            buttons: [
              {
                extend: 'copy',
                text: '<svg class="dataTables-svg" viewBox="0 0 24 24"><path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"/></svg>',
                className: 'btn-icon',
                attr: { title: 'Copy table data to clipboard', 'data-toggle': 'tooltip' }
              },
              {
                extend: 'print',
                text: '<svg class="dataTables-svg" viewBox="0 0 24 24"><path d="M18,3H6V7H18M19,12A1,1 0 0,1 18,11A1,1 0 0,1 19,10A1,1 0 0,1 20,11A1,1 0 0,1 19,12M16,19H8V14H16M19,8H5A3,3 0 0,0 2,11V17H6V21H18V17H22V11A3,3 0 0,0 19,8Z"/></svg>',
                className: 'btn-icon',
                attr: { title: 'Print full table', 'data-toggle': 'tooltip' }
              },
              {
                extend: 'csv',
                text: '<svg class="dataTables-svg" viewBox="0 0 24 24"><path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2M18 20H6V4H13V9H18V20M10 19L12 15H9V10H15V15L13 19H10"/></svg>',
                className: 'btn-icon',
                attr: { title: 'Export to CSV', 'data-toggle': 'tooltip' }
              },
              {
                text: '<svg class="dataTables-svg" viewBox="0 0 24 24"><path d="M5,3H7V5H5V10A2,2 0 0,1 3,12A2,2 0 0,1 5,14V19H7V21H5C3.93,20.73 3,20.1 3,19V15A2,2 0 0,0 1,13H0V11H1A2,2 0 0,0 3,9V5A2,2 0 0,1 5,3M19,3A2,2 0 0,1 21,5V9A2,2 0 0,0 23,11H24V13H23A2,2 0 0,0 21,15V19A2,2 0 0,1 19,21H17V19H19V14A2,2 0 0,1 21,12A2,2 0 0,1 19,10V5H17V3H19M12,15A1,1 0 0,1 13,16A1,1 0 0,1 12,17A1,1 0 0,1 11,16A1,1 0 0,1 12,15M8,15A1,1 0 0,1 9,16A1,1 0 0,1 8,17A1,1 0 0,1 7,16A1,1 0 0,1 8,15M16,15A1,1 0 0,1 17,16A1,1 0 0,1 16,17A1,1 0 0,1 15,16A1,1 0 0,1 16,15Z"/></svg>',
                action: function (e, dt, button, config) {
                  let data = dt.buttons.exportData();
                  $.fn.dataTable.fileSave(
                    new Blob([JSON.stringify(data)]),
                    'Data ExportJSON.json'
                  );
                },
                className: 'btn-icon',
                attr: { title: 'Export to JSON', 'data-toggle': 'tooltip' }
              },
              {
                extend: 'excel',
                text: '<svg class="dataTables-svg" viewBox="0 0 24 24"><path d="M14 2H6C4.89 2 4 2.9 4 4V20C4 21.11 4.89 22 6 22H18C19.11 22 20 21.11 20 20V8L14 2M18 20H6V4H13V9H18V20M12.9 14.5L15.8 19H14L12 15.6L10 19H8.2L11.1 14.5L8.2 10H10L12 13.4L14 10H15.8L12.9 14.5Z"/></svg>',
                className: 'btn-icon',
                attr: { title: 'Export to Excel', 'data-toggle': 'tooltip' }
              },
              {
                extend: 'pdf',
                download: 'open',
                text: '<svg class="dataTables-svg" viewBox="0 0 24 24"><path d="M14,2L20,8V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V4A2,2 0 0,1 6,2H14M18,20V9H13V4H6V20H18M10.92,12.31C10.68,11.54 10.15,9.08 11.55,9.04C12.95,9 12.03,12.16 12.03,12.16C12.42,13.65 14.05,14.72 14.05,14.72C14.55,14.57 17.4,14.24 17,15.72C16.57,17.2 13.5,15.81 13.5,15.81C11.55,15.95 10.09,16.47 10.09,16.47C8.96,18.58 7.64,19.5 7.1,18.61C6.43,17.5 9.23,16.07 9.23,16.07C10.68,13.72 10.9,12.35 10.92,12.31M11.57,13.15C11.17,14.45 10.37,15.84 10.37,15.84C11.22,15.5 13.08,15.11 13.08,15.11C11.94,14.11 11.59,13.16 11.57,13.15M14.71,15.32C14.71,15.32 16.46,15.97 16.5,15.71C16.57,15.44 15.17,15.2 14.71,15.32M9.05,16.81C8.28,17.11 7.54,18.39 7.72,18.39C7.9,18.4 8.63,17.79 9.05,16.81M11.57,11.26C11.57,11.21 12,9.58 11.57,9.53C11.27,9.5 11.56,11.22 11.57,11.26Z"/></svg>',
                className: 'btn-icon',
                attr: { title: 'Export to PDF', 'data-toggle': 'tooltip' }
              }
            ],
            dom: {
              container: { className: 'dt-buttons d-none d-md-flex flex-wrap' },
              buttonContainer: {},
              button: { className: 'btn' }
            }
          },
          // Data display
          colReorder: true,
          fixedHeader: true,
          ordering: true,
          paging: true,
          pageLength: 10,
          pagingType: 'full', // https://datatables.net/reference/option/pagingType
          responsive: true,
          searching: true,
          select: {
            style: 'multi+shift', // https://datatables.net/reference/option/select.style
            className: 'table-active' // https://datatables.net/reference/option/select.className
          },
          stateSave: true,
        });        

      $('a[data-toggle="tab"]').on("shown.bs.tab", function (e) {
        $($.fn.dataTable.tables()).DataTable().fixedHeader.adjust();
      });
                                    
      if (location.hash) {
          $('a[href=\'' + location.hash + '\']').tab('show');
        }

      var activeTab = localStorage.getItem('activeTab');
      
      if (activeTab) {
        $('a[href="' + activeTab + '"]').tab('show');
      }
        
      $('body').on('click', 'a[data-toggle="tab"]', function (e) {
        e.preventDefault();
      
        const tabName = this.getAttribute('href');
        if (history.pushState) {
          history.pushState(null, null, tabName);
        } else {
          location.hash = tabName;
        }
      
        localStorage.setItem('activeTab', tabName);
        $(this).tab('show');
      
        return false;
      });      

      $(window).on('popstate', function () {
        const anchor = location.hash || $('a[data-toggle="tab"]').first().attr('href');
        $(`a[href="${anchor}"]`).tab('show');
      });      

    });