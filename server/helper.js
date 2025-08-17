const fs = require("fs");
const { get } = require("lodash");
const path = require("path");

function deleteData(id) {
    let users = infoData();
    users = users.filter((item) => item.ID != id);
    fs.writeFileSync(
        path.join(process.cwd(), "data.json"),
        JSON.stringify(users, null, 4)
    );
}
function updateData(id, data) {
    let users = infoData();
    let index = users.findIndex((item) => item.ID == id);
    users[index] = { state: data, ID: id }
    fs.writeFileSync(
        path.join(process.cwd(), "data.json"),
        JSON.stringify(users, null, 4)
    );
}
function writeData(data) {
    try {
        let main = infoData();
        let { ID } = infoID()
        data = {
            state: data.map(item => {
                return { ...item, CreateDate: new Date() }
            }), ID
        }
        fs.writeFileSync(
            path.join(process.cwd(), "data.json"),
            JSON.stringify([...main, data], null, 4)
        );
        updateID(+ID + 1)
        return true
    }
    catch (e) {
        return false
    }

}

function updateID(id) {
    fs.writeFileSync(
        path.join(process.cwd(), "id.json"),
        JSON.stringify(
            { ID: id }
            , null, 4)
    );
}
function infoID() {
    let docs = fs.readFileSync(
        path.join(process.cwd(), "id.json"),
        "UTF-8"
    );
    docs = docs ? JSON.parse(docs) : { ID: 0 };
    return docs;
}

function infoData() {
    let docs = fs.readFileSync(
        path.join(process.cwd(), "data.json"),
        "UTF-8"
    );
    docs = docs ? JSON.parse(docs) : [];
    return docs;
}

function infoReturn() {
    let docs = fs.readFileSync(
        path.join(process.cwd(), "return.json"),
        "UTF-8"
    );
    docs = docs ? JSON.parse(docs) : [];
    return docs;
}

function deleteReturn(id) {
    let users = infoReturn();
    users = users.filter((item) => item.ID != id);
    fs.writeFileSync(
        path.join(process.cwd(), "return.json"),
        JSON.stringify(users, null, 4)
    );
}
function updateReturn(id, data) {
    let users = infoReturn();
    let index = users.findIndex((item) => item.ID == id);
    users[index] = { state: data, ID: id }
    fs.writeFileSync(
        path.join(process.cwd(), "return.json"),
        JSON.stringify(users, null, 4)
    );
}
function writeReturn(data) {
    try {
        let main = infoReturn();
        let { ID } = infoID()
        data = {
            state: data.map(item => {
                return { ...item, CreateDate: new Date() }
            }), ID
        }
        fs.writeFileSync(
            path.join(process.cwd(), "return.json"),
            JSON.stringify([...main, data], null, 4)
        );
        updateID(+ID + 1)
        return true
    }
    catch (e) {
        return false
    }

}

module.exports = {
    infoData,
    writeData,
    deleteData,
    updateData,
    infoReturn,
    deleteReturn,
    updateReturn,
    writeReturn
}