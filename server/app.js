
let express = require('express')
let axios = require('axios')
let hana = require('@sap/hana-client')
let cookieParser = require('cookie-parser')
let cors = require('cors')
var bodyParser = require("body-parser");
let https = require('https')
const { get } = require('http')
require("dotenv").config();
const conn_params = {
    serverNode: process.env.server_node,
    uid: process.env.uid,
    pwd: process.env.password,
};
const db = process.env.db

const app = express()
const port = 5000;



app.use(cors())
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use(express.json());
app.use(cookieParser());
const conn = hana.createConnection();



async function proxyFunc(req, res) {
    const { path } = req.params
    delete req.headers.host
    delete req.headers['content-length']
    if (!path) {
        return res.status(404).json({
            "error": {
                "message": "Unrecognized resource path."
            }
        })
    }

    return axios({
        url: `https://${process.env.api}:50000` + req.originalUrl,
        method: req.method,
        data: req.body,
        timeout: 90000,
        headers: req.headers,
        httpsAgent: new https.Agent({
            rejectUnauthorized: false,
        }),
    })
        .then(({ data, headers }) => {
            return res.status(200).json({ ...data, ...headers });
        })
        .catch(async (err) => {
            return res.status(err?.response?.status)
                .json(err?.response?.data || err)
        });
}

app.get('/b1s/v1/:path', proxyFunc);
app.post('/b1s/v1/:path', proxyFunc);
app.patch('/b1s/v1/:path', proxyFunc);
app.put('/b1s/v1/:path', proxyFunc);
app.delete('/b1s/v1/:path', proxyFunc);
app.get('/b1s/v1/:path/:path2', proxyFunc);
app.post('/b1s/v1/:path/:path2', proxyFunc);
app.patch('/b1s/v1/:path/:path2', proxyFunc);
app.put('/b1s/v1/:path/:path2', proxyFunc);
app.delete('/b1s/v1/:path/:path2', proxyFunc);


app.get('/api/orders', async function (req, res) {
    try {
        const ret = await getOrders(req.query)
        return res.status(200).send(ret)
    } catch (e) {
        return res.status(400).send({
            message: e
        });
    }
})

app.get('/api/items', async function (req, res) {
    try {
        const ret = await getItems(req.query)
        return res.status(200).send(ret)
    } catch (e) {
        return res.status(400).send({
            message: e
        });
    }
})

function getItems({ offset, limit, whsCode }) {
    return new Promise((resolve, reject) => {
        conn.connect(conn_params, function (err) {
            if (err) {
                reject(err);
                conn.disconnect();
                return;
            }
            let innerSql = `SELECT sum(1) FROM ${db}.OITM  T0 INNER JOIN ${db}.OITW  T1 ON T0."ItemCode" = T1."ItemCode" INNER JOIN ${db}.OWHS  T2 ON T1."WhsCode" = T2."WhsCode" INNER JOIN ${db}.ITM1 T3 ON T0."ItemCode" = T3."ItemCode" WHERE T2."WhsCode" = ${whsCode} and  T3."PriceList"  = 1`

            let sql = `SELECT  (${innerSql}) as length,  T1."IsCommited", T2."WhsCode", T2."WhsName", T1."OnHand", T1."OnOrder", T1."Counted", T0."ItemCode", T0."ItemName", T0."CodeBars", T1."AvgPrice", T3."PriceList", T3."Price" , T3."Currency" FROM ${db}.OITM  T0 INNER JOIN ${db}.OITW  T1 ON T0."ItemCode" = T1."ItemCode" INNER JOIN ${db}.OWHS  T2 ON T1."WhsCode" = T2."WhsCode" INNER JOIN ${db}.ITM1 T3 ON T0."ItemCode" = T3."ItemCode" WHERE T2."WhsCode" = ${whsCode} and  T3."PriceList"  = 1 limit ${limit} offset ${offset - 1}`

            conn.exec(sql, function (err, result) {
                if (err) {
                    reject(err);
                    conn.disconnect();
                    return;
                }

                resolve({
                    value: result
                });

                conn.disconnect();
            });
        });
    });
}

function getOrders({ offset, limit }) {
    return new Promise((resolve, reject) => {
        conn.connect(conn_params, function (err) {
            if (err) {
                reject(err);
                conn.disconnect();
                return;
            }

            let innerSql = `SELECT sum(1) FROM ${db}.ORDR  T0 INNER JOIN ${db}.OSLP T1 ON T0."SlpCode" = T1."SlpCode"  WHERE T0."DocStatus" ='O' and T0."CANCELED"='N'`

            let sql = `SELECT (${innerSql}) as length, T0."DocNum", T0."SlpCode", T1."SlpName", T0."DocDate", T0."DocDueDate", T0."CardCode", T0."CardName", T0."CANCELED", T0."DocStatus", T0."DocCur", T0."DocRate", T0."DocTotal", T0."DocTotalFC" FROM ${db}.ORDR  T0 INNER JOIN ${db}.OSLP T1 ON T0."SlpCode" = T1."SlpCode"  WHERE T0."DocStatus" ='O' and T0."CANCELED"='N' limit ${limit} offset ${offset - 1} `
            conn.exec(sql, function (err, result) {
                if (err) {
                    reject(err);
                    conn.disconnect();
                    return;
                }

                resolve({
                    value: result
                });

                conn.disconnect();
            });
        });
    });
}

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})




//SELECT T1."IsCommited", T2."WhsCode", T2."WhsName", T1."OnHand", T1."IsCommited", T1."OnOrder", T1."Counted", T0."ItemCode", T0."ItemName", T0."CodeBars", T0."OnHand", T1."AvgPrice", T3."PriceList", T3."Price" , T3."Currency" FROM "DUSEL_TEST3"."OITM"  T0 INNER JOIN "DUSEL_TEST3"."OITW"  T1 ON T0."ItemCode" = T1."ItemCode" INNER JOIN "DUSEL_TEST3"."OWHS"  T2 ON T1."WhsCode" = T2."WhsCode" INNER JOIN ITM1 T3 ON T0."ItemCode" = T3."ItemCode" WHERE T0."ItemCode" ='GPX0338' and  T3."PriceList"  = 1
