import axios from 'axios';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import moment from 'moment';
const { get } = require("lodash");




const exportTableToExcelWithTotal = async ({ mainData = [] }) => {
    let sumWithoutDisCount = mainData?.length ? mainData.reduce((a, b) => a + (Number(b.Quantity) * Number(get(b, 'PriceBefDi'))), 0) : 0;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Invoice');

    worksheet.addRow([])
    worksheet.addRow([])
    let header = worksheet.addRow([`Накладная: № от ${moment(get(mainData, '[0].DocDate')).format('DD.MM.YYYY')}`])
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
        { label: `Адрес: ${get(mainData, '[0].Address', '') || ''}`, value: '' },
        { label: 'Ориентир:', value: '' },
        { label: `Телефон: ${get(mainData, '[0].Phone1', '') || ''} , ${get(mainData, '[0].Phone2', '') || ''}`, value: '' }
    ];

    headerInfo.forEach(info => {
        const row = worksheet.addRow([info.label, '', '', '', '', '', info.value]);
        worksheet.mergeCells(`A${row.number}:C${row.number}`);
        worksheet.mergeCells(`G${row.number}:H${row.number}`);
        row.eachCell({ includeEmpty: true }, cell => {
            cell.font = { size: 10 };
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
        });
    });

    worksheet.addRow([]);

    worksheet.columns = [
        { header: '№', key: 'no', width: 5 },
        { header: 'Код', key: 'itemCode', width: 15 },
        { header: 'Продукция', key: 'itemName', width: 55 },
        { header: 'Кол-во (в кейсе)', key: 'quantityCase', width: 15 },
        { header: 'Кол-во (в шт.)', key: 'quantity', width: 15 },
        { header: 'Цена', key: 'priceBefDi', width: 10 },
        { header: 'Скидка/наценка', key: 'discPrcnt', width: 15 },
        { header: 'Цена с наценкой', key: 'price', width: 15 },
        { header: 'Сумма', key: 'lineTotal', width: 15 }
    ];

    let headerRowNumber = worksheet.rowCount + 1;
    worksheet.addRow(['№', 'Код', 'Продукция', 'Кол-во (в кейсе)', 'Кол-во (в шт.)', 'Цена', 'Скидка / наценка', 'Цена с наценкой', 'Сумма']);
    const headerRow = worksheet.getRow(headerRowNumber);
    headerRow.height = 24;
    headerRow.eachCell({ includeEmpty: true }, cell => {
        cell.font = { size: 9, bold: true };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
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
            quantityCase: (Number(get(item, 'Quantity')) / Number(get(item, 'U_Karobka', 1))).toFixed(1),
            quantity: Number(get(item, 'Quantity')),
            priceBefDi: Number(get(item, 'PriceBefDi')),
            discPrcnt: `-${Number(get(item, 'Discount', 0))}%`,
            price: Number(get(item, 'Price')).toFixed(3),
            lineTotal: Number(get(item, 'LineTotal')).toFixed(2)
        });
        row.height = 24;
        row.eachCell((cell) => {
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
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
        quantityCase: '',
        quantity: mainData?.length ? mainData.reduce((a, b) => a + Number(b.Quantity), 0) : 0,
        priceBefDi: '',
        discPrcnt: '',
        price: '',
        lineTotal: sumWithoutDisCount.toFixed(2)
    });

    totalRow.getCell(1).alignment = { horizontal: 'center' };

    const revaluationRow = worksheet.addRow({
        quantityCase: 'Сумма переоценки (к заказу)',
        lineTotal: (sumWithoutDisCount - Number(get(mainData, '[0].DocTotal', 0))).toFixed(2)
    });
    worksheet.mergeCells(`D${revaluationRow.number}:H${revaluationRow.number}`);
    revaluationRow.getCell(1).alignment = { horizontal: 'center' };

    const quantityRow = worksheet.addRow({
        quantityCase: 'Сумма с учётом переоценки',
        lineTotal: ''
    });

    worksheet.mergeCells(`D${quantityRow.number}:H${quantityRow.number}`);
    quantityRow.getCell(1).alignment = { horizontal: 'center' };

    const finalTotalRow = worksheet.addRow({
        quantityCase: 'Сумма с учётом переоценки',
        lineTotal: Number(get(mainData, '[0].DocTotal', 0)).toFixed(2)
    });

    worksheet.mergeCells(`D${finalTotalRow.number}:H${finalTotalRow.number}`);
    finalTotalRow.getCell(1).alignment = { horizontal: 'center' };

    worksheet.mergeCells(`A${totalRow.number}:C${totalRow.number + 3}`);

    [totalRow, revaluationRow, quantityRow, finalTotalRow].forEach((row) => {
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
    saveAs(blob, 'Invoice.xlsx');
};

const exportTableToExcelWithoutTotal = async ({ mainData = [] }) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Invoice');

    worksheet.addRow([])
    worksheet.addRow([])
    let header = worksheet.addRow([`Накладная: № от ${moment(get(mainData, '[0].DocDate')).format('DD.MM.YYYY')}`])
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
        { label: `Адрес: ${get(mainData, '[0].Address', '') || ''}`, value: '' },
        { label: 'Ориентир:', value: '' },
        { label: `Телефон: ${get(mainData, '[0].Phone1', '') || ''} , ${get(mainData, '[0].Phone2', '') || ''}`, value: '' }
    ];

    headerInfo.forEach(info => {
        const row = worksheet.addRow([info.label, '', '', '', '', '', info.value]);
        worksheet.mergeCells(`A${row.number}:C${row.number}`);
        worksheet.mergeCells(`G${row.number}:H${row.number}`);
        row.eachCell({ includeEmpty: true }, cell => {
            cell.font = { size: 10 };
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
        });
    });

    worksheet.addRow([]);

    worksheet.columns = [
        { header: '№', key: 'no', width: 5 },
        { header: 'Код', key: 'itemCode', width: 15 },
        { header: 'Продукция', key: 'itemName', width: 55 },
        { header: 'Кол-во (в кейсе)', key: 'quantityCase', width: 15 },
        { header: 'Кол-во (в шт.)', key: 'quantity', width: 15 },
        // { header: 'Цена', key: 'priceBefDi', width: 10 },
        // { header: 'Скидка/наценка', key: 'discPrcnt', width: 15 },
        // { header: 'Цена с наценкой', key: 'price', width: 15 },
        // { header: 'Сумма', key: 'lineTotal', width: 15 }
    ];

    let headerRowNumber = worksheet.rowCount + 1;
    worksheet.addRow(['№', 'Код', 'Продукция', 'Кол-во (в кейсе)', 'Кол-во (в шт.)']);
    const headerRow = worksheet.getRow(headerRowNumber);
    headerRow.height = 24;
    headerRow.eachCell({ includeEmpty: true }, cell => {
        cell.font = { size: 9, bold: true };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
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
            quantityCase: (Number(get(item, 'Quantity')) / Number(get(item, 'U_Karobka', 1))).toFixed(1),
            quantity: Number(get(item, 'Quantity')),

        });
        row.height = 24;
        row.eachCell((cell) => {
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
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
        quantityCase: '',
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
    saveAs(blob, 'Invoice.xlsx');

};

const sandTableToExcelWithoutTotal = async ({ mainData = [] }) => {
    // 

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Invoice');

    worksheet.addRow([])
    worksheet.addRow([])
    let header = worksheet.addRow([`Накладная: № от ${moment(get(mainData, '[0].DocDate')).format('DD.MM.YYYY')}`])
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
            cell.font = { size: 10 };
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
        });
    });

    worksheet.addRow([]);

    worksheet.columns = [
        { header: '№', key: 'no', width: 5 },
        { header: 'Код', key: 'itemCode', width: 15 },
        { header: 'Продукция', key: 'itemName', width: 55 },
        { header: 'Кол-во (в кейсе)', key: 'quantityCase', width: 15 },
        { header: 'Кол-во (в шт.)', key: 'quantity', width: 15 },
        // { header: 'Цена', key: 'priceBefDi', width: 10 },
        // { header: 'Скидка/наценка', key: 'discPrcnt', width: 15 },
        // { header: 'Цена с наценкой', key: 'price', width: 15 },
        // { header: 'Сумма', key: 'lineTotal', width: 15 }
    ];

    let headerRowNumber = worksheet.rowCount + 1;
    worksheet.addRow(['№', 'Код', 'Продукция', 'Кол-во (в кейсе)', 'Кол-во (в шт.)']);
    const headerRow = worksheet.getRow(headerRowNumber);
    headerRow.height = 24;
    headerRow.eachCell({ includeEmpty: true }, cell => {
        cell.font = { size: 9, bold: true };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
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
            quantityCase: (Number(get(item, 'Quantity')) / Number(get(item, 'U_Karobka', 1))).toFixed(1),
            quantity: Number(get(item, 'Quantity')),

        });
        row.height = 24;
        row.eachCell((cell) => {
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
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
        quantityCase: '',
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

    let groupChatId = -4248929044
    // let groupChatId = 561932032

    const formData = new FormData();
    formData.append('chat_id', groupChatId); // replace with your Telegram chat ID
    formData.append('document', new File([blob], 'Invoice.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));

    // Send the file to the Telegram bot
    await axios.post(`https://api.telegram.org/bot7059322860:AAF4OCocNRPMwQ86DUUHWpD_igqIUTeDp5Y/sendDocument`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
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