// excel.js (frontend)
import ExcelJS from 'exceljs';
import moment from 'moment';
import { get } from 'lodash';
import { saveAs } from 'file-saver';
import formatterCurrency from '../../../helpers/currency'; // <-- mavjud helperingiz

export async function sendExcelAct(act) {
    const sorted = [...(act || [])].sort((a, b) => {
        const d = new Date(a.RefDate) - new Date(b.RefDate);
        if (d !== 0) return d;
        const A = Number(a.TransId || 0);
        const B = Number(b.TransId || 0);
        return A - B;
    });

    const rows = sorted.map((item, i) => {
        const debitNum = Number(get(item, 'Debit', 0));
        const creditNum = Number(get(item, 'Credit', 0));
        const saldoNum = Number(get(item, 'Салъдо нар', 0));

        return {
            ...item,
            no: i + 1,
            // jami uchun xom sonlar
            Debit1: debitNum,
            Credit1: creditNum,
            saldo1: saldoNum,

            // ko'rinish uchun
            RefDate: moment(get(item, 'RefDate', '')).format('DD.MM.YYYY'),
            Документ: get(item, 'Документ', ''),
            LineMemo: get(item, 'LineMemo', ''), // <-- YANGI USTUN

            // pullarni helper bilan formatlaymiz
            Debit: formatterCurrency(debitNum, 'USD'),
            Credit: formatterCurrency(creditNum, 'USD'),
            'Салъдо нар': formatterCurrency(saldoNum, 'USD'),
        };
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Ma'lumotlar`);

    // Ustunlar (LineMemo qo'shildi)
    worksheet.columns = [
        { header: '№', key: 'no', width: 5 },
        { header: 'Контрагент', key: 'CardName', width: 24 },
        { header: 'Дата', key: 'RefDate', width: 12 },
        { header: 'Документ', key: 'Документ', width: 18 },
        { header: 'Комментарий', key: 'LineMemo', width: 35 }, // <-- yangi
        { header: 'Дебит', key: 'Debit', width: 15 },
        { header: 'Кредит', key: 'Credit', width: 15 },
        { header: 'Салъдо нар', key: 'Салъдо нар', width: 15 },
    ];

    // Header style
    worksheet.getRow(1).height = 30;
    worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => {
        cell.font = { size: 10, bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Data rows
    rows.forEach(row => {
        const r = worksheet.addRow(row);
        r.height = 23;
        r.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            // pul/summa ustunlari markazdan ham ko'rinadi; xohlasangiz 'right' qiling
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            cell.font = { size: 9 };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });
    });

    // Totals (sonlardan hisoblab, ko'rinishda formatterCurrency)
    const totalDebit = rows.length ? rows.reduce((a, b) => a + Number(b.Debit1), 0) : 0;
    const totalCredit = rows.length ? rows.reduce((a, b) => a + Number(b.Credit1), 0) : 0;
    const lastSaldo = rows.length ? Number(rows[rows.length - 1].saldo1) : 0;

    const totalRow = worksheet.addRow({
        no: 'Итого',
        CardName: '',
        RefDate: '',
        Документ: '',
        LineMemo: '',
        Debit: formatterCurrency(totalDebit, 'USD'),
        Credit: formatterCurrency(totalCredit, 'USD'),
        'Салъдо нар': formatterCurrency(lastSaldo, 'USD'),
    });

    totalRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.font = { size: 10, bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Bo'sh qator va merge (sarlavha blok ko'rinishi uchun)
    worksheet.addRow([]);
    const emptyAfterTotal = totalRow.number + 1;
    worksheet.mergeCells(`A${totalRow.number}:B${emptyAfterTotal}`); // № + Контрагент
    worksheet.mergeCells(`C${totalRow.number}:C${emptyAfterTotal}`); // Дата
    worksheet.mergeCells(`D${totalRow.number}:D${emptyAfterTotal}`); // Документ
    worksheet.mergeCells(`E${totalRow.number}:E${emptyAfterTotal}`); // LineMemo
    worksheet.mergeCells(`F${totalRow.number}:F${emptyAfterTotal}`); // Дебит
    worksheet.mergeCells(`G${totalRow.number}:G${emptyAfterTotal}`); // Кредит
    worksheet.mergeCells(`H${totalRow.number}:H${emptyAfterTotal}`); // Салъдо нар

    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    const safeName = String(get(rows, '[0].CardName', '-')).replace(/[<>:"/\\|?*]+/g, '-');
    const fname = `${safeName} Акт сверки.xlsx`;

    const buf = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fname);
}
