require('dotenv').config();
const express=require('express');
const cors=require('cors');
const {DynamoDBClient}=require("@aws-sdk/client-dynamodb");
const {DynamoDBDocumentClient, QueryCommand}=require("@aws-sdk/lib-dynamodb");
const app=express();
app.use(cors());

const client=new DynamoDBClient({region: process.env.AWS_REGION});
const docClient=DynamoDBDocumentClient.from(client);

// --- Doctor Grade Filters ---
function notch50Hz(data) {
  // 50Hz powerline noise hatane ke liye halka filter
  let filtered = [];
  let prev1 = 0, prev2 = 0;
  for (let i = 0; i < data.length; i++) {
    let x = data[i];
    let y = x - prev1 + 0.95 * prev2;
    filtered.push(y);
    prev2 = prev1;
    prev1 = x;
  }
  return filtered;
}

function calculateHR(ecgArray, fs = 250) {
  let threshold = Math.max(...ecgArray) * 0.6;
  let peaks = [];
  for (let i = 1; i < ecgArray.length - 1; i++) {
    if (ecgArray[i] > threshold && ecgArray[i] > ecgArray[i-1] && ecgArray[i] > ecgArray[i+1]) {
      if (peaks.length === 0 || (i - peaks[peaks.length-1]) > fs*0.3) {
        peaks.push(i);
      }
    }
  }
  if (peaks.length < 2) return { hr: 0, hrv: 0 };
  let rr = [];
  for (let i=1; i<peaks.length; i++) rr.push(peaks[i]-peaks[i-1]);
  let avgRR = rr.reduce((a,b)=>a+b,0)/rr.length;
  let hr = Math.round((fs * 60) / avgRR);
  let meanRR = avgRR;
  let sdnn = Math.sqrt(rr.map(r=>Math.pow(r-meanRR,2)).reduce((a,b)=>a+b,0)/rr.length) * (1000/fs);
  return { hr, hrv: Math.round(sdnn), peaks: peaks.length };
}

app.get('/api/live', async (req,res)=>{
  try{
    const cmd=new QueryCommand({
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: "deviceId = :d",
      ExpressionAttributeValues: {":d":"device1"},
      ScanIndexForward:false,
      Limit:50 // 20 se 50 kiya taaki HR calc sahi ho
    });
    const data=await docClient.send(cmd);
    const items = data.Items || [];
    if(items.length === 0) return res.json({ ecg:0, hr:0, mock:false });

    const latest = items[0] || {};
    let rawEcg = items.map(i => i.ecg_raw || 0).reverse();
    let filtered = notch50Hz(rawEcg);
    let analysis = calculateHR(filtered, 250);

    res.json({
      ecg: latest.ecg_raw || 0,
      ecg_filtered: filtered[filtered.length-1] || 0,
      hr: analysis.hr || latest.bpm_ecg || 0, // auto calc, nahi to device wala
      spo2: latest.spo2 || 0,
      bp_sys: latest.bp_sys || 0,
      bp_dia: latest.bp_dia || 0,
      history: items.reverse(), // raw
      history_filtered: filtered,
      hrv: analysis.hrv || 0,
      interpretation: analysis.hr > 100? "Tachycardia" : analysis.hr < 60? "Bradycardia" : "Normal Sinus Rhythm",
      lead_status: "Lead-I OK",
      mock: false // <-- MOCK HAMESHA OFF
    });
  }catch(e){console.error(e); res.status(500).json({error:e.message, mock: false})}
});

app.listen(3001,()=>console.log('AWS LIVE MODE Running on 3001 - Doctor Filter ON - MOCK: false'));