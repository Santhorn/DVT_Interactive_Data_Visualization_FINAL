const CSV = "https://raw.githubusercontent.com/Santhorn/DVT_Interactive_Data_Visualization_FINAL/main/data/cleaned/_2568_cleaned.csv";
const months = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
const weekdays = ["จันทร์","อังคาร","พุธ","พฤหัสบดี","ศุกร์","เสาร์","อาทิตย์"];

let rawData = [];
let chartInstances = {};

// ฟังก์ชันโหลดข้อมูลด้วย fetch + PapaParse เพื่อป้องกัน Error เรื่องการโหลด
fetch(CSV)
  .then(response => {
    if (!response.ok) throw new Error("Network response was not ok: " + response.statusText);
    return response.text();
  })
  .then(csvText => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: function(results) {
        rawData = results.data.map(d => {
          const dateObj = new Date(d["Dead Date"]);
          return {
            ...d,
            Age: Number(d["Age"]) || 0,
            "Dead Date": dateObj,
            "เดือนที่เสียชีวิต": !isNaN(dateObj) ? months[dateObj.getMonth()] : "ไม่ระบุ",
            "วันในสัปดาห์": !isNaN(dateObj) ? weekdays[(dateObj.getDay() + 6) % 7] : "ไม่ระบุ"
          };
        });
        initFilters();
        updateDashboard();
      }
    });
  })
  .catch(err => {
    console.error("CSV Load Error:", err);
    document.querySelector("#summary").innerHTML = `<span style="color:#ef4444; font-weight:bold;">โหลดข้อมูลไม่สำเร็จ: ${err.message}</span>`;
  });

function initFilters() {
  fillSelect("month", months);
  fillSelect("sex", [...new Set(rawData.map(d => d.Sex))].filter(Boolean).sort((a,b) => a.localeCompare(b,"th")));
  fillSelect("province", [...new Set(rawData.map(d => d["จ.ที่เสียชีวิต"]))].filter(Boolean).sort((a,b) => a.localeCompare(b,"th")));
  fillSelect("vehicle", [...new Set(rawData.map(d => d["Vehicle Merge Final"]))].filter(Boolean).sort((a,b) => a.localeCompare(b,"th")));

  ["month", "sex", "province", "vehicle"].forEach(id => {
    document.querySelector("#" + id).addEventListener("change", updateDashboard);
  });

  document.querySelector("#reset").onclick = () => {
    ["month", "sex", "province", "vehicle"].forEach(id => document.querySelector("#" + id).value = "ทั้งหมด");
    updateDashboard();
  };
}

function fillSelect(id, values) {
  const select = document.querySelector("#" + id);
  select.innerHTML = '<option value="ทั้งหมด">ทั้งหมด</option>';
  values.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    select.appendChild(opt);
  });
}

function getFilteredData() {
  const m = document.querySelector("#month").value,
        s = document.querySelector("#sex").value,
        p = document.querySelector("#province").value,
        v = document.querySelector("#vehicle").value;

  return rawData.filter(d => 
    (m === "ทั้งหมด" || d["เดือนที่เสียชีวิต"] === m) &&
    (s === "ทั้งหมด" || d.Sex === s) &&
    (p === "ทั้งหมด" || d["จ.ที่เสียชีวิต"] === p) &&
    (v === "ทั้งหมด" || d["Vehicle Merge Final"] === v)
  );
}

function getCounts(data, key) {
  const counts = {};
  data.forEach(d => {
    const val = d[key] || "ไม่ระบุ";
    counts[val] = (counts[val] || 0) + 1;
  });
  return counts;
}

function updateDashboard() {
  const filtered = getFilteredData();
  const total = filtered.length;
  const ages = filtered.map(d => d.Age).filter(a => a > 0);
  const avgAge = ages.length ? (ages.reduce((a,b) => a+b, 0) / ages.length).toFixed(1) : "-";

  const provCounts = getCounts(filtered, "จ.ที่เสียชีวิต");
  const topProv = Object.entries(provCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || "-";

  const vehCounts = getCounts(filtered, "Vehicle Merge Final");
  const topVeh = Object.entries(vehCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || "-";

  document.querySelector("#total").textContent = total.toLocaleString();
  document.querySelector("#avgAge").textContent = avgAge;
  document.querySelector("#topProvince").textContent = topProv;
  document.querySelector("#topVehicle").textContent = topVeh;
  document.querySelector("#summary").innerHTML = `ข้อมูลที่เลือกมี <b>${total.toLocaleString()}</b> ราย อายุเฉลี่ย <b>${avgAge}</b> ปี จังหวัดที่พบมากที่สุดคือ <b>${topProv}</b> และยานพาหนะที่พบมากที่สุดคือ <b>${topVeh}</b>`;

  renderLineChart(filtered);
  renderDonutChart(filtered);
  renderVehicleChart(vehCounts);
  renderWeekdayChart(filtered);
  renderProvinceChart(provCounts);
}

function renderLineChart(data) {
  const monthCounts = months.map(m => data.filter(d => d["เดือนที่เสียชีวิต"] === m).length);
  const ctx = document.getElementById("line").getContext("2d");
  if (chartInstances["line"]) chartInstances["line"].destroy();

  chartInstances["line"] = new Chart(ctx, {
    type: "line",
    data: {
      labels: months,
      datasets: [{
        label: "ผู้เสียชีวิต (ราย)",
        data: monthCounts,
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.15)",
        fill: true,
        tension: 0.3,
        pointRadius: 5
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

function renderDonutChart(data) {
  const sexCounts = getCounts(data, "Sex");
  const ctx = document.getElementById("donut").getContext("2d");
  if (chartInstances["donut"]) chartInstances["donut"].destroy();

  chartInstances["donut"] = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: Object.keys(sexCounts),
      datasets: [{
        data: Object.values(sexCounts),
        backgroundColor: ["#2563eb", "#ec4899", "#94a3b8"]
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

function renderVehicleChart(vehCounts) {
  const sorted = Object.entries(vehCounts).sort((a,b) => b[1] - a[1]).slice(0, 10);
  const ctx = document.getElementById("vehicleChart").getContext("2d");
  if (chartInstances["vehicleChart"]) chartInstances["vehicleChart"].destroy();

  chartInstances["vehicleChart"] = new Chart(ctx, {
    type: "bar",
    data: {
      labels: sorted.map(d => d[0]),
      datasets: [{
        label: "ผู้เสียชีวิต (ราย)",
        data: sorted.map(d => d[1]),
        backgroundColor: "#3b82f6"
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

function renderWeekdayChart(data) {
  const counts = weekdays.map(w => data.filter(d => d["วันในสัปดาห์"] === w).length);
  const ctx = document.getElementById("weekday").getContext("2d");
  if (chartInstances["weekday"]) chartInstances["weekday"].destroy();

  chartInstances["weekday"] = new Chart(ctx, {
    type: "bar",
    data: {
      labels: weekdays,
      datasets: [{
        label: "ผู้เสียชีวิต (ราย)",
        data: counts,
        backgroundColor: "#10b981"
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

function renderProvinceChart(provCounts) {
  const sorted = Object.entries(provCounts).sort((a,b) => b[1] - a[1]).slice(0, 10);
  const ctx = document.getElementById("provinceChart").getContext("2d");
  if (chartInstances["provinceChart"]) chartInstances["provinceChart"].destroy();

  chartInstances["provinceChart"] = new Chart(ctx, {
    type: "bar",
    data: {
      labels: sorted.map(d => d[0]),
      datasets: [{
        label: "ผู้เสียชีวิต (ราย)",
        data: sorted.map(d => d[1]),
        backgroundColor: "#f59e0b"
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false
    }
  });
}
