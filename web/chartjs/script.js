const CSV="https://raw.githubusercontent.com/Santhorn/DVT_Interactive_Data_Visualization_FINAL/main/data/cleaned/_2568_cleaned.csv"const months = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
const weekdays = ["จันทร์","อังคาร","พุธ","พฤหัสบดี","ศุกร์","เสาร์","อาทิตย์"];

let data = [], charts = {};

// พาเลทสีสำหรับ Chart.js (โทนสีส้ม / ม่วง / พาสเทล)
const primaryColor = "#6366f1";     // Indigo / ม่วงอมฟ้า
const secondaryColor = "#f97316";   // Orange / ส้ม
const accentColors = [
  "#6366f1", "#f97316", "#14b8a6", "#ec4899", 
  "#8b5cf6", "#f59e0b", "#06b6d4", "#84cc16",
  "#e11d48", "#3b82f6", "#10b981", "#64748b"
];

function parseDate(x) { return new Date(x); }

function prep(d) {
  d.Age = +d.Age;
  d.date = parseDate(d["Dead Date"]);
  d.month = months[d.date.getMonth()];
  d.weekday = weekdays[(d.date.getDay() + 6) % 7];
  return d;
}

function fill(id, vals) {
  const s = document.getElementById(id);
  s.innerHTML = '<option value="ทั้งหมด">ทั้งหมด</option>';
  vals.forEach(v => {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = v;
    s.appendChild(o);
  });
  s.onchange = update;
}

function count(arr, key) {
  const m = {};
  arr.forEach(d => {
    const v = d[key] ?? "ไม่ระบุ";
    m[v] = (m[v] || 0) + 1;
  });
  return Object.entries(m)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function filtered() {
  const m = document.getElementById("month").value,
        s = document.getElementById("sex").value,
        p = document.getElementById("province").value,
        v = document.getElementById("vehicle").value;
  return data.filter(d => 
    (m === "ทั้งหมด" || d.month === m) &&
    (s === "ทั้งหมด" || d.Sex === s) &&
    (p === "ทั้งหมด" || d["จ.ที่เสียชีวิต"] === p) &&
    (v === "ทั้งหมด" || d["Vehicle Merge Final"] === v)
  );
}

function destroy() {
  Object.values(charts).forEach(c => c.destroy());
  charts = {};
}

// ค่ากำหนดพื้นฐานของ Chart.js
function baseOpts(xTitle = "", yTitle = "") {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: "#1e293b",
        titleFont: { size: 13, family: "Arial, sans-serif" },
        bodyFont: { size: 12, family: "Arial, sans-serif" },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            const val = context.raw || 0;
            const dataset = context.chart.data.datasets[0].data;
            const total = dataset.reduce((a, b) => a + b, 0) || 1;
            const pct = ((val / total) * 100).toFixed(1);
            return ` จำนวน: ${val.toLocaleString()} ราย (${pct}%)`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: !!xTitle,
          text: xTitle,
          color: "#64748b",
          font: { size: 12, weight: 'bold' }
        },
        grid: { display: false }
      },
      y: {
        beginAtZero: true,
        title: {
          display: !!yTitle,
          text: yTitle,
          color: "#64748b",
          font: { size: 12, weight: 'bold' }
        },
        grid: { color: "#f1f5f9" }
      }
    },
    animation: { duration: 300 }
  };
}

function update() {
  const arr = filtered();
  document.getElementById("total").textContent = arr.length.toLocaleString();
  
  const ages = arr.map(d => d.Age).filter(Number.isFinite);
  document.getElementById("avgAge").textContent = ages.length 
    ? (ages.reduce((a, b) => a + b, 0) / ages.length).toFixed(1) 
    : "-";

  const p = count(arr, "จ.ที่เสียชีวิต")[0], 
        v = count(arr, "Vehicle Merge Final")[0];
  document.getElementById("topProvince").textContent = p?.label || "-";
  document.getElementById("topVehicle").textContent = v?.label || "-";

  destroy();

  // 1. Line Chart (จำนวนผู้เสียชีวิตรายเดือน)
  const mc = Object.fromEntries(months.map(x => [x, 0]));
  arr.forEach(d => { if(mc[d.month] !== undefined) mc[d.month]++; });
  
  charts["line"] = new Chart(document.getElementById("line"), {
    type: "line",
    data: {
      labels: months,
      datasets: [{
        label: "จำนวนผู้เสียชีวิต",
        data: months.map(x => mc[x]),
        borderColor: primaryColor,
        backgroundColor: "rgba(99, 102, 241, 0.12)",
        fill: true,
        tension: 0.35,
        pointBackgroundColor: primaryColor,
        pointBorderColor: "#fff",
        pointHoverRadius: 7,
        pointRadius: 4
      }]
    },
    options: baseOpts("เดือน", "จำนวน (ราย)")
  });

  // 2. Donut Chart (สัดส่วนตามเพศ)
  const sx = count(arr, "Sex");
  charts["donut"] = new Chart(document.getElementById("donut"), {
    type: "doughnut",
    data: {
      labels: sx.map(x => x.label),
      datasets: [{
        data: sx.map(x => x.value),
        backgroundColor: ["#6366f1", "#ec4899", "#94a3b8"],
        borderWidth: 2,
        borderColor: "#ffffff"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "right",
          labels: { font: { size: 12 }, usePointStyle: true }
        },
        tooltip: baseOpts().plugins.tooltip
      }
    }
  });

  // 3. Vehicle Bar Chart (ประเภทยานพาหนะ)
  const vh = count(arr, "Vehicle Merge Final").slice(0, 12);
  charts["vehicleChart"] = new Chart(document.getElementById("vehicleChart"), {
    type: "bar",
    data: {
      labels: vh.map(x => x.label),
      datasets: [{
        data: vh.map(x => x.value),
        backgroundColor: accentColors,
        borderRadius: 5
      }]
    },
    options: {
      ...baseOpts("ยานพาหนะ", "จำนวน (ราย)"),
      scales: {
        ...baseOpts("ยานพาหนะ", "จำนวน (ราย)").scales,
        x: {
          ticks: { maxRotation: 45, minRotation: 25 },
          grid: { display: false }
        }
      }
    }
  });

  // 4. Weekday Bar Chart (วันในสัปดาห์)
  const wd = weekdays.map(x => ({ label: x, value: arr.filter(d => d.weekday === x).length }));
  charts["weekday"] = new Chart(document.getElementById("weekday"), {
    type: "bar",
    data: {
      labels: wd.map(x => x.label),
      datasets: [{
        data: wd.map(x => x.value),
        backgroundColor: secondaryColor,
        borderRadius: 5
      }]
    },
    options: baseOpts("วันในสัปดาห์", "จำนวน (ราย)")
  });

  // 5. Province Horizontal Bar Chart (10 จังหวัดสูงสุด)
  const pr = count(arr, "จ.ที่เสียชีวิต").slice(0, 10).reverse();
  charts["provinceChart"] = new Chart(document.getElementById("provinceChart"), {
    type: "bar",
    data: {
      labels: pr.map(x => x.label),
      datasets: [{
        data: pr.map(x => x.value),
        backgroundColor: accentColors.slice().reverse(),
        borderRadius: 5
      }]
    },
    options: {
      indexAxis: "y",
      ...baseOpts("จำนวนผู้เสียชีวิต (ราย)", "จังหวัด"),
      scales: {
        x: {
          beginAtZero: true,
          title: { display: true, text: "จำนวนผู้เสียชีวิต (ราย)", color: "#64748b" },
          grid: { color: "#f1f5f9" }
        },
        y: {
          grid: { display: false }
        }
      }
    }
  });

  document.getElementById("summary").innerHTML = `ข้อมูลที่เลือกมี <b>${arr.length.toLocaleString()}</b> ราย อายุเฉลี่ย <b>${ages.length ? (ages.reduce((a, b) => a + b, 0) / ages.length).toFixed(1) : "-"}</b> ปี จังหวัดที่พบมากที่สุดคือ <b>${p?.label || "-"}</b> และยานพาหนะที่พบมากที่สุดคือ <b>${v?.label || "-"}</b>`;
}

document.getElementById("reset").onclick = () => {
  ["month", "sex", "province", "vehicle"].forEach(id => document.getElementById(id).value = "ทั้งหมด");
  update();
};

Papa.parse(CSV, {
  download: true,
  header: true,
  skipEmptyLines: true,
  complete: r => {
    data = r.data.map(prep);
    fill("month", months);
    fill("sex", [...new Set(data.map(d => d.Sex))].filter(Boolean).sort((a, b) => a.localeCompare(b, "th")));
    fill("province", [...new Set(data.map(d => d["จ.ที่เสียชีวิต"]))].filter(Boolean).sort((a, b) => a.localeCompare(b, "th")));
    fill("vehicle", [...new Set(data.map(d => d["Vehicle Merge Final"]))].filter(Boolean).sort((a, b) => a.localeCompare(b, "th")));
    update();
  },
  error: e => document.getElementById("summary").textContent = "โหลดข้อมูลไม่สำเร็จ: " + e.message
});
