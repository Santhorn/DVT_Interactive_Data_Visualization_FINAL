const CSV="https://raw.githubusercontent.com/Santhorn/DVT_Interactive_Data_Visualization_FINAL/main/data/cleaned/_2568_cleaned.csv";
const months=["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
const weekdays=["จันทร์","อังคาร","พุธ","พฤหัสบดี","ศุกร์","เสาร์","อาทิตย์"];
let data=[], current=[];

function normalize(d){
  d["Age"]=+d["Age"]; 
  d["Dead Date"]=new Date(d["Dead Date"]);
  d["เดือนที่เสียชีวิต"]=months[d["Dead Date"].getMonth()];
  d["วันในสัปดาห์"]=weekdays[(d["Dead Date"].getDay()+6)%7]; 
  return d;
}

function fillSelect(id, values){
  const s=d3.select("#"+id); 
  s.selectAll("option").remove(); 
  s.append("option").attr("value","ทั้งหมด").text("ทั้งหมด");
  values.forEach(v=>s.append("option").attr("value",v).text(v)); 
  s.on("change",update);
}

function options(){
  fillSelect("month",months);
  fillSelect("sex",[...new Set(data.map(d=>d.Sex))].filter(Boolean).sort((a,b)=>a.localeCompare(b,"th")));
  fillSelect("province",[...new Set(data.map(d=>d["จ.ที่เสียชีวิต"]))].filter(Boolean).sort((a,b)=>a.localeCompare(b,"th")));
  fillSelect("vehicle",[...new Set(data.map(d=>d["Vehicle Merge Final"]))].filter(Boolean).sort((a,b)=>a.localeCompare(b,"th")));
}

function filtered(){
  const m=document.querySelector("#month").value,
        s=document.querySelector("#sex").value,
        p=document.querySelector("#province").value,
        v=document.querySelector("#vehicle").value;
  return data.filter(d=>(m==="ทั้งหมด"||d["เดือนที่เสียชีวิต"]===m)&&(s==="ทั้งหมด"||d.Sex===s)&&(p==="ทั้งหมด"||d["จ.ที่เสียชีวิต"]===p)&&(v==="ทั้งหมด"||d["Vehicle Merge Final"]===v));
}

function counts(arr,key){
  return d3.rollups(arr,v=>v.length,d=>d[key])
    .map(([label,value])=>({label: label || "ไม่ระบุ", value}))
    .sort((a,b)=>d3.descending(a.value,b.value));
}

function clear(id){d3.select("#"+id).selectAll("*").remove()}

// -------------------------------------------------------------
// สร้าง Tooltip Element สำหรับแสดงข้อมูลเมื่อ Hover
// -------------------------------------------------------------
let tooltip = d3.select("body").select(".custom-tooltip");
if (tooltip.empty()) {
  tooltip = d3.select("body").append("div")
    .attr("class", "custom-tooltip")
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("background", "#111827")
    .style("color", "#fff")
    .style("padding", "8px 12px")
    .style("border-radius", "8px")
    .style("font-size", "13px")
    .style("box-shadow", "0 4px 12px rgba(0,0,0,0.2)")
    .style("opacity", 0)
    .style("z-index", 1000)
    .style("transition", "opacity 0.15s ease");
}

function showTooltip(event, htmlContent) {
  tooltip.html(htmlContent)
    .style("left", (event.pageX + 15) + "px")
    .style("top", (event.pageY - 28) + "px")
    .style("opacity", 1);
}

function moveTooltip(event) {
  tooltip.style("left", (event.pageX + 15) + "px")
    .style("top", (event.pageY - 28) + "px");
}

function hideTooltip() {
  tooltip.style("opacity", 0);
}

function svgBox(id){
  const el=document.querySelector("#"+id),w=el.clientWidth,h=el.clientHeight;
  return {el,w,h,svg:d3.select(el).append("svg").attr("width",w).attr("height",h)}
}

// -------------------------------------------------------------
// 1. Line Chart (จำนวนผู้เสียชีวิตรายเดือน)
// -------------------------------------------------------------
function drawLine(arr){
  clear("line"); 
  const {w,h,svg}=svgBox("line");
  const m={t:30, r:30, b:65, l:60}, iw=w-m.l-m.r, ih=h-m.t-m.b;
  const c=Object.fromEntries(months.map(x=>[x,0])); 
  arr.forEach(d=>{ if(c[d["เดือนที่เสียชีวิต"]] !== undefined) c[d["เดือนที่เสียชีวิต"]]++; });
  const pts=months.map(label=>({label, value:c[label]}));

  const x=d3.scalePoint().domain(months).range([0,iw]); 
  const y=d3.scaleLinear().domain([0,(d3.max(pts,d=>d.value)||1)*1.15]).nice().range([ih,0]);
  const g=svg.append("g").attr("transform",`translate(${m.l},${m.t})`);

  // แกน X & Y
  g.append("g").attr("transform",`translate(0,${ih})`).call(d3.axisBottom(x)).selectAll("text").attr("transform","rotate(-30)").style("text-anchor","end");
  g.append("g").call(d3.axisLeft(y).ticks(5));

  // ชื่อแกน X & Y
  svg.append("text").attr("x", m.l + iw/2).attr("y", h - 5).attr("text-anchor","middle").style("font-size","12px").style("fill","#475569").text("เดือน");
  svg.append("text").attr("transform","rotate(-90)").attr("x", -m.t - ih/2).attr("y", 18).attr("text-anchor","middle").style("font-size","12px").style("fill","#475569").text("จำนวน (ราย)");

  // เส้นกราฟ & พื้นหลัง
  const area=d3.area().x(d=>x(d.label)).y0(ih).y1(d=>y(d.value)).curve(d3.curveMonotoneX);
  const line=d3.line().x(d=>x(d.label)).y(d=>y(d.value)).curve(d3.curveMonotoneX);

  g.append("path").datum(pts).attr("fill","#3b82f6").attr("fill-opacity",0.15).attr("d",area);
  g.append("path").datum(pts).attr("fill","none").attr("stroke","#2563eb").attr("stroke-width",3).attr("d",line);

  // จุดข้อมูล + Interactive Tooltip
  const totalVal = d3.sum(pts, d => d.value) || 1;
  g.selectAll("circle").data(pts).join("circle")
   .attr("cx",d=>x(d.label)).attr("cy",d=>y(d.value)).attr("r",6).attr("fill","#2563eb").attr("stroke","#fff").attr("stroke-width",2)
   .style("cursor","pointer")
   .on("mouseover", (event, d) => {
      d3.select(event.currentTarget).attr("r", 9).attr("fill", "#1d4ed8");
      const pct = ((d.value / totalVal) * 100).toFixed(1);
      showTooltip(event, `<b>เดือน:</b> ${d.label}<br/><b>ผู้เสียชีวิต:</b> ${d.value.toLocaleString()} ราย (${pct}%)`);
   })
   .on("mousemove", moveTooltip)
   .on("mouseout", (event) => {
      d3.select(event.currentTarget).attr("r", 6).attr("fill", "#2563eb");
      hideTooltip();
   });

  g.selectAll(".val-label").data(pts).join("text")
   .attr("x",d=>x(d.label)).attr("y",d=>y(d.value)-10)
   .attr("text-anchor","middle").style("font-size","10px").style("fill","#1e293b").style("font-weight","bold")
   .text(d=>d.value > 0 ? d.value.toLocaleString() : "");
}

// -------------------------------------------------------------
// 2. Donut Chart (สัดส่วนตามเพศ)
// -------------------------------------------------------------
function drawDonut(arr){
  clear("donut"); 
  const {w,h,svg}=svgBox("donut");
  const r=Math.min(w,h)/2 - 40;
  const g=svg.append("g").attr("transform",`translate(${w/2 - 40},${h/2})`);
  const rows=counts(arr,"Sex");
  
  const color=d3.scaleOrdinal()
    .domain(["ชาย","หญิง"])
    .range(["#2563eb", "#ec4899", "#94a3b8"]);

  const pie=d3.pie().value(d=>d.value)(rows);
  const arc=d3.arc().innerRadius(r*0.55).outerRadius(r);
  const arcHover=d3.arc().innerRadius(r*0.55).outerRadius(r + 6);

  const totalVal = arr.length || 1;

  g.selectAll("path").data(pie).join("path")
   .attr("d",arc)
   .attr("fill",d=>color(d.data.label))
   .attr("stroke","#fff").attr("stroke-width",2)
   .style("cursor","pointer")
   .on("mouseover", (event, d) => {
      d3.select(event.currentTarget).attr("d", arcHover);
      const pct = ((d.data.value / totalVal) * 100).toFixed(1);
      showTooltip(event, `<b>เพศ:</b> ${d.data.label}<br/><b>จำนวน:</b> ${d.data.value.toLocaleString()} ราย (${pct}%)`);
   })
   .on("mousemove", moveTooltip)
   .on("mouseout", (event) => {
      d3.select(event.currentTarget).attr("d", arc);
      hideTooltip();
   });

  g.append("text").attr("text-anchor","middle").attr("dy","0.3em").attr("font-size","22px").attr("font-weight","bold").attr("fill","#1e293b").text(arr.length.toLocaleString());

  // Legend
  const legend = svg.append("g").attr("transform", `translate(${w - 90}, ${h/2 - (rows.length*12)})`);
  rows.forEach((d, i) => {
    const lg = legend.append("g").attr("transform", `translate(0, ${i * 24})`);
    lg.append("rect").attr("width", 14).attr("height", 14).attr("rx", 3).attr("fill", color(d.label));
    lg.append("text").attr("x", 20).attr("y", 12).style("font-size", "12px").style("fill", "#334155").text(`${d.label}`);
  });
}

// -------------------------------------------------------------
// 3. Bar Charts (แท่งตั้ง & แท่งนอน)
// -------------------------------------------------------------
function drawBars(id,rows,horizontal=false){
  clear(id); 
  const {w,h,svg}=svgBox(id);
  const m={
    t: 20, 
    r: horizontal ? 45 : 20, 
    b: horizontal ? 45 : 75, 
    l: horizontal ? 140 : 55
  }, iw=w-m.l-m.r, ih=h-m.t-m.b;

  rows = rows.slice(0, horizontal ? 10 : 12);
  const totalVal = d3.sum(rows, d => d.value) || 1;

  const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

  const x = horizontal 
    ? d3.scaleLinear().domain([0, (d3.max(rows,d=>d.value)||1)*1.15]).nice().range([0,iw])
    : d3.scaleBand().domain(rows.map(d=>d.label)).range([0,iw]).padding(0.25);

  const y = horizontal 
    ? d3.scaleBand().domain(rows.map(d=>d.label)).range([0,ih]).padding(0.25)
    : d3.scaleLinear().domain([0, (d3.max(rows,d=>d.value)||1)*1.15]).nice().range([ih,0]);

  const g=svg.append("g").attr("transform",`translate(${m.l},${m.t})`);

  if(horizontal){
    // แกน X & Y (Horizontal)
    g.append("g").call(d3.axisLeft(y));
    g.append("g").attr("transform",`translate(0,${ih})`).call(d3.axisBottom(x).ticks(5));

    // ชื่อแกน
    svg.append("text").attr("x", m.l + iw/2).attr("y", h - 8).attr("text-anchor","middle").style("font-size","12px").style("fill","#475569").text("จำนวนผู้เสียชีวิต (ราย)");
    
    // แท่งกราฟ + Hover
    g.selectAll(".bar").data(rows).join("rect")
     .attr("class","bar").attr("x",0).attr("y",d=>y(d.label))
     .attr("width",d=>x(d.value)).attr("height",y.bandwidth())
     .attr("fill",(d,i)=>colorScale(i)).attr("rx", 3)
     .style("cursor","pointer")
     .on("mouseover", (event, d) => {
        d3.select(event.currentTarget).style("opacity", 0.8);
        const pct = ((d.value / totalVal) * 100).toFixed(1);
        showTooltip(event, `<b>${d.label}:</b> ${d.value.toLocaleString()} ราย (${pct}%)`);
     })
     .on("mousemove", moveTooltip)
     .on("mouseout", (event) => {
        d3.select(event.currentTarget).style("opacity", 1);
        hideTooltip();
     });

    // Data Labels
    g.selectAll(".val-label").data(rows).join("text")
     .attr("x",d=>x(d.value)+5).attr("y",d=>y(d.label)+y.bandwidth()/2+4)
     .style("font-size","11px").style("fill","#334155").style("font-weight","bold")
     .text(d=>d.value.toLocaleString());

  } else {
    // แกน X & Y (Vertical)
    g.append("g").attr("transform",`translate(0,${ih})`).call(d3.axisBottom(x)).selectAll("text").attr("transform","rotate(-35)").style("text-anchor","end");
    g.append("g").call(d3.axisLeft(y).ticks(5));

    // ชื่อแกน Y
    svg.append("text").attr("transform","rotate(-90)").attr("x", -m.t - ih/2).attr("y", 16).attr("text-anchor","middle").style("font-size","12px").style("fill","#475569").text("จำนวน (ราย)");

    // แท่งกราฟ + Hover
    g.selectAll(".bar").data(rows).join("rect")
     .attr("x",d=>x(d.label)).attr("y",d=>y(d.value))
     .attr("width",x.bandwidth()).attr("height",d=>ih-y(d.value))
     .attr("fill",(d,i)=>colorScale(i)).attr("rx", 3)
     .style("cursor","pointer")
     .on("mouseover", (event, d) => {
        d3.select(event.currentTarget).style("opacity", 0.8);
        const pct = ((d.value / totalVal) * 100).toFixed(1);
        showTooltip(event, `<b>${d.label}:</b> ${d.value.toLocaleString()} ราย (${pct}%)`);
     })
     .on("mousemove", moveTooltip)
     .on("mouseout", (event) => {
        d3.select(event.currentTarget).style("opacity", 1);
        hideTooltip();
     });

    // Data Labels
    g.selectAll(".val-label").data(rows).join("text")
     .attr("x",d=>x(d.label)+x.bandwidth()/2).attr("y",d=>y(d.value)-5)
     .attr("text-anchor","middle").style("font-size","10px").style("fill","#334155").style("font-weight","bold")
     .text(d=>d.value > 0 ? d.value.toLocaleString() : "");
  }
}

// -------------------------------------------------------------
// อัปเดตข้อมูลและแสดงผล
// -------------------------------------------------------------
function update(){
  current=filtered(); 
  document.querySelector("#total").textContent=current.length.toLocaleString();
  
  const ages=current.map(d=>d.Age).filter(Number.isFinite); 
  document.querySelector("#avgAge").textContent=ages.length?d3.mean(ages).toFixed(1):"-";
  
  const p=counts(current,"จ.ที่เสียชีวิต")[0], v=counts(current,"Vehicle Merge Final")[0]; 
  document.querySelector("#topProvince").textContent=p?.label||"-"; 
  document.querySelector("#topVehicle").textContent=v?.label||"-";

  drawLine(current);
  drawDonut(current);
  drawBars("vehicleChart",counts(current,"Vehicle Merge Final"),false);
  drawBars("weekday",weekdays.map(label=>({label,value:current.filter(d=>d["วันในสัปดาห์"]===label).length})),false);
  drawBars("provinceChart",counts(current,"จ.ที่เสียชีวิต"),true);

  document.querySelector("#summary").innerHTML=`ข้อมูลที่เลือกมี <b>${current.length.toLocaleString()}</b> ราย อายุเฉลี่ย <b>${ages.length?d3.mean(ages).toFixed(1):"-"}</b> ปี จังหวัดที่พบมากที่สุดคือ <b>${p?.label||"-"}</b> และยานพาหนะที่พบมากที่สุดคือ <b>${v?.label||"-"}</b>`;
}

document.querySelector("#reset").onclick=()=>{
  ["month","sex","province","vehicle"].forEach(id=>document.querySelector("#"+id).value="ทั้งหมด");
  update();
};

d3.csv(CSV).then(rows=>{
  data=rows.map(normalize);
  options();
  update();
}).catch(e=>{
  document.querySelector("#summary").textContent="โหลดข้อมูลไม่สำเร็จ: "+e.message;
});
