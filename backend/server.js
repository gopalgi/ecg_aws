require('dotenv').config();
const express=require('express');
const cors=require('cors');
const {DynamoDBClient}=require("@aws-sdk/client-dynamodb");
const {DynamoDBDocumentClient, QueryCommand}=require("@aws-sdk/lib-dynamodb");
const app=express();
app.use(cors());

const client=new DynamoDBClient({region: process.env.AWS_REGION});
const docClient=DynamoDBDocumentClient.from(client);

app.get('/api/live', async (req,res)=>{
  try{
    const cmd=new QueryCommand({
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: "deviceId = :d",
      ExpressionAttributeValues: {":d":"device1"},
      ScanIndexForward:false, // latest pehle
      Limit:20
    });
    const data=await docClient.send(cmd);
    const latest=data.Items[0] || {};
    res.json({
      ecg: latest.ecg_raw || 0,
      hr: latest.bpm_ecg || 0,
      spo2: latest.spo2 || 0,
      bp_sys: latest.bp_sys || 0,
      bp_dia: latest.bp_dia || 0,
      history: data.Items.reverse(),
      mock: process.env.MOCK_MODE === 'true' // <-- ye add kiya
    });
  }catch(e){console.error(e); res.status(500).json({error:e.message, mock: true})}
});

app.listen(3001,()=>console.log('AWS LIVE MODE Running on 3001 - MOCK:', process.env.MOCK_MODE));