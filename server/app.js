let express = require('express')
let axios = require('axios')
let hana = require('@sap/hana-client')
let cookieParser = require('cookie-parser')
let cors = require('cors')
var bodyParser = require("body-parser");
let https = require('https')
let moment = require('moment')
const { get } = require('lodash')
const { writeData, infoData, updateData, deleteData } = require('./helper')
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

app.get('/api/filter', async function (req, res) {
    try {
        const ret = await getFilterItem()
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

app.post('/api/draft', async function (req, res) {
    try {
        let status = await writeData(req.body)
        if (!status) {
            return res.status(404).send()
        }
        return res.status(201).send()
    } catch (e) {
        return res.status(400).send({
            message: e
        });
    }
})

app.get('/api/draft/:id', async function (req, res) {
    try {
        let { id } = req.params
        let data = infoData().find(item => item.ID == id)
        return res.status(200).send({
            value: get(data, 'state', []).map(item => {
                return { ...item, SLP: get(item, 'salesPerson', ''), SLPCODE: get(item, 'salesPersonCode', ''), COMMENTS: get(item, 'comment', ''), PriceBefDi: item.Price, U_Karobka: Number(get(item, 'U_Karobka', '0')) }
            })
        })
    } catch (e) {
        return res.status(400).send({
            message: e
        });
    }
})
app.patch('/api/draft/:id', async function (req, res) {
    try {
        let { id } = req.params
        await updateData(id, req.body)
        return res.status(200).json()
    } catch (e) {
        return res.status(400).send({
            message: e
        });
    }
})
app.delete('/api/draft/:id', async function (req, res) {
    try {
        let { id } = req.params
        await deleteData(id)
        return res.status(200).json()
    } catch (e) {
        return res.status(400).send({
            message: e
        });
    }
})

app.get('/api/sales', async function (req, res) {
    try {
        const ret = await getSalesPerson()
        return res.status(200).send(ret)
    } catch (e) {
        return res.status(400).send({
            message: e
        });
    }
})

function getFilterItem() {
    return new Promise((resolve, reject) => {
        conn.connect(conn_params, function (err) {
            if (err) {
                reject(err);
                conn.disconnect();
                return;
            }

            let sql = `
            SELECT DISTINCT T0."ItmsGrpNam" AS Value, T0."ItmsGrpCod" AS Code ,'ItmsGrpNam' AS Type
            FROM ${db}.OITB T0
            UNION
            SELECT DISTINCT T0."U_Kategoriya" AS Value ,T0."U_Kategoriya" AS Code, 'U_Kategoriya' AS Type
            FROM ${db}.OITM T0
            
            `

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

function getSalesPerson() {
    return new Promise((resolve, reject) => {
        conn.connect(conn_params, function (err) {
            if (err) {
                reject(err);
                conn.disconnect();
                return;
            }

            let sql = `SELECT T0."SlpCode", T0."SlpName" FROM ${db}.OSLP T0`

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

// SELECT DISTINCT T0."ItmsGrpNam" AS Value, 'ItmsGrpNam' AS Type 
// FROM OITB T0

// UNION 

// SELECT DISTINCT T0."U_Kategoriya" AS Value, 'U_Kategoriya' AS Type 
// FROM OITM T0

// T0."ItmsGrpCod", T0."ItmsGrpNam"
function getItems({ offset, limit, whsCode, search, items = [], group = '',
    category = '', code = '' }) {
    return new Promise((resolve, reject) => {
        conn.connect(conn_params, function (err) {
            if (err) {
                reject(err);
                conn.disconnect();
                return;
            }
            let innerSql = `SELECT sum(1) FROM ${db}.OITM  T0 INNER JOIN ${db}.OITW  T1 ON T0."ItemCode" = T1."ItemCode" INNER JOIN ${db}.ITM1 T3 ON T0."ItemCode" = T3."ItemCode"  WHERE T0."DfltWH" = '${whsCode}' and  T3."PriceList"  = 1 and T0."Series" in (73,72) and T1."WhsCode" = '${whsCode}'`
            if (items.length) {
                innerSql += ` and T0."ItemCode" not in (${items})`
            }

            if (code.length) {
                innerSql += ` and T0."ItmsGrpCod" = '${code}'`
            }
            if (category.length) {
                innerSql += ` and T0."U_Kategoriya" = '${category}'`
            }
            if (search?.length) {
                innerSql += ` and (LOWER(T0."ItemCode") like '%${search}%' or LOWER(T0."ItemName") like '%${search}%' or LOWER(T0."U_model") like '%${search}%') `
            }
            let sql = `SELECT  (${innerSql}) as length ,T0."ItmsGrpCod",T0."U_Kategoriya", T0."U_Karobka", T0."BVolume", T0."U_U_netto", T0."U_U_brutto", T0."U_model",  T1."IsCommited", T1."OnHand", T1."OnOrder", T1."Counted", T0."ItemCode", T0."ItemName", T0."CodeBars", T1."AvgPrice", T3."PriceList", T3."Price" , T3."Currency" FROM ${db}.OITM  T0 INNER JOIN ${db}.OITW  T1 ON T0."ItemCode" = T1."ItemCode" INNER JOIN ${db}.ITM1 T3 ON T0."ItemCode" = T3."ItemCode"  WHERE T0."DfltWH" = '${whsCode}' and T3."PriceList"  = 1 and T0."Series" in (73,72) and T1."WhsCode" = '${whsCode}'`
            if (items.length) {
                sql += ` and T0."ItemCode" not in (${items})`
            }
            if (search?.length) {
                sql += `and (LOWER(T0."ItemCode") like '%${search}%' or LOWER(T0."ItemName") like '%${search}%' or LOWER(T0."U_model") like '%${search}%')  `
            }

            if (code.length) {
                sql += ` and T0."ItmsGrpCod" = '${code}'`
            }
            if (category.length) {
                sql += ` and T0."U_Kategoriya" = '${category}'`
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



function getOrders({
    offset, limit, search, creationDateStart, creationDateEnd, docDateStart, docDateEnd, salesPerson, status, warehouseCode
}) {
    return new Promise((resolve, reject) => {
        conn.connect(conn_params, function (err) {
            if (err) {
                reject(err);
                conn.disconnect();
                return;
            }
            let jsonData = infoData()
            const jsonDataSlice = jsonData.map((item, i, arr) => {
                let KUB = 0;
                let BRUTTO = 0;
                let DocTotal = 0;
                for (let i = 0; i < item.state.length; i++) {
                    KUB += Number(item.state[i].BVolume)
                    BRUTTO += Number(item.state[i].U_U_brutto)
                    let price = (Number(item.state[i].Price) * Number(item.state[i].value)) - (Number(item.state[i].Price) * Number(item.state[i].value) * Number(item.state[i].disCount) / 100)
                    DocTotal += price
                }
                let obj = {
                    KUB,
                    BRUTTO,
                    U_status: 2,
                    SlpCode: get(item, 'state[0].salesPersonCode'),
                    SlpName: get(item, 'state[0].salesPerson'),
                    DocDate: item.state[0].DocDate,
                    CreateDate: item.state[0].CreateDate,
                    CardCode: item.state[0].CardCode,
                    CardName: item.state[0].CardName,
                    DocEntry: item.ID,
                    DocCur: item.state[0].Currency,
                    DocTotal,
                    LENGTH: arr.length,
                    draft: true,
                    schema: item.state[0].schema,
                    SLP: item.state[0].salesPerson,
                    SLPCODE: item.state[0].salesPersonCode,
                    COMMENTS: item.state[0].comment,
                    WhsCode: item.state[0].WhsCode
                }
                return obj
            });
            let netto = ` SELECT sum(T6."BVolume") FROM ${db}.RDR1 T5  INNER JOIN ${db}.OITM T6 ON T5."ItemCode" = T6."ItemCode" WHERE T5."DocEntry"= T0."DocEntry"`

            let brutto = ` SELECT sum(T6."U_U_brutto") FROM ${db}.RDR1 T5  INNER JOIN ${db}.OITM T6 ON T5."ItemCode" = T6."ItemCode" WHERE T5."DocEntry"= T0."DocEntry"`

            let warehouse = `SELECT TOP(1) T5."WhsCode" FROM ${db}.RDR1 T5  WHERE T5."DocEntry"= T0."DocEntry"`

            let sql = `SELECT T5."WhsCode" , (${netto}) as kub, (${brutto}) as brutto , T0."U_status", T0."CreateDate",  T0."DocNum", T0."DocEntry"  , T0."SlpCode" , T1."SlpName" , T0."DocDate", T0."DocDueDate", T0."CardCode",T0."DocEntry", T0."CardName", T0."CANCELED", T0."DocStatus", T0."DocCur", T0."DocRate", T0."DocTotal", T0."DocTotalFC" FROM ${db}.ORDR  T0 INNER JOIN ${db}.OSLP T1 ON T0."SlpCode" = T1."SlpCode" LEFT JOIN (SELECT DISTINCT "DocEntry", "WhsCode" FROM ${db}.RDR1) T5 ON T0."DocEntry" = T5."DocEntry"  WHERE T0."DocStatus" ='O' and T0."CANCELED"='N'`

            conn.exec(sql, function (err, results) {
                if (err) {
                    reject(err);
                    conn.disconnect();
                    return;
                }
                let list = [...jsonDataSlice, ...results.sort((a, b) => b.DocEntry - a.DocEntry)]

                let uniqueArrSlp = list.filter((obj, index, self) =>
                    index === self.findIndex((t) => (
                        t.SlpCode === obj.SlpCode && t.SlpName === obj.SlpName
                    ))
                ).map(item => {
                    return { SlpCode: item.SlpCode, SlpName: item.SlpName }
                });

                let uniqueArrManager = list.filter((obj, index, self) =>
                    index === self.findIndex((t) => (
                        t.U_status === obj.U_status
                    ))
                ).map(item => {
                    return { U_status: item.U_status }
                }).sort((a, b) => Number(a.U_status) - Number(b.U_status));

                let filterData = {
                    filter: true,
                    SalesPerson: uniqueArrSlp,
                    Status: uniqueArrManager
                }


                resolve({

                    value: [...filterHelper({ list, search, creationDateStart, creationDateEnd, docDateStart, docDateEnd, salesPerson, status, warehouseCode })
                        .map((item, i, arr) => {
                            let ALLKUB = 0;
                            let ALLBRUTTO = 0;
                            let ALLDOCTOTAL = 0;
                            for (let i = 0; i < arr.length; i++) {
                                ALLKUB += +get(arr, `${[i]}.KUB`, 0)
                                ALLBRUTTO += +get(arr, `${[i]}.BRUTTO`, 0)
                                ALLDOCTOTAL += +get(arr, `${[i]}.DocTotal`, 0)
                            }
                            return { ...item, ALLBRUTTO, ALLKUB, ALLDOCTOTAL }
                        }).map((item, i, self) => {
                            return { ...item, LENGTH: self.length }
                        }).slice(offset - 1, +offset - 1 + +limit),
                        filterData
                    ]
                });

                /* 
                sql dan hamma data olingan , keyin json formatdegi datala olingan va bitta array qilingan 
                 map ni ichida shu bitta qilingan arraylarni brutto va docTotal lar obshi bitta summaga keltirilgan 
                
                 keyin bu filterData dgan object bor 
                 bu joyda asosiy page uchun filter ma'lumotlarni oldinda tortib olinvoti 
                */
                conn.disconnect();
            });
        });
    });
}

let filterHelper = ({
    list,
    search = '',
    creationDateStart,
    creationDateEnd,
    docDateStart,
    docDateEnd,
    salesPerson,
    status,
    warehouseCode
}) => {
    return list.filter(item => {
        // Search by CardName
        if (search && !get(item, 'CardName', '').toLowerCase().includes(search.toLowerCase())) {
            return false;
        }

        // Filter by CreateDate
        const creationDate = new Date(get(item, 'CreateDate'));
        if (creationDateStart && creationDate <= new Date(creationDateStart)) {
            return false;
        }
        if (creationDateEnd && creationDate >= new Date(creationDateEnd)) {
            return false;
        }

        // Filter by DocDate
        const docDate = new Date(get(item, 'DocDate'));
        if (docDateStart && docDate <= new Date(docDateStart)) {
            return false;
        }
        if (docDateEnd && docDate >= new Date(docDateEnd)) {
            return false;
        }

        // Filter by salesPerson
        if (salesPerson) {
            const salesPersonArray = salesPerson.split(',').map(s => parseInt(s.trim(), 10));
            if (!salesPersonArray.includes(get(item, 'SlpCode'))) {
                return false;
            }
        }

        // Filter by status
        if (status) {
            const statusArray = status.split(',').map(s => s.trim());
            if (!statusArray.includes(get(item, 'U_status', '').toString())) {
                return false;
            }
        }

        // Filter by warehouseCode
        if (warehouseCode && get(item, 'WhsCode') !== warehouseCode) {
            return false;
        }

        // If all conditions pass, include this item
        return true;
    });
};

function getOrderByDocEntry({ docEntry }) {
    return new Promise((resolve, reject) => {
        conn.connect(conn_params, function (err) {
            if (err) {
                reject(err);
                conn.disconnect();
                return;
            }

            let sql = `SELECT T0."Comments" as COMMENTS, T2."BVolume", T2."U_Karobka", T2."U_U_netto", T2."U_U_brutto", T2."U_model",  T3."IsCommited" ,T3."OnHand", T3."OnOrder", T3."Counted", T1."DocEntry", T1."LineNum", T1."ItemCode" , T2."ItemName" ,T1."Quantity", T1."Price", T1."PriceBefDi", T1."Currency", T1."WhsCode", T0."DocNum", T0."DocStatus", T0."DocDate", T0."DocDueDate", T0."CardCode", T0."CardName", T0."DocCur", T0."DocTotal", T0."SlpCode" as SLPCODE,T4."SlpName" as SLP, T1."U_model", T1."U_krb" FROM ${db}.ORDR T0  INNER JOIN ${db}.RDR1 T1 ON T0."DocEntry" = T1."DocEntry" INNER JOIN ${db}.OITM T2 on T2."ItemCode" = T1."ItemCode" INNER JOIN ${db}.OITW T3 on T3."ItemCode" = T1."ItemCode" INNER JOIN ${db}.OSLP T4 ON T0."SlpCode" = T4."SlpCode"  where T0."DocEntry"=${docEntry} and T3."WhsCode" = T1."WhsCode"`

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


