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

    let cookie;
    if (!req.headers?.info) {
        cookie = req.headers
    }
    else {
        cookie = { ...JSON.parse(req.headers?.info), ...req.headers }
    }
    return axios({
        url: `https://${process.env.api}:50000` + req.originalUrl,
        method: req.method,
        data: req.body,
        timeout: 90000,
        headers: cookie,
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

app.get('/api/customer', async function (req, res) {
    try {
        const ret = await getCustomer(req.query)
        return res.status(200).send(ret)
    } catch (e) {
        return res.status(400).send({
            message: e
        });
    }
})

app.get('/api/order', async function (req, res) {
    try {
        const ret = await getOrderByDocEntry(req.query)
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





function getCustomer({ search }) {
    return new Promise((resolve, reject) => {
        conn.connect(conn_params, function (err) {
            if (err) {
                reject(err);
                conn.disconnect();
                return;
            }

            let sql = `SELECT T0."CardCode", T0."CardName", T0."CardType" FROM ${db}.OCRD T0 WHERE T0."CardType" ='C'`
            if (search?.length) {
                sql += `and (LOWER(T0."CardCode") like '%${search}%' or LOWER(T0."CardName") like '%${search}%')`
            }

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



function getItems({ offset, limit, whsCode, search, items = [] }) {
    return new Promise((resolve, reject) => {
        conn.connect(conn_params, function (err) {
            if (err) {
                reject(err);
                conn.disconnect();
                return;
            }
            let innerSql = `SELECT sum(1) FROM ${db}.OITM  T0 INNER JOIN ${db}.OITW  T1 ON T0."ItemCode" = T1."ItemCode" INNER JOIN ${db}.OWHS  T2 ON T1."WhsCode" = T2."WhsCode" INNER JOIN ${db}.ITM1 T3 ON T0."ItemCode" = T3."ItemCode" WHERE T2."WhsCode" = '${whsCode}' and  T3."PriceList"  = 1 and T0."Series" in (73,72)`
            if (items.length) {
                innerSql += ` and T0."ItemCode" not in (${items})`
            }
            if (search?.length) {
                innerSql += ` and (LOWER(T0."ItemCode") like '%${search}%' or LOWER(T0."ItemName") like '%${search}%' or LOWER(T0."U_model") like '%${search}%') `
            }
            let sql = `SELECT  (${innerSql}) as length,T0."U_Karobka",  T0."U_U_netto", T0."U_U_brutto", T0."U_model",  T1."IsCommited", T2."WhsCode", T2."WhsName", T1."OnHand", T1."OnOrder", T1."Counted", T0."ItemCode", T0."ItemName", T0."CodeBars", T1."AvgPrice", T3."PriceList", T3."Price" , T3."Currency" FROM ${db}.OITM  T0 INNER JOIN ${db}.OITW  T1 ON T0."ItemCode" = T1."ItemCode" INNER JOIN ${db}.OWHS  T2 ON T1."WhsCode" = T2."WhsCode" INNER JOIN ${db}.ITM1 T3 ON T0."ItemCode" = T3."ItemCode" WHERE T2."WhsCode" = '${whsCode}' and T3."PriceList"  = 1 and T0."Series" in (73,72)`
            if (items.length) {
                sql += ` and T0."ItemCode" not in (${items})`
            }
            if (search?.length) {
                sql += `and (LOWER(T0."ItemCode") like '%${search}%' or LOWER(T0."ItemName") like '%${search}%' or LOWER(T0."U_model") like '%${search}%')  `
            }
            sql += ` ORDER BY T0."U_prn"  limit ${limit} offset ${offset - 1} `


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

function getOrders({ offset, limit, search }) {
    return new Promise((resolve, reject) => {
        conn.connect(conn_params, function (err) {
            if (err) {
                reject(err);
                conn.disconnect();
                return;
            }

            let innerSql = `SELECT sum(1) FROM ${db}.ORDR  T0 INNER JOIN ${db}.OSLP T1 ON T0."SlpCode" = T1."SlpCode"  WHERE T0."DocStatus" ='O' and T0."CANCELED"='N'`

            let allDocTotal = `SELECT sum(T0."DocTotal") FROM ${db}.ORDR  T0 INNER JOIN ${db}.OSLP T1 ON T0."SlpCode" = T1."SlpCode"  WHERE T0."DocStatus" ='O' and T0."CANCELED"='N'`
            if (search?.length) {
                innerSql += ` and (LOWER(T0."CardName") like '%${search}%')`
            }
            let allNetto = `SELECT sum(T6."U_U_netto") FROM ${db}.ORDR  T0 INNER JOIN ${db}.OSLP T1 ON T0."SlpCode" = T1."SlpCode" inner join ${db}.RDR1 T5 on T5."DocEntry"= T0."DocEntry" INNER JOIN ${db}.OITM T6 ON T5."ItemCode" = T6."ItemCode"  WHERE T0."DocStatus" ='O' and T0."CANCELED"='N'`

            let allBrutto = `SELECT sum(T6."U_U_brutto") FROM ${db}.ORDR  T0 INNER JOIN ${db}.OSLP T1 ON T0."SlpCode" = T1."SlpCode" inner join ${db}.RDR1 T5 on T5."DocEntry"= T0."DocEntry" INNER JOIN ${db}.OITM T6 ON T5."ItemCode" = T6."ItemCode"  WHERE T0."DocStatus" ='O' and T0."CANCELED"='N'`

            let netto = ` SELECT sum(T6."U_U_netto") FROM ${db}.RDR1 T5  INNER JOIN ${db}.OITM T6 ON T5."ItemCode" = T6."ItemCode" WHERE T5."DocEntry"= T0."DocEntry"`

            let brutto = ` SELECT sum(T6."U_U_brutto") FROM ${db}.RDR1 T5  INNER JOIN ${db}.OITM T6 ON T5."ItemCode" = T6."ItemCode" WHERE T5."DocEntry"= T0."DocEntry"`

            let sql = `SELECT (${innerSql}) as length , (${allNetto}) as allNetto,(${allBrutto}) as allbrutto, (${netto}) as netto, (${brutto}) as brutto , (${allDocTotal}) as allDocTotal, T0."U_status", T0."CreateDate",  T0."DocNum", T0."DocEntry"  , T0."SlpCode", T1."SlpName", T0."DocDate", T0."DocDueDate", T0."CardCode",T0."DocEntry", T0."CardName", T0."CANCELED", T0."DocStatus", T0."DocCur", T0."DocRate", T0."DocTotal", T0."DocTotalFC" FROM ${db}.ORDR  T0 INNER JOIN ${db}.OSLP T1 ON T0."SlpCode" = T1."SlpCode"  WHERE T0."DocStatus" ='O' and T0."CANCELED"='N'`


            if (search?.length) {
                sql += ` and (LOWER(T0."CardName") like '%${search}%')`
            }

            sql += ` order by T0."DocEntry" desc limit ${limit} offset ${offset - 1} `


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
// SELECT T0."Currency", T0."DiscPrcnt", T0."LineTotal", T0."OpenSum", T0."OpenSumFC", T0."PriceBefDi" FROM RDR1 T0 WHERE T0."DocEntry" = '5685'

function getOrderByDocEntry({ docEntry }) {
    return new Promise((resolve, reject) => {
        conn.connect(conn_params, function (err) {
            if (err) {
                reject(err);
                conn.disconnect();
                return;
            }

            let sql = `SELECT T2."U_Karobka", T2."U_U_netto", T2."U_U_brutto", T2."U_model",  T3."IsCommited" ,T3."OnHand", T3."OnOrder", T3."Counted", T1."DocEntry", T1."LineNum", T1."ItemCode" , T2."ItemName" ,T1."Quantity", T1."Price", T1."Currency", T1."WhsCode", T0."DocNum", T0."DocStatus", T0."DocDate", T0."DocDueDate", T0."CardCode", T0."CardName", T0."DocCur", T0."DocTotal", T0."SlpCode", T1."U_model", T1."U_krb" FROM ${db}.ORDR T0  INNER JOIN ${db}.RDR1 T1 ON T0."DocEntry" = T1."DocEntry" INNER JOIN ${db}.OITM T2 on T2."ItemCode" = T1."ItemCode" INNER JOIN ${db}.OITW T3 on T3."ItemCode" = T1."ItemCode"  where T0."DocEntry"=${docEntry} and T3."WhsCode" = T1."WhsCode"`

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
