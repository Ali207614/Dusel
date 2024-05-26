const fs = require("fs");
const { get } = require("lodash");
const path = require("path");

function deleteData(id) {
    let users = infoData();
    users = users.filter((item) => item.id != id);
    fs.writeFileSync(
        path.join(process.cwd(), "data.json"),
        JSON.stringify(users, null, 4)
    );
}

function updateData(id, data) {
    let users = infoData();
    let index = users.findIndex((item) => item.id == id);
    users[index] = data
    fs.writeFileSync(
        path.join(process.cwd(), "data.json"),
        JSON.stringify(users, null, 4)
    );
}
function writeData(data) {
    try {
        let main = infoData();
        let { ID } = infoID()
        data = { state: data, ID }
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

module.exports = {
    infoData,
    writeData,
    deleteData,
    updateData
}