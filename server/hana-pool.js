// hana-pool.js
const hana = require('@sap/hana-client');
require('dotenv').config();

// Implicit poolingni ON qilamiz shu yerning o'zida.
// Eslatma: SAP HANA client implicit poolingda connection.disconnect()
// -> "return to pool" ma'nosida ishlaydi.
const conn_params = {
    serverNode: process.env.server_node,
    uid: process.env.uid,
    pwd: process.env.password,
    Pooling: true,             // <--- Muhim
    // ixtiyoriy: maxPoolSize'ni shu yerda berishingiz mumkin
    // maxPoolSize: 10,
};

// prepare/exec ni promisify
function execAsync(conn, sql, params = []) {
    return new Promise((resolve, reject) => {
        conn.prepare(sql, (perr, stmt) => {
            if (perr) return reject(perr);
            stmt.exec(params, (e, rows) => {
                try { stmt.drop(() => { }); } catch { }
                return e ? reject(e) : resolve(rows);
            });
        });
    });
}

// Har chaqiriqda connection ochamiz, implicit pooling uni qayta ishlatadi.
function withConn(fn) {
    const conn = hana.createConnection();
    return new Promise((resolve, reject) => {
        conn.connect(conn_params, (err) => {
            if (err) return reject(err);
            Promise.resolve(fn(conn))
                .then((res) => {
                    try { conn.disconnect(); } catch { }
                    resolve(res);
                })
                .catch((e) => {
                    try { conn.disconnect(); } catch { }
                    reject(e);
                });
        });
    });
}

module.exports = { withConn, execAsync };
