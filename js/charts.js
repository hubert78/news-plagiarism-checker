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
      layout: {
        padding: { top: 4, bottom: 4, left: 4, right: 4 }
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 8,
            boxHeight: 8,
            usePointStyle: true,
            pointStyle: 'circle',
            font: { size: 10, family: 'Inter, system-ui, sans-serif' },
            color: '#475569',
            padding: 8
          }
        },
        title: {
          display: true,
          text: title,
          font: { size: 12, weight: '600', family: 'Inter, system-ui, sans-serif' },
          color: '#0f172a',
          padding: { top: 0, bottom: 6 }
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || '';
              const val = context.raw || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
              return ` ${label}: ${val} (${pct}%)`;
            }
          }
        }
      },
      cutout: '68%'
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
  if (!labels.length) return;

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

/**
 * Render All Analysis Charts (Visual Charts Tab & Internal Duplicates Tab)
 */
function renderAnalysisCharts(s1Cleaned, s2Cleaned, s1DupInfo, s2DupInfo, numPlagiarized, dataScores) {
  if (typeof Chart === 'undefined') return;

  const src1 = (typeof state !== 'undefined' && state.source1) ? state.source1 : "Source 1";
  const src2 = (typeof state !== 'undefined' && state.source2) ? state.source2 : "Source 2";

  // Helper to count articles by field
  function countBy(list, field) {
    const res = {};
    (list || []).forEach(item => {
      const val = item[field] || "General";
      res[val] = (res[val] || 0) + 1;
    });
    return res;
  }

  // 1. Proportion Plagiarized (Pie Charts)
  const len1 = s1Cleaned ? s1Cleaned.length : 0;
  const len2 = s2Cleaned ? s2Cleaned.length : 0;
  const plagS1 = {
    'Plagiarized': numPlagiarized,
    'Original': Math.max(0, len1 - numPlagiarized)
  };
  const plagS2 = {
    'Plagiarized': numPlagiarized,
    'Original': Math.max(0, len2 - numPlagiarized)
  };
  renderPieChart('chart-proportion-s1', `${src1} Plagiarism Ratio`, plagS1, 'plagiarism');
  renderPieChart('chart-proportion-s2', `${src2} Plagiarism Ratio`, plagS2, 'plagiarism');

  // 2. Category Breakdown (Bar Charts)
  const catData1 = (dataScores?.source1Categories && Object.keys(dataScores.source1Categories).length > 0)
    ? dataScores.source1Categories
    : countBy(s1Cleaned, 'Category');
  const catData2 = (dataScores?.source2Categories && Object.keys(dataScores.source2Categories).length > 0)
    ? dataScores.source2Categories
    : countBy(s2Cleaned, 'Category');

  renderBarChart('chart-categories-s1', `${src1} Categories`, catData1, '#059669');
  renderBarChart('chart-categories-s2', `${src2} Categories`, catData2, '#0284c7');

  // 3. Date Distribution (Horizontal Bar Charts)
  const dateData1 = (dataScores?.source1DateCount && Object.keys(dataScores.source1DateCount).length > 0)
    ? dataScores.source1DateCount
    : countBy(s1Cleaned, 'Date Posted');
  const dateData2 = (dataScores?.source2DateCount && Object.keys(dataScores.source2DateCount).length > 0)
    ? dataScores.source2DateCount
    : countBy(s2Cleaned, 'Date Posted');

  renderHorizontalBarChart('chart-dates-s1', `${src1} Dates`, dateData1, '#10b981');
  renderHorizontalBarChart('chart-dates-s2', `${src2} Dates`, dateData2, '#0ea5e9');

  // 4. Internal Similarity
  const withinS1 = (dataScores?.withinSourcePairs?.[src1] || []).length;
  const withinS2 = (dataScores?.withinSourcePairs?.[src2] || []).length;

  const simS1 = {
    'Similar': withinS1,
    'Distinct': Math.max(0, len1 - withinS1)
  };
  const simS2 = {
    'Similar': withinS2,
    'Distinct': Math.max(0, len2 - withinS2)
  };
  renderPieChart('chart-similar-s1', `${src1} Internal Similarity`, simS1, 'similar');
  renderPieChart('chart-similar-s2', `${src2} Internal Similarity`, simS2, 'similar');

  // 5. Duplicate URLs
  const dupS1 = {
    'Duplicate URL': s1DupInfo?.duplicates || 0,
    'Unique URL': s1DupInfo?.cleaned?.length || len1
  };
  const dupS2 = {
    'Duplicate URL': s2DupInfo?.duplicates || 0,
    'Unique URL': s2DupInfo?.cleaned?.length || len2
  };
  renderPieChart('chart-dup-s1', `${src1} Duplicate URLs`, dupS1, 'dup');
  renderPieChart('chart-dup-s2', `${src2} Duplicate URLs`, dupS2, 'dup');
}

const globalRootCharts = typeof window !== 'undefined' ? window : global;
globalRootCharts.ChartManager = {
  renderPieChart,
  renderBarChart,
  renderHorizontalBarChart,
  renderAnalysisCharts,
  destroyAllCharts
};
globalRootCharts.renderAnalysisCharts = renderAnalysisCharts;
