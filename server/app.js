let express = require('express')
let axios = require('axios')
let cookieParser = require('cookie-parser')
let cors = require('cors')
var bodyParser = require("body-parser");
let https = require('https')
const { withConn, execAsync } = require('./hana-pool');
const { get } = require('lodash')
const compression = require('compression');
const { writeData, infoData, updateData, deleteData, infoReturn, writeReturn, updateReturn, deleteReturn } = require('./helper')
require("dotenv").config();

const db = process.env.db
// let series = '72,73'
let series = '76,77,91'
let seriesTools = '91'
let toolsGroupCode = '111'
const app = express();



const port = 5000;


app.use(compression({
    level: 6,          // 1..9 (6: yaxshi balans)
    threshold: 1024,   // 1KB dan kattasini siq
    filter: (req, res) => {
        const type = String(res.getHeader('Content-Type') || '');
        if (type.includes('text/event-stream')) return false; // SSE siqilmasin
        return compression.filter(req, res);
    }
}));

app.set('json spaces', 0);

app.use(cors())
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use(express.json());
app.use(cookieParser());



async function proxyFunc(req, res) {
    const { path } = req.params;
    delete req.headers.host;
    delete req.headers['content-length'];

    if (!path) {
        return res.status(404).json({
            error: { message: "Unrecognized resource path." }
        });
    }

    let cookie = req.headers.info
        ? { ...JSON.parse(req.headers.info), ...req.headers }
        : req.headers;

    let userTypeData = {};
    if (req.originalUrl.includes('/Login') && req.body?.UserName) {
        try {
            const userTypeResult = await getUserType(req.body.UserName);
            userTypeData = { userType: userTypeResult[0]?.U_type1 || null };
        } catch (err) {
            console.error('UserType olishda xato:', err);
        }
    }

    try {
        const response = await axios({
            url: `https://${process.env.api}:50000${req.originalUrl}`,
            method: req.method,
            data: req.body,
            timeout: 90000,
            headers: cookie,
            httpsAgent: new https.Agent({
                rejectUnauthorized: false,
            }),
        });

        return res.status(200).json({
            ...response.data,
            ...response.headers,
            ...userTypeData
        });
    } catch (err) {
        return res.status(err?.response?.status || 500).json(err?.response?.data || { error: err.message });
    }
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
        console.log(e, "  bu e")
        return res.status(400).send({
            message: e
        });
    }
})

app.get('/api/returns', async function (req, res) {
    try {
        const ret = await getReturns(req.query)
        return res.status(200).send({ value: ret })
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
app.get('/api/checkCustomerBalance', async function (req, res) {
    try {
        const ret = await checkCustomerBalance(req.query)
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


app.get('/api/items-check', async function (req, res) {
    try {
        const ret = await getItemsCheck(req.query)
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

app.get('/api/items-return', async function (req, res) {
    try {
        const ret = await getItemsReturn(req.query)
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


app.get('/api/draft/return/:id', async function (req, res) {
    try {
        let { id } = req.params
        let data = infoReturn().find(item => item.ID == id)
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
app.post('/api/draft/return', async function (req, res) {
    try {
        let status = await writeReturn(req.body)
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
app.patch('/api/draft/return/:id', async function (req, res) {
    try {
        let { id } = req.params
        await updateReturn(id, req.body)
        return res.status(200).json()
    } catch (e) {
        return res.status(400).send({
            message: e
        });
    }
})
app.delete('/api/draft/return/:id', async function (req, res) {
    try {
        let { id } = req.params
        await deleteReturn(id)
        return res.status(200).json()
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

async function getFilterItem() {
    let sql = `
    SELECT DISTINCT T0."ItmsGrpNam" AS Value, T0."ItmsGrpCod" AS Code ,'ItmsGrpNam' AS Type
    FROM ${db}.OITB T0
    UNION
    SELECT T0."Descr" AS Value , T0."FldValue" AS Code ,'U_Kategoriya' AS Type  from ${db}.UFD1  T0 WHERE T0."TableID" ='OITM' and T0."FieldID" = 1 
    `

    return withConn(async (conn) => {
        const rows = await execAsync(conn, sql, []);
        return { value: rows };
    });
}

// 2) Foydalanuvchi turi (parametrizatsiya bilan)
async function getUserType(userCode) {
    const sql = `
      SELECT "U_type"
      FROM ${db}."OUSR"
      WHERE "USER_CODE" = ?
    `;
    return withConn(async (conn) => {
        const rows = await execAsync(conn, sql, [userCode]);
        return rows
    });
}

async function getCustomer({ search, type, limit = 30, offset = 1 }) {
    const size = Math.max(1, Number(limit) || 30);
    const start = Math.max(0, (Number(offset) || 1) - 1);
    const end = start + size;

    // WHERE builder
    const where = ['T0."CardType" = ?'];   // faqat mijozlar
    const params = ['C'];

    if (search && String(search).trim().length) {
        const like = `%${String(search).trim().toLowerCase()}%`;
        where.push(`
            (
                LOWER(T0."CardCode") LIKE ? 
                OR LOWER(T0."CardName") LIKE ? 
                OR LOWER(T0."Phone1") LIKE ? 
                OR LOWER(T0."Phone2") LIKE ?
            )
        `);
        params.push(like, like, like, like);
    }
    if (type === 'Tools') {
        where.push('T0."GroupCode" = ?');
        params.push(toolsGroupCode);
    }
    else {
        where.push('T0."GroupCode" != ?');
        params.push(toolsGroupCode);
    }
    where.push(`T0."frozenFor" = ?`)
    params.push('N');

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const sql = `
      WITH filtered AS (
        SELECT 
          T0."GroupCode",
          T0."U_discount",
          T0."CreditLine",
          T0."Balance",
          T1."descript",
          T0."Address",
          T0."ZipCode",
          T0."Phone1",
          T0."Phone2",
          T0."LicTradNum",
          T0."CardCode",
          T0."CardName",
          T0."CardType",
          T2."GroupName"
        FROM ${db}.OCRD T0
        LEFT JOIN ${db}.OTER T1 ON T0."Territory" = T1."territryID"
        LEFT JOIN ${db}.OCRG T2 ON T2."GroupCode" = T0."GroupCode"
        ${whereSql}
      ),
      ranked AS (
        SELECT
          f.*,
          ROW_NUMBER() OVER (ORDER BY f."CardName", f."CardCode") AS rn,
          COUNT(*)     OVER () AS "LENGTH"
        FROM filtered f
      )
      SELECT
      "GroupCode" ,"U_discount","CreditLine","Balance","descript","Address","ZipCode","Phone1","Phone2",
        "LicTradNum","CardCode","CardName","CardType","GroupName","LENGTH"
      FROM ranked
      WHERE rn > ? AND rn <= ?;
    `;

    // rn kesish paramlari oxirida
    const rnParams = [start, end];

    return withConn(async (conn) => {
        const rows = await execAsync(conn, sql, [...params, ...rnParams]);
        return { value: rows }; // FE: get(data,'value[0].LENGTH',0)
    });
}



// function getCustomer({ search, type }) {
//     return new Promise((resolve, reject) => {
//         conn.connect(conn_params, function (err) {
//             if (err) {
//                 reject(err);
//                 conn.disconnect();
//                 return;
//             }

//             let sql = `SELECT T0."U_discount", T0."CreditLine",T0."Balance", T1."descript", T0."Address", T0."ZipCode", T0."Phone1", T0."Phone2", T0."LicTradNum", T0."CardCode", T0."CardName", T0."CardType" FROM ${db}.OCRD T0 LEFT JOIN ${db}.OTER T1 ON T0."Territory" = T1."territryID" WHERE T0."CardType" ='C'`
//             if (search?.length) {
//                 sql += `and (LOWER(T0."CardCode") like '%${search}%' or LOWER(T0."CardName") like '%${search}%')`
//             }

//             if (type === 'Tools') {
//                 sql += `and T0."GroupCode" = ${toolsGroupCode}`
//             }

//             conn.exec(sql, function (err, result) {
//                 if (err) {
//                     reject(err);
//                     conn.disconnect();
//                     return;
//                 }

//                 resolve({
//                     value: result
//                 });

//                 conn.disconnect();
//             });
//         });
//     });
// }

async function checkCustomerBalance({ customerCode = '', summa = 0 }) {
    const sql = `
      SELECT
        CASE
          WHEN ( ? + COALESCE(T0."OrdersBal",0) + COALESCE(T0."Balance",0) ) > COALESCE(T0."CreditLine",0)
          THEN 1 ELSE 0
        END AS "OVER_LIMIT"
      FROM ${db}.OCRD T0
      WHERE T0."CardCode" = ?
        AND T0."CardType" = 'C'
        AND COALESCE(T0."CreditLine",0) > 0
    `;
    const params = [Number(summa) || 0, customerCode];

    return withConn(async (conn) => {
        const rows = await execAsync(conn, sql, params);
        // Hech narsa topilmasa — default false
        const over = rows?.[0]?.OVER_LIMIT === 1;
        return { value: over };        // { value: true/false }
    });
}

/*  Agar “eski” formatni xohlasangiz (DISTINCT TRUE / bo‘sh massiv):
async function checkCustomerBalance_legacy({ customerCode = '', summa = 0 }) {
  const sql = `
    SELECT DISTINCT TRUE AS "OVER_LIMIT"
    FROM ${db}.OCRD T0
    WHERE ( ? + COALESCE(T0."OrdersBal",0) + COALESCE(T0."Balance",0) ) > COALESCE(T0."CreditLine",0)
      AND T0."CardCode" = ?
      AND T0."CardType" = 'C'
      AND COALESCE(T0."CreditLine",0) > 0
  `;
  const params = [Number(summa) || 0, customerCode];
 
  return withConn(async (conn) => {
    const rows = await execAsync(conn, sql, params);
    return { value: rows };        // topilsa [ { OVER_LIMIT: true } ], aks holda []
  });
}
*/
function inPlaceholders(arr) {
    if (!arr || !arr.length) return '';
    return arr.map(() => '?').join(', ');
}

// 2) Sotyuvchilar ro‘yxati
async function getSalesPerson() {
    const sql = `
      SELECT T0."SlpCode", T0."SlpName"
      FROM ${db}.OSLP T0
      ORDER BY T0."SlpName"
    `;
    return withConn(async (conn) => {
        const rows = await execAsync(conn, sql);
        return { value: rows };
    });
}

async function getItems({
    offset, limit, type,
    whsCode = '', search,
    items = [], group = '',
    category = '', code = '',
}) {
    try {
        const size = Math.max(1, Number(limit) || 30);
        const start = Math.max(0, (Number(offset) || 1) - 1);
        const end = start + size;

        const seriesArr = toArrayMaybe(type === 'Tools' ? seriesTools : series);

        const itemsArr = toArrayMaybe(items);
        const hasSeries = seriesArr.length > 0;
        const isTools = type === 'Tools';

        // WHERE shartlar
        const where = [
            `T0."DfltWH" = ?`,
            `T3."PriceList" = 1`,
            `T1."WhsCode" = ?`,
        ];
        const params = [whsCode, whsCode];

        // (Series IN (...) [OR ItemCode LIKE 'GPO%'] )
        if (isTools) {
            if (hasSeries) {
                where.push(`(T0."Series" IN (${inPlaceholders(seriesArr)}) OR T0."ItemCode" LIKE 'GPO%')`);
                params.push(...seriesArr);
            } else {
                where.push(`T0."ItemCode" LIKE 'GPO%'`);
            }
        } else if (hasSeries) {
            where.push(`T0."Series" IN (${inPlaceholders(seriesArr)})`);
            params.push(...seriesArr);
        }

        // NOT IN items
        if (itemsArr.length) {
            where.push(`T0."ItemCode" NOT IN (${inPlaceholders(itemsArr)})`);
            params.push(...itemsArr);
        }

        if (code && String(code).length) {
            where.push(`T0."ItmsGrpCod" = ?`);
            params.push(code);
        }
        if (category && String(category).length) {
            where.push(`T0."U_Kategoriya" = ?`);
            params.push(category);
        }

        if (search && String(search).trim().length) {
            const like = `%${String(search).trim().toLowerCase()}%`;
            where.push(`(LOWER(T0."ItemCode") LIKE ? OR LOWER(T0."ItemName") LIKE ? OR LOWER(T0."U_model") LIKE ?)`);
            params.push(like, like, like);
        }

        const whereSql = `WHERE ${where.join(' AND ')}`;

        // CTE + ROW_NUMBER + COUNT(*) OVER() — LENGTH har qatorda
        const sql = `
      WITH filtered AS (
        SELECT
          T5."U_item_count", T5."U_quant_add", T5."U_end_date", T5."U_start_date",
          T0."U_prn",
          T4."Discount",
          T0."ItmsGrpCod",
          T0."U_Kategoriya",
          T0."U_Karobka",
          T0."BVolume",
          T0."U_U_netto",
          T0."U_U_brutto",
          T0."U_model",
          T0."U_smr",
          T1."IsCommited",
          T1."OnHand",
          T1."OnOrder",
          T1."Counted",
          T0."ItemCode",
          T0."ItemName",
          T0."CodeBars",
          T1."AvgPrice",
          T3."PriceList",
          T3."Price",
          T3."Currency",
          CASE
            WHEN T0."U_prn" IS NULL OR T0."U_prn" = 0 THEN 9999
            ELSE T0."U_prn"
          END AS __ord_prn
        FROM ${db}.OITM T0
        INNER JOIN ${db}.OITW T1 ON T0."ItemCode" = T1."ItemCode"
        INNER JOIN ${db}.ITM1 T3 ON T0."ItemCode" = T3."ItemCode"
        LEFT  JOIN ${db}.EDG1 T4 ON T0."ItemCode" = T4."ObjKey" AND T4."ObjType" = '4'
        LEFT  JOIN ${db}."@ITEMDISCOUNT" T5 ON T5."U_item" = T0."ItemCode"
        ${whereSql}
      ),
      ranked AS (
        SELECT
          f.*,
          ROW_NUMBER() OVER (ORDER BY f.__ord_prn, f."ItemCode") AS rn,
          COUNT(*) OVER () AS "LENGTH"
        FROM filtered f
      )
      SELECT
        "U_item_count","U_quant_add","U_end_date","U_start_date",
        "U_prn","Discount","ItmsGrpCod","U_Kategoriya","U_Karobka","BVolume",
        "U_U_netto","U_U_brutto","U_model","U_smr",
        "IsCommited","OnHand","OnOrder","Counted",
        "ItemCode","ItemName","CodeBars","AvgPrice","PriceList","Price","Currency",
        "LENGTH"
      FROM ranked
      WHERE rn > ? AND rn <= ?;
    `;

        const rnParams = [start, end];

        return withConn(async (conn) => {
            const rows = await execAsync(conn, sql, [...params, ...rnParams]);
            return { value: rows };
        });
    }
    catch (e) {
        console.log(e, ' bu e')
    }
}


async function getItemsCheck({ items = [], whsCode = '' }) {
    // Bo'sh ro'yxat bo'lsa, DBga bormaymiz
    if (!Array.isArray(items) || items.length === 0) {
        return { value: [] };
    }

    const where = [
        `T0."DfltWH" = ?`,
        `T3."PriceList" = 1`,
        `T1."WhsCode" = ?`,
        `T0."ItemCode" IN (${inPlaceholders(items)})`,
    ];
    const params = [whsCode, whsCode, ...items];

    const sql = `
      SELECT
        T4."Discount",
        T0."ItmsGrpCod",
        T0."U_Kategoriya",
        T0."U_Karobka",
        T0."BVolume",
        T0."U_U_netto",
        T0."U_U_brutto",
        T0."U_model",
        T0."U_smr",
        T1."IsCommited",
        T1."OnHand",
        T1."OnOrder",
        T1."Counted",
        T0."ItemCode",
        T0."ItemName",
        T0."CodeBars",
        T1."AvgPrice",
        T3."PriceList",
        T3."Price",
        T3."Currency"
      FROM ${db}.OITM T0
      INNER JOIN ${db}.OITW T1 ON T0."ItemCode" = T1."ItemCode"
      INNER JOIN ${db}.ITM1 T3 ON T0."ItemCode" = T3."ItemCode"
      LEFT  JOIN ${db}.EDG1 T4 ON T0."ItemCode" = T4."ObjKey" AND T4."ObjType" = '4'
      WHERE ${where.join(' AND ')}
    `;

    return withConn(async (conn) => {
        const rows = await execAsync(conn, sql, params);
        return { value: rows };
    });
}


function toArrayMaybe(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        return value.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
}

async function getItemsReturn({
    offset,
    limit,
    type,
    search,
    items = [],
    group = '',
    category = '',
    code = '',
}) {
    try {
        // page/limitni tayyorlab oling
        const size = Math.max(1, Number(limit) || 30);
        const start = Math.max(0, (Number(offset) || 1) - 1);
        const end = start + size;

        // IN ro'yxatlarni tayyorlash
        const seriesArr = toArrayMaybe(type === 'Tools' ? seriesTools : series);     // bo'sh bo'lsa, 
        const itemsArr = Array.isArray(items) ? items : toArrayMaybe(items);

        // WHERE bo‘lib boradigan shartlar va params
        const where = [];
        const params = [];

        // Asosiy shartlar
        where.push(`T3."PriceList" = 1`);
        where.push(`T1."WhsCode" = T0."DfltWH"`);

        // Series / Tools OR sharti
        if (type === 'Tools') {
            // (Series IN (...) OR ItemCode LIKE 'GPO%')
            if (seriesArr.length) {
                where.push(`(T0."Series" IN (${inPlaceholders(seriesArr)}) OR T0."ItemCode" LIKE 'GPO%')`);
                params.push(...seriesArr);
            } else {
                // Series yo'q bo'lsa faqat GPO%
                where.push(`T0."ItemCode" LIKE 'GPO%'`);
            }
        } else {
            // Oddiy holat: faqat Series IN (...)
            if (seriesArr.length) {
                where.push(`T0."Series" IN (${inPlaceholders(seriesArr)})`);
                params.push(...seriesArr);
            }
        }

        // NOT IN items
        if (itemsArr.length) {
            where.push(`T0."ItemCode" NOT IN (${inPlaceholders(itemsArr)})`);
            params.push(...itemsArr);
        }

        // code / category
        if (code && String(code).length) {
            where.push(`T0."ItmsGrpCod" = ?`);
            params.push(code);
        }
        if (category && String(category).length) {
            where.push(`T0."U_Kategoriya" = ?`);
            params.push(category);
        }

        // qidiruv
        if (search && String(search).trim().length) {
            const like = `%${String(search).trim().toLowerCase()}%`;
            where.push(`(LOWER(T0."ItemCode") LIKE ? OR LOWER(T0."ItemName") LIKE ? OR LOWER(T0."U_model") LIKE ?)`);
            params.push(like, like, like);
        }

        const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

        // CTE + RN + COUNT OVER
        const sql = `
       WITH filtered AS (
         SELECT
           T0."DfltWH",
           T4."Discount",
           T0."ItmsGrpCod",
           T0."U_Kategoriya",
           T0."U_Karobka",
           T0."BVolume",
           T0."U_U_netto",
           T0."U_U_brutto",
           T0."U_model",
           T0."U_smr",
           T1."IsCommited",
           T1."OnHand",
           T1."OnOrder",
           T1."Counted",
           T0."ItemCode",
           T0."ItemName",
           T0."CodeBars",
           T1."AvgPrice",
           T3."PriceList",
           T3."Price",
           T3."Currency",
           CASE WHEN T0."U_prn" IS NULL OR T0."U_prn" = 0 THEN 9999 ELSE T0."U_prn" END AS __ord_prn
         FROM ${db}.OITM T0
         INNER JOIN ${db}.OITW T1 ON T0."ItemCode" = T1."ItemCode" AND T1."WhsCode" = T0."DfltWH"
         INNER JOIN ${db}.ITM1 T3 ON T0."ItemCode" = T3."ItemCode"
         LEFT  JOIN ${db}.EDG1 T4 ON T0."ItemCode" = T4."ObjKey" AND T4."ObjType" = '4'
         ${whereSql}
       ),
       ranked AS (
         SELECT
           f.*,
           ROW_NUMBER() OVER (
             ORDER BY f.__ord_prn, f."ItemCode"
           ) AS rn,
           COUNT(*) OVER () AS "LENGTH"
         FROM filtered f
       )
       SELECT
         "DfltWH","Discount","ItmsGrpCod","U_Kategoriya","U_Karobka","BVolume",
         "U_U_netto","U_U_brutto","U_model","U_smr","IsCommited","OnHand","OnOrder","Counted",
         "ItemCode","ItemName","CodeBars","AvgPrice","PriceList","Price","Currency","LENGTH"
       FROM ranked
       WHERE rn > ? AND rn <= ?;
     `;

        // RN kesish paramlari
        const rnParams = [start, end];

        return withConn(async (conn) => {
            const rows = await execAsync(conn, sql, [...params, ...rnParams]);
            return { value: rows }; // FE: get(data,'value[0].LENGTH',0)
        });
    }
    catch (e) {
        console.log(e)
    }
}



async function getOrders({
    offset, limit, search, creationDateStart, creationDateEnd,
    docDateStart, docDateEnd, salesPerson, status, warehouseCode, type
}) {
    const size = Math.max(1, Number(limit) || 30);
    const start = Math.max(0, (Number(offset) || 1) - 1);
    const end = start + size;

    return withConn(async (conn) => {
        // 1) JSON manbadan tayyorlash
        const rawJson = infoData();
        const jsonData = (type === 'Tools')
            ? rawJson.filter(item => item?.state?.[0]?.type === 'Tools')
            : rawJson;

        const jsonRows = jsonData
            .sort((a, b) => b.ID - a.ID)
            .map(item => {
                let KUB = 0, BRUTTO = 0, DocTotal = 0;
                for (const s of item.state) {
                    KUB += Number(s.BVolume) * Number(s.value);
                    BRUTTO += Number(s.U_U_brutto) * Number(s.value);
                    const full = Number(s.Price) * Number(s.value);
                    const price = full - (full * Number(s.Discount) / 100);
                    DocTotal += price;
                }
                return {
                    KUB, BRUTTO, DocTotal,
                    U_status: 2,
                    SlpCode: get(item, 'state[0].salesPersonCode'),
                    SlpName: get(item, 'state[0].salesPerson'),
                    DocDate: get(item, 'state[0].DocDate'),
                    CreateDate: get(item, 'state[0].CreateDate'),
                    CardCode: get(item, 'state[0].CardCode'),
                    CardName: get(item, 'state[0].CardName'),
                    DocEntry: item.ID,
                    DocCur: get(item, 'state[0].Currency'),
                    draft: true,
                    schema: get(item, 'state[0].schema'),
                    SLP: get(item, 'state[0].salesPerson'),
                    SLPCODE: get(item, 'state[0].salesPersonCode'),
                    COMMENTS: get(item, 'state[0].comment'),
                    WhsCode: get(item, 'state[0].WhsCode'),
                    U_logsum: get(item, 'state[0].U_logsum'),
                };
            });

        const netto = `SELECT SUM(T6."BVolume"    * T5."Quantity")
                      FROM ${db}.RDR1 T5
                      INNER JOIN ${db}.OITM T6 ON T5."ItemCode" = T6."ItemCode"
                      WHERE T5."DocEntry" = T0."DocEntry"`;
        const brutto = `SELECT SUM(T6."U_U_brutto" * T5."Quantity")
                      FROM ${db}.RDR1 T5
                      INNER JOIN ${db}.OITM T6 ON T5."ItemCode" = T6."ItemCode"
                      WHERE T5."DocEntry" = T0."DocEntry"`;

        let sql = `
        SELECT
          T0."U_whs", T0."U_logsum", T5."WhsCode",
          (${netto})  AS kub,
          (${brutto}) AS brutto,
          T0."U_status", T0."CreateDate", T0."DocNum", T0."DocEntry",
          T0."SlpCode", T1."SlpName", T0."DocDate", T0."DocDueDate",
          T0."CardCode", T0."CardName", T0."CANCELED", T0."DocStatus",
          T0."DocCur", T0."DocRate", T0."DocTotal", T0."DocTotalFC"
        FROM ${db}.ORDR T0
        INNER JOIN ${db}.OSLP T1 ON T0."SlpCode" = T1."SlpCode"
        INNER JOIN ${db}.OCRD T6 ON T6."CardCode" = T0."CardCode"
        LEFT JOIN (SELECT DISTINCT "DocEntry","WhsCode" FROM ${db}.RDR1) T5
          ON T0."DocEntry" = T5."DocEntry"
        WHERE T0."DocStatus" = 'O' AND T0."CANCELED" = 'N'
      `;

        const params = [];
        if (type === 'Tools') {
            sql += ` AND T6."GroupCode" = ?`;
            params.push(toolsGroupCode);
        }
        else {
            sql += ` AND T6."GroupCode" != ?`;
            params.push(toolsGroupCode);
        }

        const hanaRows = await execAsync(conn, sql, params);

        const hanaClean = hanaRows
            .sort((a, b) => b.DocEntry - a.DocEntry)
            .filter(r => !r?.U_whs) // sizdagi shart
            .map(r => ({
                KUB: Number(r.kub) || 0,
                BRUTTO: Number(r.brutto) || 0,
                DocTotal: Number(r.DocTotal) || 0,
                U_status: r.U_status,
                SlpCode: r.SlpCode,
                SlpName: r.SlpName,
                DocDate: r.DocDate,
                CreateDate: r.CreateDate,
                CardCode: r.CardCode,
                CardName: r.CardName,
                DocEntry: r.DocEntry,
                DocCur: r.DocCur,
                draft: false,
                U_logsum: r.U_logsum,
                WhsCode: r.WhsCode,
            }));

        // 3) Birlashtirish, filter, summa, LENGTH, paginatsiya
        const list = [...jsonRows, ...hanaClean];

        const filtered = filterHelper({
            list, search, creationDateStart, creationDateEnd,
            docDateStart, docDateEnd, salesPerson, status, warehouseCode
        });

        const totals = filtered.reduce((acc, it) => {
            acc.ALLKUB += Number(it.KUB) || 0;
            acc.ALLBRUTTO += Number(it.BRUTTO) || 0;
            acc.ALLDOCTOTAL += Number(it.DocTotal) || 0;
            return acc;
        }, { ALLKUB: 0, ALLBRUTTO: 0, ALLDOCTOTAL: 0 });

        const LENGTH = filtered.length;

        const pageRows = filtered
            .slice(start, end)
            .map(it => ({ ...it, ...totals, LENGTH }));

        // Filter UI ma’lumotlari
        const SalesPerson = [...new Map(
            list.map(x => [`${x.SlpCode}|${x.SlpName}`, { SlpCode: x.SlpCode, SlpName: x.SlpName }])
        ).values()];

        const Status = [...new Map(
            list.map(x => [String(x.U_status), { U_status: x.U_status }])
        ).values()].sort((a, b) => Number(a.U_status) - Number(b.U_status));

        const filterData = { filter: true, SalesPerson, Status };

        return { value: [...pageRows, filterData] };
    });
}

function getReturns({
    offset, limit, search, creationDateStart, creationDateEnd, docDateStart, docDateEnd, salesPerson, status, warehouseCode, type
}) {
    let jsonData = []

    if (type === 'Tools') {
        jsonData = infoReturn().filter(item => item?.state[0]?.type === 'Tools')
    }
    else {
        jsonData = infoReturn()
    }
    const jsonDataSlice = jsonData.sort((a, b) => b.ID - a.ID).map((item, i, arr) => {
        let KUB = 0;
        let BRUTTO = 0;
        let DocTotal = 0;
        for (let i = 0; i < item.state.length; i++) {
            KUB += (Number(item.state[i].BVolume) * Number(item.state[i].value))
            BRUTTO += (Number(item.state[i].U_U_brutto) * Number(item.state[i].value))
            let price = (Number(item.state[i].Price) * Number(item.state[i].value)) - (Number(item.state[i].Price) * Number(item.state[i].value) * Number(item.state[i].Discount) / 100)
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

    let list = jsonDataSlice

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

    return [...filterHelper({ list, search, creationDateStart, creationDateEnd, docDateStart, docDateEnd, salesPerson, status, warehouseCode })
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
        if (search && !get(item, 'CardName', '').toLowerCase().includes(search.toLowerCase())) {
            return false;
        }

        const creationDate = new Date(get(item, 'CreateDate'));
        if (creationDateStart && creationDate <= new Date(creationDateStart)) {
            return false;
        }
        if (creationDateEnd && creationDate >= new Date(creationDateEnd)) {
            return false;
        }

        const docDate = new Date(get(item, 'DocDate'));
        if (docDateStart && docDate <= new Date(docDateStart)) {
            return false;
        }
        if (docDateEnd && docDate >= new Date(docDateEnd)) {
            return false;
        }

        if (salesPerson) {
            const salesPersonArray = salesPerson.split(',').map(s => parseInt(s.trim(), 10));
            if (!salesPersonArray.includes(get(item, 'SlpCode'))) {
                return false;
            }
        }

        if (status) {
            const statusArray = status.split(',').map(s => s.trim());
            if (!statusArray.includes(get(item, 'U_status', '').toString())) {
                return false;
            }
        }

        if (warehouseCode && get(item, 'WhsCode') !== warehouseCode) {
            return false;
        }

        return true;
    });
};

async function getOrderByDocEntry({ docEntry }) {
    const sql = `
      SELECT 
        T1."DiscPrcnt",
        T8."U_item_count", T8."U_quant_add", T8."U_end_date", T8."U_start_date",
        T2."U_prn",
        T7."descript",
        T4."Mobil",
        T6."U_discount", T6."Address", T6."ZipCode", T6."Phone1", T6."Phone2", T6."LicTradNum",
        T5."Discount",
        T1."LineTotal",
        T0."Comments" as COMMENTS,
        T2."BVolume", T2."U_Karobka", T2."U_U_netto", T2."U_U_brutto", T2."U_model",
        T3."IsCommited", T3."OnHand", T3."OnOrder", T3."Counted",
        T1."DocEntry", T1."LineNum", T1."ItemCode", T2."ItemName", 
        T1."Quantity", T1."Price", T1."PriceBefDi", T1."Currency", T1."WhsCode",
        T0."DocNum", T0."DocStatus", T0."DocDate", T0."DocDueDate",
        T0."CardCode", T0."CardName", T0."DocCur", T0."DocTotal",
        T0."SlpCode" as SLPCODE, T4."SlpName" as SLP,
        T1."U_model", T1."U_krb"
      FROM ${db}.ORDR T0
      INNER JOIN ${db}.RDR1 T1 ON T0."DocEntry" = T1."DocEntry"
      INNER JOIN ${db}.OITM T2 ON T2."ItemCode" = T1."ItemCode"
      INNER JOIN ${db}.OITW T3 ON T3."ItemCode" = T1."ItemCode" AND T3."WhsCode" = T1."WhsCode"
      INNER JOIN ${db}.OSLP T4 ON T0."SlpCode" = T4."SlpCode"
      LEFT JOIN ${db}.EDG1 T5 ON T2."ItemCode" = T5."ObjKey" AND T5."ObjType" = '4'
      INNER JOIN ${db}.OCRD T6 ON T6."CardCode" = T0."CardCode"
      LEFT JOIN ${db}.OTER T7 ON T6."Territory" = T7."territryID"
      LEFT JOIN ${db}."@ITEMDISCOUNT" T8 ON T8."U_item" = T2."ItemCode"
      WHERE T0."DocEntry" = ?
    `;

    return withConn(async (conn) => {
        const rows = await execAsync(conn, sql, [docEntry]);
        return { value: rows };
    });
}

app.listen(port, () => {
    console.log(`Example app listening on port ${port} `)
})




//SELECT T1."IsCommited", T2."WhsCode", T2."WhsName", T1."OnHand", T1."IsCommited", T1."OnOrder", T1."Counted", T0."ItemCode", T0."ItemName", T0."CodeBars", T0."OnHand", T1."AvgPrice", T3."PriceList", T3."Price" , T3."Currency" FROM "DUSEL_TEST3"."OITM"  T0 INNER JOIN "DUSEL_TEST3"."OITW"  T1 ON T0."ItemCode" = T1."ItemCode" INNER JOIN "DUSEL_TEST3"."OWHS"  T2 ON T1."WhsCode" = T2."WhsCode" INNER JOIN ITM1 T3 ON T0."ItemCode" = T3."ItemCode" WHERE T0."ItemCode" ='GPX0338' and  T3."PriceList"  = 1


