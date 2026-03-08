// ——— Aquifer response simulator (Jan 2000 – Dec 2025, monthly) ———
// Model: H(t+1) = H(t) + R(t) − α · P(t) − β · (H(t) − H_eq)
const START_YEAR = 2000;
const END_YEAR = 2025;
const TOTAL_MONTHS = (END_YEAR - START_YEAR + 1) * 12; // 312

const ALPHA = 0.02;
const BETA = 0.08;
const H_EQ = 10;

// Recharge: seasonal sinusoid (can be positive or negative around zero)
// R(t) = 0.4 * sin(2πt / 12)
function recharge(t) {
  return 0.4 * Math.sin((2 * Math.PI * t) / 12);
}

// Pumping: slider-controlled magnitude times seasonal irrigation demand
// P(t) = PumpSlider * max(0, sin(2π(t−3)/12))
function pumping(t, pumpSliderValue) {
  const seasonal = Math.max(0, Math.sin((2 * Math.PI * (t - 3)) / 12));
  return pumpSliderValue * seasonal;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthLabel(tIndex) {
  const year = START_YEAR + Math.floor(tIndex / 12);
  const month = tIndex % 12;
  return `${MONTH_NAMES[month]} ${year}`;
}

/**
 * Run aquifer simulation from Jan 2000 to Dec 2025 (monthly).
 * @param {number} pumpingSliderValue - Pumping rate (0–1500 m³/day) from slider
 * @returns {{ H: number[], labels: string[] }}
 */
function runSimulation(pumpingSliderValue) {
  const H = new Array(TOTAL_MONTHS);
  let prev = H_EQ;

  for (let t = 0; t < TOTAL_MONTHS; t++) {
    const R = recharge(t);
    const P = pumping(t, pumpingSliderValue);
    const next = prev + R - ALPHA * P - BETA * (prev - H_EQ);
    H[t] = next;
    prev = next;
  }

  const labels = new Array(TOTAL_MONTHS);
  for (let t = 0; t < TOTAL_MONTHS; t++) {
    labels[t] = monthLabel(t);
  }

  return { H, labels };
}

document.addEventListener("DOMContentLoaded", () => {
  const nameSpan = document.getElementById("footer-name");
  const chartCanvas = document.getElementById("groundwaterChart");
  const pumpingSlider = document.getElementById("pumpingSlider");
  const pumpingValueEl = document.getElementById("pumpingValue");
  const timeSlider = document.getElementById("timeSlider");
  const timeValueEl = document.getElementById("timeValue");

  const AUTHOR_NAME = "Your Name";
  if (nameSpan) nameSpan.textContent = AUTHOR_NAME;

  if (!chartCanvas || !window.Chart) {
    console.warn("[The Green Lens] Chart.js or canvas missing.");
    return;
  }

  const ctx = chartCanvas.getContext("2d");
  const groundwaterColor = "rgba(79, 211, 142, 1)";
  const groundwaterFill = "rgba(79, 211, 142, 0.12)";

  const initialPumping = pumpingSlider ? Number(pumpingSlider.value) : 0;
  const { H, labels } = runSimulation(initialPumping);

  const groundwaterChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Groundwater level (m)",
          data: H,
          borderColor: groundwaterColor,
          backgroundColor: groundwaterFill,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          labels: { color: "#e6f3f2", usePointStyle: true, boxWidth: 10 }
        },
        tooltip: {
          callbacks: {
            label(c) {
              return `${c.label}: ${c.parsed.y.toFixed(2)} m`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: "#9ebcc0", maxTicksLimit: 16 },
          grid: { color: "rgba(158, 188, 192, 0.12)" }
        },
        y: {
          title: {
            display: true,
            text: "Groundwater level (m)",
            color: "#c4f5e5"
          },
          ticks: { color: "#9ebcc0" },
          grid: { color: "rgba(79, 211, 142, 0.12)" }
        }
      }
    }
  });

  function updateSimulation() {
    if (!pumpingSlider || !timeSlider) return;

    const pumpValue = Number(pumpingSlider.value);
    const endIndex = Number(timeSlider.value);

    if (pumpingValueEl) {
      pumpingValueEl.textContent = `${pumpValue.toFixed(0)} m³/day`;
    }
    if (timeValueEl) {
      timeValueEl.textContent = monthLabel(endIndex);
    }

    const { H: newH, labels: newLabels } = runSimulation(pumpValue);
    const sliceEnd = Math.min(endIndex + 1, TOTAL_MONTHS);

    groundwaterChart.data.labels = newLabels.slice(0, sliceEnd);
    groundwaterChart.data.datasets[0].data = newH.slice(0, sliceEnd);
    groundwaterChart.update("none");
  }

  if (pumpingSlider) {
    pumpingSlider.addEventListener("input", updateSimulation);
  }
  if (timeSlider) {
    timeSlider.addEventListener("input", updateSimulation);
  }

  updateSimulation();
});
