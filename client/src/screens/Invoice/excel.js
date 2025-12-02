import axios from 'axios';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import moment from 'moment';
const { get } = require("lodash");

const token = '7772567096:AAGQvU8-vE02XxTsGlksahDtR142U-Mf1o4'

const exportTableToExcelWithTotal = async ({ mainData = [] }) => {
    let sumWithoutDisCount = mainData?.length ? mainData.reduce((a, b) => a + (Number(b.Quantity) * Number(get(b, 'PriceBefDi'))), 0) : 0;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Invoice');

    worksheet.addRow([])
    let header = worksheet.addRow([`Накладная: № ${get(mainData, '[0].DocNum', 0)} от ${moment(get(mainData, '[0].DocDate')).format('DD.MM.YYYY')}`])
    worksheet.mergeCells(`A${header.number}:I${header.number}`);
    header.eachCell({ includeEmpty: true }, cell => {
        cell.font = { size: 11, bold: true };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    worksheet.addRow([])

    const headerInfo = [
        { label: `Контрагент: ${get(mainData, '[0].CardName')}`, value: '' },
        { label: `ИНН : ${get(mainData, '[0].LicTradNum', '') || ''}`, value: `ТП: ${get(mainData, '[0].SLP', '') || ''}` },
        { label: `Район: ${get(mainData, '[0].descript', '') || ''}`, value: `Тел. ТП: ${get(mainData, '[0].Mobil', '') || ''}` },
        { label: `Адрес: ${get(mainData, '[0].Address', '') || ''}`, value: `Примечания: ${get(mainData, '[0].COMMENTS') || ''}` },
        { label: `Телефон: ${get(mainData, '[0].Phone1', '') || ''} , ${get(mainData, '[0].Phone2', '') || ''}`, value: '' }
    ];

    headerInfo.forEach(info => {
        const row = worksheet.addRow([info.label, '', '', '', '', '', info.value]);
        worksheet.mergeCells(`A${row.number}:C${row.number}`);
        worksheet.mergeCells(`G${row.number}:H${row.number}`);
        row.eachCell({ includeEmpty: true }, cell => {
            cell.font = { size: 10, bold: true };
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
        });
    });

    worksheet.addRow([]);

    worksheet.columns = [
        { header: '№', key: 'no', width: 5 },
        { header: 'Код', key: 'itemCode', width: 15 },
        { header: 'Продукция', key: 'itemName', width: 45 },
        { header: 'Кол-во (в кейсе)', key: 'quantityCase', width: 10 },
        { header: 'Кол-во (в шт.)', key: 'quantity', width: 8 },
        { header: 'Цена', key: 'priceBefDi', width: 9 },
        { header: 'Скидка/наценка', key: 'discPrcnt', width: 8 },
        { header: 'Цена с наценкой', key: 'price', width: 8 },
        { header: 'Сумма', key: 'lineTotal', width: 10 }
    ];

    let headerRowNumber = worksheet.rowCount + 1;
    worksheet.addRow(['№', 'Код', 'Продукция', 'Кол-во (в кейсе)', 'Кол-во (в шт.)', 'Цена', 'Скидка / наценка', 'Цена с наценкой', 'Сумма']);
    const headerRow = worksheet.getRow(headerRowNumber);
    headerRow.height = 30;
    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (colNumber === 3) { // Assuming 'itemName' is the third column
            cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        } else {
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        }
        cell.font = { size: 9, bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });

    mainData.forEach((item, i) => {
        const row = worksheet.addRow({
            no: i + 1,
            itemCode: get(item, 'U_model'),
            itemName: get(item, 'ItemName'),
            quantityCase: parseFloat((Number(get(item, 'Quantity')) / Number(get(item, 'U_Karobka', 1))).toFixed(4)),
            quantity: Number(get(item, 'Quantity')),
            priceBefDi: Number(get(item, 'PriceBefDi')),

            discPrcnt: `-${Number(get(item, 'DiscPrcnt', 0))}%`,
            price: parseFloat(Number(get(item, 'Price')).toFixed(3)),
            lineTotal: parseFloat(Number(get(item, 'LineTotal')).toFixed(2))
        });
        row.height = 23;
        row.eachCell((cell, colNumber) => {
            if (colNumber === 3) { // Assuming 'itemName' is the third column
                cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
            } else {
                cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            }
            cell.font = { size: 9, };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
    });


    const totalRow = worksheet.addRow({
        no: 'Итого',
        quantityCase: parseFloat((mainData?.length ? mainData.reduce((a, b) => a + (Number(get(b, 'Quantity')) / Number(get(b, 'U_Karobka', 1))), 0) : 0).toFixed(4)),
        quantity: mainData?.length ? mainData.reduce((a, b) => a + Number(b.Quantity), 0) : 0,
        priceBefDi: '',
        discPrcnt: '',
        price: '',
        lineTotal: parseFloat(sumWithoutDisCount.toFixed(2))
    });

    totalRow.getCell(1).alignment = { horizontal: 'center' };

    const revaluationRow = worksheet.addRow({
        quantityCase: 'Сумма переоценки (к заказу)',
        lineTotal: (sumWithoutDisCount - Number(get(mainData, '[0].DocTotal', 0))).toFixed(2)
    });
    worksheet.mergeCells(`D${revaluationRow.number}:H${revaluationRow.number}`);
    revaluationRow.getCell(1).alignment = { horizontal: 'center' };





    const finalTotalRow = worksheet.addRow({
        quantityCase: 'Сумма с учётом переоценки',
        lineTotal: Number(get(mainData, '[0].DocTotal', 0)).toFixed(2)
    });

    worksheet.mergeCells(`D${finalTotalRow.number}:H${finalTotalRow.number}`);
    finalTotalRow.getCell(1).alignment = { horizontal: 'center' };

    worksheet.mergeCells(`A${totalRow.number}:C${totalRow.number + 2}`);

    [totalRow, revaluationRow, finalTotalRow].forEach((row) => {
        row.font = { bold: true };
        row.height = 22;
        row.eachCell((cell) => {
            cell.font = { size: 9, bold: true };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
    });

    worksheet.getRow(1).hidden = true

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${get(mainData, '[0].CardName')}.xlsx`);
};

const exportTableToExcelWithoutTotal = async ({ mainData = [] }) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Invoice');

    worksheet.addRow([])
    let header = worksheet.addRow([`Накладная: № ${get(mainData, '[0].DocNum', 0)} от ${moment(get(mainData, '[0].DocDate')).format('DD.MM.YYYY')}`])
    worksheet.mergeCells(`A${header.number}:I${header.number}`);
    header.eachCell({ includeEmpty: true }, cell => {
        cell.font = { size: 11, bold: true };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    worksheet.addRow([])
    const headerInfo = [
        { label: `Контрагент: ${get(mainData, '[0].CardName')}`, value: '' },
        { label: `ИНН : ${get(mainData, '[0].LicTradNum', '') || ''}`, value: `ТП: ${get(mainData, '[0].SLP', '') || ''}` },
        { label: `Район: ${get(mainData, '[0].descript', '') || ''}`, value: `Тел. ТП: ${get(mainData, '[0].Mobil', '') || ''}` },
        { label: `Адрес: ${get(mainData, '[0].Address', '') || ''}`, value: `Примечания: ${get(mainData, '[0].COMMENTS') || ''}` },
        { label: `Телефон: ${get(mainData, '[0].Phone1', '') || ''} , ${get(mainData, '[0].Phone2', '') || ''}`, value: '' }
    ];


    headerInfo.forEach(info => {
        const row = worksheet.addRow([info.label, '', '', '', '', '', info.value]);
        worksheet.mergeCells(`A${row.number}:C${row.number}`);
        worksheet.mergeCells(`G${row.number}:H${row.number}`);
        row.eachCell({ includeEmpty: true }, cell => {
            cell.font = { size: 10, bold: true };
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
        });
    });

    worksheet.addRow([]);

    worksheet.columns = [

        { header: '№', key: 'no', width: 5 },
        { header: 'Код', key: 'itemCode', width: 15 },
        { header: 'Продукция', key: 'itemName', width: 45 },
        { header: 'Кол-во (в кейсе)', key: 'quantityCase', width: 10 },
        { header: 'Кол-во (в шт.)', key: 'quantity', width: 8 },

        // { header: 'Цена', key: 'priceBefDi', width: 10 },
        // { header: 'Скидка/наценка', key: 'discPrcnt', width: 15 },
        // { header: 'Цена с наценкой', key: 'price', width: 15 },
        // { header: 'Сумма', key: 'lineTotal', width: 15 }
    ];

    let headerRowNumber = worksheet.rowCount + 1;
    worksheet.addRow(['№', 'Код', 'Продукция', 'Кол-во (в кейсе)', 'Кол-во (в шт.)']);
    const headerRow = worksheet.getRow(headerRowNumber);
    headerRow.height = 30;
    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (colNumber === 3) { // Assuming 'itemName' is the third column
            cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        } else {
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        }
        cell.font = { size: 9, bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });

    mainData.forEach((item, i) => {
        const row = worksheet.addRow({
            no: i + 1,
            itemCode: get(item, 'U_model'),
            itemName: get(item, 'ItemName'),
            quantityCase: parseFloat((Number(get(item, 'Quantity')) / Number(get(item, 'U_Karobka', 1))).toFixed(4)),
            quantity: Number(get(item, 'Quantity')),

        });
        row.height = 23;
        row.eachCell((cell, colNumber) => {
            if (colNumber === 3) { // Assuming 'itemName' is the third column
                cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
            } else {
                cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            }
            cell.font = { size: 9, };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
    });

    const totalRow = worksheet.addRow({
        no: 'Итого',
        quantityCase: parseFloat((mainData?.length ? mainData.reduce((a, b) => a + (Number(get(b, 'Quantity')) / Number(get(b, 'U_Karobka', 1))), 0) : 0).toFixed(4)),
        quantity: mainData?.length ? mainData.reduce((a, b) => a + Number(b.Quantity), 0) : 0,

    });



    worksheet.mergeCells(`A${totalRow.number}:C${totalRow.number}`);

    [totalRow].forEach((row) => {
        row.font = { bold: true };
        row.height = 22;
        row.eachCell((cell) => {
            cell.font = { size: 9, bold: true };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
    });

    worksheet.getRow(1).hidden = true

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${get(mainData, '[0].CardName')}`);

};

const sandTableToExcelWithoutTotal = async ({ mainData = [], userType = 'Dusel' }) => {

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Invoice');

    worksheet.addRow([])
    let header = worksheet.addRow([`Накладная: № ${get(mainData, '[0].DocNum', 0)} от ${moment(get(mainData, '[0].DocDate')).format('DD.MM.YYYY')}`])
    worksheet.mergeCells(`A${header.number}:I${header.number}`);
    header.eachCell({ includeEmpty: true }, cell => {
        cell.font = { size: 11, bold: true };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    worksheet.addRow([])
    const headerInfo = [
        { label: `Контрагент: ${get(mainData, '[0].CardName')}`, value: '' },
        { label: `Телефон: ${get(mainData, '[0].Phone1', '') || ''} , ${get(mainData, '[0].Phone2', '') || ''}` },
        { label: `Примечания: ${get(mainData, '[0].COMMENTS') || ''}`, value: '' }
    ];

    headerInfo.forEach(info => {
        const row = worksheet.addRow([info.label, '', '', '', '', '', info.value]);
        worksheet.mergeCells(`A${row.number}:C${row.number}`);
        worksheet.mergeCells(`G${row.number}:H${row.number}`);
        row.eachCell({ includeEmpty: true }, cell => {
            cell.font = { size: 10, bold: true };
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
        });
    });

    worksheet.addRow([]);

    worksheet.columns = [
        { header: '№', key: 'no', width: 5 },
        { header: 'Код', key: 'itemCode', width: 15 },
        { header: 'Продукция', key: 'itemName', width: 45 },
        { header: 'Кол-во (в кейсе)', key: 'quantityCase', width: 10 },
        { header: 'Кол-во (в шт.)', key: 'quantity', width: 8 },
        // { header: 'Цена', key: 'priceBefDi', width: 10 },
        // { header: 'Скидка/наценка', key: 'discPrcnt', width: 15 },
        // { header: 'Цена с наценкой', key: 'price', width: 15 },
        // { header: 'Сумма', key: 'lineTotal', width: 15 }
    ];

    let headerRowNumber = worksheet.rowCount + 1;
    worksheet.addRow(['№', 'Код', 'Продукция', 'Кол-во (в кейсе)', 'Кол-во (в шт.)']);
    const headerRow = worksheet.getRow(headerRowNumber);
    headerRow.height = 30;
    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (colNumber === 3) { // Assuming 'itemName' is the third column
            cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        } else {
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        }
        cell.font = { size: 9, bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });

    mainData.forEach((item, i) => {
        const row = worksheet.addRow({
            no: i + 1,
            itemCode: get(item, 'U_model'),
            itemName: get(item, 'ItemName'),
            quantityCase: parseFloat((Number(get(item, 'Quantity')) / Number(get(item, 'U_Karobka', 1))).toFixed(4)),
            quantity: Number(get(item, 'Quantity')),

        });
        row.height = 23;
        row.eachCell((cell, colNumber) => {
            if (colNumber === 3) { // Assuming 'itemName' is the third column
                cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
            } else {
                cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            }
            cell.font = { size: 9, };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
    });

    const totalRow = worksheet.addRow({
        no: 'Итого',
        quantityCase: parseFloat((mainData?.length ? mainData.reduce((a, b) => a + (Number(get(b, 'Quantity')) / Number(get(b, 'U_Karobka', 1))), 0) : 0).toFixed(4)),
        quantity: mainData?.length ? mainData.reduce((a, b) => a + Number(b.Quantity), 0) : 0,
    });



    worksheet.mergeCells(`A${totalRow.number}:C${totalRow.number}`);

    [totalRow].forEach((row) => {
        row.font = { bold: true };
        row.height = 22;
        row.eachCell((cell) => {
            cell.font = { size: 9, bold: true };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
    });

    worksheet.getRow(1).hidden = true

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const formData = new FormData();
    console.log(userType)
    formData.append("type", userType); // "Tools" yoki "Dusel"
    formData.append(
        "document",
        new File(
            [blob],
            `${get(mainData, "[0].CardName", "")} № ${get(mainData, "[0].DocNum", 0)}.xlsx`,
            { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
        )
    );

    await axios.post("http://localhost:5000/api/send-document", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
}

const exportTableToExcel = ({ mainData = [], total = false }) => {
    if (total) {
        exportTableToExcelWithTotal({ mainData })
        return
    }
    exportTableToExcelWithoutTotal({ mainData })
    return
}


export { exportTableToExcel, sandTableToExcelWithoutTotal }