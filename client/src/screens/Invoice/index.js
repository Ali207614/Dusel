import React, { useState, useCallback, useRef, useEffect } from 'react';
import ConsignmentStyle from './InvoiceStyle';
import { Layout } from '../../components';
import { useParams, useLocation } from 'react-router-dom';
import InvoiceHeader from './InvoiceHeader';
import InvoiceTable from './InvoiceTable';
import { useNavigate } from 'react-router-dom';
import { errorNotify, override } from '../../components/Helper';
import { get } from 'lodash';
import axios from 'axios';
import { FadeLoader } from 'react-spinners';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
let url = process.env.REACT_APP_API_URL



const Invoice = () => {

  let { id } = useParams();
  let location = useLocation();
  const navigate = useNavigate();
  const [docEntry, setDocEntry] = useState({
    id,
    draft: get(location, 'pathname').includes('draft')
  });
  let [color, setColor] = useState("#3C3F47");
  const [mainData, setMainData] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getOrderByDocEntry(get(docEntry, 'id'))
  }, [id]);

  const getOrderByDocEntry = (doc) => {
    setLoading(true)
    let link = get(docEntry, 'draft') ? `/api/draft/${doc}` : `/api/order?docEntry=${doc}`
    return axios
      .get(
        url + link ,
      )
      .then(({ data }) => {
        setLoading(false)
        setMainData(get(data, 'value', []))
        return data
      })
      .catch(err => {
        setLoading(false)
        errorNotify("Buyurtmani yuklashda muommo yuzaga keldi")
      });

    return;
  };


  const handleDownload = async () => {

    let sumWithoutDisCount = mainData?.length ? mainData.reduce((a, b) => a + (Number(b.Quantity) * Number(get(b, 'PriceBefDi'))), 0) : 0
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');

    // Define styles
    const headerStyle = {
      font: { name: 'Arial', size: 12, bold: true },
      alignment: { vertical: 'middle', horizontal: 'center' },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    };

    // Add header row
    const headerRow = [
      "№", "Код", "Продукция", "Кол-во (в кейсе)", "Кол-во (в шт.)", "Цена", "Скидка/наценка", "Цена с наценкой", "Сумма"
    ];
    const row = worksheet.addRow(headerRow);
    row.eachCell((cell) => {
      cell.style = headerStyle;
    });

    // Add data rows
    mainData.forEach((item, i) => {
      worksheet.addRow([
        i + 1,
        get(item, 'ItemCode'),
        get(item, 'ItemName'),
        (Number(get(item, 'Quantity')) / Number(get(item, 'U_Karobka', 1))).toFixed(1),
        Number(get(item, 'Quantity')),
        Number(get(item, 'PriceBefDi')),
        `-${Number(get(item, 'DiscPrcnt', 5))}%`,
        Number(get(item, 'Price')).toFixed(3),
        Number(get(item, 'LineTotal')).toFixed(2),
      ]);
    });

    // Add footer rows
    const footerStyle = {
      font: { name: 'Arial', size: 12, bold: true },
      alignment: { vertical: 'middle', horizontal: 'center' },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    };
    const totalRow = worksheet.addRow(["Итого", "", "", "", "", "", "", "", sumWithoutDisCount.toFixed(2)]);
    worksheet.mergeCells(`A${totalRow.number}:C${totalRow.number + 3}`);
    totalRow.eachCell(cell => cell.style = footerStyle);

    let footer1 = worksheet.addRow(["Сумма переоценки (к заказу)", "", "", "", "", "", "", "", (sumWithoutDisCount - Number(get(mainData, '[0].DocTotal', 0))).toFixed(2)])
    worksheet.mergeCells(`D${totalRow.number}:H${totalRow.number}`);
    footer1.eachCell(cell => cell.style = footerStyle);
    // worksheet.addRow(["Сумма с учётом переоценки", "", "", "", "", "", "", "", ""]).eachCell(cell => cell.style = footerStyle);
    // worksheet.addRow(["Сумма с учётом переоценки", "", "", "", "", "", "", "", Number(get(mainData, '[0].DocTotal', 0)).toFixed(2)]).eachCell(cell => cell.style = footerStyle);

    worksheet.columns = [
      { width: 5 },
      { width: 15 },
      { width: 30 },
      { width: 20 },
      { width: 20 },
      { width: 10 },
      { width: 15 },
      { width: 20 },
      { width: 15 },
    ];

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'report.xlsx');
  };




  return (
    <>
      <ConsignmentStyle>
        <Layout>
          <div className='container'>
            <div className="order-main ">
              <button onClick={() => navigate('/home')} className='btn-back'>Закрить</button>
              <button onClick={handleDownload}>Download as Excel</button>
            </div>
            <div className="invoice">
              {
                !loading ? (
                  <>
                    <InvoiceHeader header={mainData} />
                    <InvoiceTable items={mainData} setItems={setMainData} draft={get(docEntry, 'draft')} />
                  </>
                ) : <FadeLoader color={color} loading={loading} cssOverride={override} size={100} />
              }

            </div>
          </div>
        </Layout>
      </ConsignmentStyle>

    </>
  );
};

export default Invoice;
