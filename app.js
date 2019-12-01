const express = require('express');
const app = express();
const ADODB = require('node-adodb');
const sha = require('sha1');
const config = require('.\\config.json');
const axios = require('axios');
const moment = require('moment');
const connectionString = "Provider=Microsoft.Jet.OLEDB.4.0;Data Source=<dbPath>;Persist Security Info=False;Jet OLEDB:Database Password=sport2.0".replace('<dbPath>', config.dbPath);
const connection = ADODB.open(connectionString);


app.get('/healthScore', async (req, res) => {
    // 获取对应的参数值
    const { signature, ak, cardnum, nounce } = req.query;
    let sk;
    try {
        sk = config.passport[ak].sk;
    } catch (e) {
        console.log(e);
        res.status(404).send('非目标请求，拒绝此次请求');
        return
    }
    // 计算签名是否匹配
    if (signature !== sha(`ak=${ak}&cardnum=${cardnum}&nounce=${nounce}&sk=${sk}`)) {
        // console.log(sha(`ak=${ak}&cardnum=${cardnum}&nounce=${nounce}&sk=${sk}`));
        res.status(404).send('签名不匹配，拒绝此次请求');
        return
    }
    let data;
    try {
        data = await connection.query(`SELECT * FROM healthscore WHERE studentNo="${cardnum}"`);
    } catch (e) {
        console.log(e);
        res.status(404).send('查询错误');
        return;
    }
    const result = {
        stature: data[0]['stature'],                                          // 身高
        avoirdupois: data[0]['avoirdupois'],                                  // 体重
        vitalCapacity: data[0]['vitalCapacity'],                              // 肺活量
        vitalCapacityScore: data[0]['vitalCapacityScore'],                    // 肺活量分数 
        vitalCapacityConclusion: data[0]['vitalCapacityConclusion'],          // 肺活量评价
        fiftyMeter: data[0]['fiftyMeter'],                                    // 50米 s
        fiftyMeterScore: data[0]['fiftyMeterScore'],                          // 50米分数
        fiftyMeterConclusion: data[0]['fiftyMeterConclusion'],                // 50米评价
        standingLongJump: data[0]['standingLongJump'],                        // 立定跳远
        standingLongJumpScore: data[0]['standingLongJumpScore'],              // 立定跳远分数
        standingLongJumpConclusion: data[0]['standingLongJumpConclusion'],    // 立定跳远评价
        BMI: data[0]['BMI'],                                                  // BMI
        BMIScore: data[0]['BMIScore'],                                        // BMI分数
        BMIConclusion: data[0]['BMIConclusion'],                              // BMI评价
        kiloMeter: data[0]['kiloMeter'],                                      // 800/1000米
        kiloMeterScore: data[0]['kiloMeterScore'],                            // 800/1000米分数
        kiloMeterConclusion: data[0]['kiloMeterConclusion'],                  // 800/1000米评价
        bend: data[0]['bend'],                                                // 坐体前屈
        bendScore: data[0]['bendScore'],                                      // 坐体前屈分数
        bendConclusion: data[0]['bendConclusion'],                            // 坐体前屈评价
        lie: data[0]['lie'],                                                  // 仰卧起坐/引体向上
        lieScore: data[0]['lieScore'],                                        // 仰卧起坐/引体向上分数
        lieConclusion: data[0]['lieConclusion'],                              // 仰卧起坐/引体向上评价
        score: data[0]['score'],                                              // 总分

    }

    res.send(result);
});

app.get('/morningExercises', async (req, res) => {
    // 获取对应的参数值
    const { signature, ak, cardnum, nounce } = req.query;
    let sk;
    try {
        sk = config.passport[ak].sk;
    } catch (e) {
        console.log(e);
        res.status(404).send('非目标请求，拒绝此次请求');
        return
    }
    // 计算签名是否匹配
    if (signature !== sha(`ak=${ak}&cardnum=${cardnum}&nounce=${nounce}&sk=${sk}`)) {
        console.log(sha(`ak=${ak}&cardnum=${cardnum}&nounce=${nounce}&sk=${sk}`));
        res.status(404).send('签名不匹配，拒绝此次请求');
        return
    }

    // 获取本地数据库的数据
    let resFromDB = []
    try{    
        let data = await connection.query(`SELECT date FROM [CHECK] WHERE studentNo="${cardnum}"`);
        data.forEach(time => {
            resFromDB.push(time['date'].slice(0,10));
        });
    }catch(e){
        console.log(e);
        res.status(404).send('查询错误');
        return;
    }
    
    console.log(resFromDB);
    
    // 获取另外的跑操记录
    let resFromOther
    try {
        const signatureForReq = sha(`ak=${config['otherService']['ak']}&cardnum=${cardnum}&nounce=tyx&sk=${config['otherService']['sk']}`);
        resFromOther = await axios.get(config['otherService']['Url'], {
            params: {
                signature: signatureForReq,
                cardnum,                
                nounce: 'tyx',
                ak: config['otherService']['ak']
            }
        })
        resFromOther = resFromOther.data;
        resFromOther.records = resFromOther.records.map(time => moment(time).format('YYYY-MM-DD'));
        
    }catch(e){
        console.log(e);
        res.status(404).send('请求跑操数据出错');
        return;
    }
    console.log(resFromOther);

    let trueRecords = {}
    resFromOther.records.forEach(time => {
        if (!trueRecords[time]) {
            trueRecords[time] = true
        }
    })
    resFromDB.forEach(time =>{
        if (!trueRecords[time]) {
            trueRecords[time] = true
        }
    })

    res.send({
        cardnum,
        records:Object.keys(trueRecords)
    });
    
});



app.listen(3000, () => console.log('Example app listening on port 3000!'))