const CSV="https://raw.githubusercontent.com/Santhorn/DVT_Interactive_Data_Visualization_FINAL/main/data/cleaned/_2568_cleaned.csv";
const months=["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
const weekdays=["จันทร์","อังคาร","พุธ","พฤหัสบดี","ศุกร์","เสาร์","อาทิตย์"];
let data=[], current=[];
const thaiMonth=d3.timeFormat("%m"); 
function normalize(d){
 d["Age"]=+d["Age"]; d["Dead Date"]=new Date(d["Dead Date"]);
 d["เดือนที่เสียชีวิต"]=months[d["Dead Date"].getMonth()];
 d["วันในสัปดาห์"]=weekdays[(d["Dead Date"].getDay()+6)%7]; return d;
}
function fillSelect(id, values){
 const s=d3.select("#"+id); s.selectAll("option").remove(); s.append("option").attr("value","ทั้งหมด").text("ทั้งหมด");
 values.forEach(v=>s.append("option").attr("value",v).text(v)); s.on("change",update);
}
function options(){
 fillSelect("month",months);
 fillSelect("sex",[...new Set(data.map(d=>d.Sex))].sort((a,b)=>a.localeCompare(b,"th")));
 fillSelect("province",[...new Set(data.map(d=>d["จ.ที่เสียชีวิต"]))].sort((a,b)=>a.localeCompare(b,"th")));
 fillSelect("vehicle",[...new Set(data.map(d=>d["Vehicle Merge Final"]))].sort((a,b)=>a.localeCompare(b,"th")));
}
function filtered(){
 const m=document.querySelector("#month").value,s=document.querySelector("#sex").value,p=document.querySelector("#province").value,v=document.querySelector("#vehicle").value;
 return data.filter(d=>(m==="ทั้งหมด"||d["เดือนที่เสียชีวิต"]===m)&&(s==="ทั้งหมด"||d.Sex===s)&&(p==="ทั้งหมด"||d["จ.ที่เสียชีวิต"]===p)&&(v==="ทั้งหมด"||d["Vehicle Merge Final"]===v));
}
function counts(arr,key){return d3.rollups(arr,v=>v.length,d=>d[key]).map(([label,value])=>({label,value})).sort((a,b)=>d3.descending(a.value,b.value))}
function clear(id){d3.select("#"+id).selectAll("*").remove()}
function svgBox(id){const el=document.querySelector("#"+id),w=el.clientWidth,h=el.clientHeight;return {el,w,h,svg:d3.select(el).append("svg").attr("width",w).attr("height",h)}}
function drawLine(arr){
 clear("line"); const {w,h,svg}=svgBox("line"),m={t:20,r:25,b:50,l:50},iw=w-m.l-m.r,ih=h-m.t-m.b;
 const c=Object.fromEntries(months.map(x=>[x,0])); arr.forEach(d=>c[d["เดือนที่เสียชีวิต"]]++);
 const x=d3.scalePoint(months).range([0,iw]), y=d3.scaleLinear().domain([0,d3.max(months,x=>c[x])||1]).nice().range([ih,0]);
 const g=svg.append("g").attr("transform",`translate(${m.l},${m.t})`);
 g.append("g").attr("transform",`translate(0,${ih})`).call(d3.axisBottom(x).tickSizeOuter(0)).selectAll("text").attr("transform","rotate(-35)").style("text-anchor","end");
 g.append("g").call(d3.axisLeft(y).ticks(5));
 const line=d3.line().x(d=>x(d.label)).y(d=>y(d.value));
 const pts=months.map(label=>({label,value:c[label]})); g.append("path").datum(pts).attr("fill","none").attr("stroke","currentColor").attr("stroke-width",2.5).attr("d",line);
 g.selectAll("circle").data(pts).join("circle").attr("cx",d=>x(d.label)).attr("cy",d=>y(d.value)).attr("r",4).append("title").text(d=>`${d.label}: ${d.value} ราย`);
}
function drawBars(id,rows,horizontal=false){
 clear(id); const {w,h,svg}=svgBox(id),m={t:15,r:20,b:horizontal?30:65,l:horizontal?130:50},iw=w-m.l-m.r,ih=h-m.t-m.b;
 rows=rows.slice(0,horizontal?10:12); const x=horizontal?d3.scaleLinear().domain([0,d3.max(rows,d=>d.value)||1]).nice().range([0,iw]):d3.scaleBand().domain(rows.map(d=>d.label)).range([0,iw]).padding(.2);
 const y=horizontal?d3.scaleBand().domain(rows.map(d=>d.label)).range([0,ih]).padding(.2):d3.scaleLinear().domain([0,d3.max(rows,d=>d.value)||1]).nice().range([ih,0]);
 const g=svg.append("g").attr("transform",`translate(${m.l},${m.t})`);
 if(horizontal){g.append("g").call(d3.axisLeft(y));g.append("g").attr("transform",`translate(0,${ih})`).call(d3.axisBottom(x).ticks(5));g.selectAll(".bar").data(rows).join("rect").attr("class","bar").attr("x",0).attr("y",d=>y(d.label)).attr("width",d=>x(d.value)).attr("height",y.bandwidth()).append("title").text(d=>`${d.label}: ${d.value} ราย`)}
 else{g.append("g").attr("transform",`translate(0,${ih})`).call(d3.axisBottom(x)).selectAll("text").attr("transform","rotate(-35)").style("text-anchor","end");g.append("g").call(d3.axisLeft(y).ticks(5));g.selectAll(".bar").data(rows).join("rect").attr("x",d=>x(d.label)).attr("y",d=>y(d.value)).attr("width",x.bandwidth()).attr("height",d=>ih-y(d.value)).append("title").text(d=>`${d.label}: ${d.value} ราย`)}
}
function drawDonut(arr){
 clear("donut"); const {w,h,svg}=svgBox("donut"),r=Math.min(w,h)/2-30, g=svg.append("g").attr("transform",`translate(${w/2},${h/2})`);
 const rows=counts(arr,"Sex"), pie=d3.pie().value(d=>d.value)(rows), arc=d3.arc().innerRadius(r*.52).outerRadius(r);
 g.selectAll("path").data(pie).join("path").attr("d",arc).append("title").text(d=>`${d.data.label}: ${d.data.value} ราย`);
 g.append("text").attr("text-anchor","middle").attr("dy",".3em").attr("font-size","24px").text(arr.length.toLocaleString());
}
function update(){
 current=filtered(); document.querySelector("#total").textContent=current.length.toLocaleString();
 const ages=current.map(d=>d.Age).filter(Number.isFinite); document.querySelector("#avgAge").textContent=ages.length?d3.mean(ages).toFixed(1):"-";
 const p=counts(current,"จ.ที่เสียชีวิต")[0],v=counts(current,"Vehicle Merge Final")[0]; document.querySelector("#topProvince").textContent=p?.label||"-"; document.querySelector("#topVehicle").textContent=v?.label||"-";
 drawLine(current);drawDonut(current);drawBars("vehicleChart",counts(current,"Vehicle Merge Final"),false);
 drawBars("weekday",weekdays.map(label=>({label,value:current.filter(d=>d["วันในสัปดาห์"]===label).length})),false);
 drawBars("provinceChart",counts(current,"จ.ที่เสียชีวิต"),true);
 document.querySelector("#summary").innerHTML=`ข้อมูลที่เลือกมี <b>${current.length.toLocaleString()}</b> ราย อายุเฉลี่ย <b>${ages.length?d3.mean(ages).toFixed(1):"-"}</b> ปี จังหวัดที่พบมากที่สุดคือ <b>${p?.label||"-"}</b> และยานพาหนะที่พบมากที่สุดคือ <b>${v?.label||"-"}</b>`;
}
document.querySelector("#reset").onclick=()=>{["month","sex","province","vehicle"].forEach(id=>document.querySelector("#"+id).value="ทั้งหมด");update()};
d3.csv(CSV).then(rows=>{data=rows.map(normalize);options();update()}).catch(e=>{document.querySelector("#summary").textContent="โหลดข้อมูลไม่สำเร็จ: "+e.message});
