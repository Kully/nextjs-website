const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const NARROW_QUERY = '(max-width: 600px)';
const LABELED_MONTHS = [0, 6];
const LABELED_MONTHS_NARROW = [0];

/**
 * Sums weekly commit counts into calendar months. A week is counted in the
 * month of its starting Sunday.
 * @param {Array<[string, number]>} weeks - Pairs of ISO week start date and commit count.
 * @returns {Array<{year: number, month: number, count: number}>} One entry per month, in order.
 */
const binByMonth = (weeks) => {
  const months = new Map();
  weeks.forEach(([iso, count]) => {
    const [year, month] = iso.split('-').map(Number);
    const key = `${year}-${month}`;
    const entry = months.get(key) ?? { year, month: month - 1, count: 0 };
    entry.count += count;
    months.set(key, entry);
  });
  return [...months.values()];
};

const MONTHLY_COMMITS = binByMonth(PLOTLY_WEEKLY_COMMITS);

const formatMonth = ({ year, month }) => `${MONTH_NAMES[month]} ${year}`;

const isLabeledMonth = (index) => {
  const labeledMonths = window.matchMedia(NARROW_QUERY).matches ? LABELED_MONTHS_NARROW : LABELED_MONTHS;
  return labeledMonths.includes(MONTHLY_COMMITS[index].month);
};

const readColors = () => {
  const styles = getComputedStyle(document.documentElement);
  const read = (name) => styles.getPropertyValue(name).trim();
  return {
    bar: read('--color-commits'),
    barHover: read('--color-commits-hover'),
    grid: read('--color-chart-grid'),
    text: read('--color-muted'),
  };
};

const buildOptions = (colors, reduceMotion) => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: reduceMotion ? false : { duration: 600 },
  interaction: { mode: 'index', intersect: false },
  layout: { padding: { top: 8 } },
  plugins: {
    legend: { display: false },
    tooltip: {
      displayColors: false,
      callbacks: {
        title: () => '',
        label: (context) => {
          const count = context.parsed.y;
          const noun = count === 1 ? 'commit' : 'commits';
          return `${count} ${noun} in ${formatMonth(MONTHLY_COMMITS[context.dataIndex])}`;
        },
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      border: { color: colors.grid },
      ticks: {
        autoSkip: false,
        maxRotation: 0,
        color: colors.text,
        callback: (value, index) => (isLabeledMonth(index) ? formatMonth(MONTHLY_COMMITS[index]) : ''),
      },
    },
    y: {
      position: 'right',
      beginAtZero: true,
      border: { display: false, dash: [4, 4] },
      grid: { color: colors.grid, tickBorderDash: [4, 4] },
      ticks: { color: colors.text },
      title: { display: true, text: 'Commits', color: colors.text },
    },
  },
});

const applyColors = (chart) => {
  const colors = readColors();
  const [dataset] = chart.data.datasets;
  dataset.backgroundColor = colors.bar;
  dataset.hoverBackgroundColor = colors.barHover;
  chart.options.scales.x.ticks.color = colors.text;
  chart.options.scales.x.border.color = colors.grid;
  chart.options.scales.y.ticks.color = colors.text;
  chart.options.scales.y.grid.color = colors.grid;
  chart.options.scales.y.title.color = colors.text;
  chart.update('none');
};

/**
 * Draws the monthly commit bar chart and keeps its colors in sync with the theme.
 */
const initCommitsChart = () => {
  const canvas = document.querySelector('.commits__canvas');
  if (!canvas || typeof Chart === 'undefined') {
    return;
  }

  const colors = readColors();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: MONTHLY_COMMITS.map(formatMonth),
      datasets: [
        {
          data: MONTHLY_COMMITS.map(({ count }) => count),
          backgroundColor: colors.bar,
          hoverBackgroundColor: colors.barHover,
          categoryPercentage: 1,
          barPercentage: 0.8,
          borderRadius: 3,
        },
      ],
    },
    options: buildOptions(colors, reduceMotion),
  });
};

initCommitsChart();
