
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
        url: "https://212.83.157.137:50000" + req.originalUrl,
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


app.get('/api/users', async function (req, res) {
    try {
        const ret = await getUser()
        return res.status(200).send(ret)
    } catch (e) {
        return res.status(400).send({
            message: e
        });
    }
})

function getUser() {
    return new Promise((resolve, reject) => {
        conn.connect(conn_params, function (err) {
            console.log('err ' + err)
            if (err) {
                reject(err);
                conn.disconnect();
                return;
            }

            let sql = `select * from ${db}.OUSR `

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





