/**
 * Chart.js Visualizations Manager - Minimalist Palette
 */

const chartInstances = {};

function destroyChart(id) {
  if (chartInstances[id]) {
    chartInstances[id].destroy();
    delete chartInstances[id];
  }
}

function destroyAllCharts() {
  Object.keys(chartInstances).forEach(id => destroyChart(id));
}

// Minimal, elegant color palettes
const PALETTES = {
  plagiarism: ['#dc2626', '#e2e8f0'], // Plagiarized (muted red) vs Original (light slate)
  similar: ['#f59e0b', '#e2e8f0'],    // Similar (amber) vs Different (light slate)
  dup: ['#6366f1', '#e2e8f0'],        // Duplicates (indigo) vs Unique (light slate)
  bars: ['#0f172a', '#334155', '#475569', '#64748b', '#94a3b8']
};

/**
 * Render Donut/Pie Chart
 */
function renderPieChart(canvasId, title, dataObj, type = 'plagiarism') {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  const labels = Object.keys(dataObj);
  const values = Object.values(dataObj);
  const colors = PALETTES[type] || PALETTES.plagiarism;

  chartInstances[canvasId] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: colors.slice(0, labels.length),
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 8,
            boxHeight: 8,
            usePointStyle: true,
            pointStyle: 'circle',
            font: { size: 11, family: 'Inter, system-ui, sans-serif' },
            color: '#475569'
          }
        },
        title: {
          display: true,
          text: title,
          font: { size: 13, weight: '600', family: 'Inter, system-ui, sans-serif' },
          color: '#0f172a',
          padding: { bottom: 12 }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const val = context.raw || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
              return ` ${label}: ${val} (${pct}%)`;
            }
          }
        }
      },
      cutout: '72%'
    }
  });
}

/**
 * Render Vertical Bar Chart (Categories)
 */
function renderBarChart(canvasId, title, dataObj, barColor = '#0f172a') {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  const labels = Object.keys(dataObj);
  const values = Object.values(dataObj);

  chartInstances[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: barColor,
        borderRadius: 4,
        barThickness: 24
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: title,
          font: { size: 13, weight: '600', family: 'Inter, system-ui, sans-serif' },
          color: '#0f172a',
          padding: { bottom: 12 }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#f1f5f9' },
          ticks: { stepSize: 1, precision: 0, font: { size: 11 }, color: '#64748b' }
        },
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 }, color: '#64748b' }
        }
      }
    }
  });
}

/**
 * Render Horizontal Bar Chart (Dates)
 */
function renderHorizontalBarChart(canvasId, title, dataObj, barColor = '#334155') {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  const labels = Object.keys(dataObj);
  const values = Object.values(dataObj);

  chartInstances[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: barColor,
        borderRadius: 4,
        barThickness: 16
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: title,
          font: { size: 13, weight: '600', family: 'Inter, system-ui, sans-serif' },
          color: '#0f172a',
          padding: { bottom: 12 }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: '#f1f5f9' },
          ticks: { stepSize: 1, precision: 0, font: { size: 11 }, color: '#64748b' }
        },
        y: {
          grid: { display: false },
          ticks: { font: { size: 11 }, color: '#64748b' }
        }
      }
    }
  });
}

const globalRootCharts = typeof window !== 'undefined' ? window : global;
globalRootCharts.ChartManager = {
  renderPieChart,
  renderBarChart,
  renderHorizontalBarChart,
  destroyAllCharts
};
