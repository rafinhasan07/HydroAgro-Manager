const START_YEAR = 2000;
const END_YEAR = 2025;
const TOTAL_MONTHS = (END_YEAR - START_YEAR + 1) * 12;

const AQUIFER_AREA_M2 = 1000000; 
const SPECIFIC_YIELD = 0.15;
const RECHARGE_COEFF = 0.20; 
const INITIAL_DEPTH = 30.0; 

// Seasonal Distribution (Monthly weights summing to 1.0)
const PRECIP_DIST = [0.03, 0.03, 0.06, 0.09, 0.14, 0.15, 0.18, 0.15, 0.08, 0.05, 0.02, 0.02];
const IRRIG_DIST = [0.0, 0.0, 0.0, 0.0, 0.20, 0.30, 0.30, 0.20, 0.0, 0.0, 0.0, 0.0];
const POND_DIST = Array(12).fill(1/12);

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function runSimulation(precipAnnual_mm, pondAnnual_m3, pumpAnnual_m3) {
  let currentDepth = INITIAL_DEPTH;
  const depthArray = [];
  const labels = [];

  for (let t = 0; t < TOTAL_MONTHS; t++) {
    const m = t % 12;
    const precipMonthly_m = (precipAnnual_mm / 1000) * PRECIP_DIST[m];
    const pondMonthly_m3 = pondAnnual_m3 * POND_DIST[m];
    const pumpMonthly_m3 = pumpAnnual_m3 * IRRIG_DIST[m];

    // Closed System Mass Balance
    const dD_recharge = ((precipMonthly_m * RECHARGE_COEFF * AQUIFER_AREA_M2) + pondMonthly_m3) / (AQUIFER_AREA_M2 * SPECIFIC_YIELD);
    const dD_pump = pumpMonthly_m3 / (AQUIFER_AREA_M2 * SPECIFIC_YIELD);

    // Decrease depth for recharge, Increase depth for pumping
    currentDepth = currentDepth - dD_recharge + dD_pump;
    
    depthArray.push(currentDepth);
    labels.push(`${MONTH_NAMES[m]} ${START_YEAR + Math.floor(t / 12)}`);
  }
  return { depthArray, labels };
}

const sliders = ["precipSlider", "pondSlider", "pumpSlider", "timeSlider"].map(id => document.getElementById(id));
const ctx = document.getElementById("groundwaterChart").getContext("2d");

let gwChart = new Chart(ctx, {
  type: "line",
  data: { labels: [], datasets: [] },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { 
        reverse: true, 
        title: { display: true, text: "Depth to Water Table (m)", color: "#7a8dfa" }, 
        ticks: { color: "#9ebcc0" } 
      },
      x: { ticks: { color: "#9ebcc0", maxTicksLimit: 12 } }
    },
    plugins: { 
        legend: { display: false },
        tooltip: {
            callbacks: {
                label: (c) => `Depth: ${c.parsed.y.toFixed(2)} m`
            }
        }
    }
  }
});

function update() {
  const [p, pond, pump, time] = sliders.map(s => Number(s.value));
  const { depthArray, labels } = runSimulation(p, pond, pump);

  document.getElementById("precipValue").textContent = p.toLocaleString();
  document.getElementById("pondValue").textContent = pond.toLocaleString();
  document.getElementById("pumpValue").textContent = pump.toLocaleString();
  document.getElementById("timeValue").textContent = labels[time-1] || "";

  gwChart.data.labels = labels.slice(0, time);
  gwChart.data.datasets = [{
    data: depthArray.slice(0, time),
    borderColor: "#7a8dfa", 
    backgroundColor: "rgba(122, 141, 250, 0.2)",
    fill: true,
    tension: 0.2,
    pointRadius: 0
  }];
  gwChart.update();
}

sliders.forEach(s => s.addEventListener("input", update));
update();