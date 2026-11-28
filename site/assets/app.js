// Click or press Enter on a column header to sort; type in a filter box to narrow a table.
for (const table of document.querySelectorAll('table.sortable')) {
  const headers = [...table.tHead.rows[0].cells];
  headers.forEach((th, index) => {
    th.tabIndex = 0;
    if (!th.hasAttribute('aria-sort')) th.setAttribute('aria-sort', 'none');
    const sort = () => {
      const direction = th.getAttribute('aria-sort') === 'descending' ? 'ascending' : 'descending';
      headers.forEach((h) => h.setAttribute('aria-sort', 'none'));
      th.setAttribute('aria-sort', direction);
      const numeric = th.dataset.type === 'num';
      const key = (row) => {
        const cell = row.cells[index];
        const raw = cell.dataset.v ?? cell.textContent.trim();
        if (!numeric) return raw.toLowerCase();
        return raw === '' ? -Infinity : Number(raw);
      };
      const sign = direction === 'ascending' ? 1 : -1;
      const rows = [...table.tBodies[0].rows].sort((a, b) => {
        const x = key(a);
        const y = key(b);
        return (x < y ? -1 : x > y ? 1 : 0) * sign;
      });
      table.tBodies[0].append(...rows);
    };
    th.addEventListener('click', sort);
    th.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        sort();
      }
    });
  });
}

// A table that fits its card keeps its header in view as the page scrolls; one that doesn't
// (narrow screens) scrolls sideways inside its card instead.
const cards = [...document.querySelectorAll('.card')];
const fit = () => {
  for (const card of cards) card.classList.toggle('fits', card.querySelector('table').offsetWidth <= card.clientWidth + 1);
};
fit();
addEventListener('resize', fit);

for (const input of document.querySelectorAll('input[data-filter]')) {
  const table = document.getElementById(input.dataset.filter);
  if (!table) continue;
  input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase();
    for (const row of table.tBodies[0].rows) {
      const link = row.querySelector('a[href]');
      const haystack = `${link ? link.getAttribute('href') : ''} ${row.textContent}`.toLowerCase();
      row.hidden = query !== '' && !haystack.includes(query);
    }
  });
}
