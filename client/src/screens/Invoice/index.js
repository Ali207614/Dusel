import React, { useState, useCallback, useRef, useEffect } from 'react';
import ConsignmentStyle from './InvoiceStyle';
import { Layout } from '../../components';
import { useParams, useLocation } from 'react-router-dom';
import InvoiceHeader from './InvoiceHeader';
import InvoiceTable from './InvoiceTable';
import { useNavigate } from 'react-router-dom';
import { utils, writeFile } from 'xlsx';
import { errorNotify, override } from '../../components/Helper';
import { get } from 'lodash';
import axios from 'axios';
import { FadeLoader } from 'react-spinners';
import XLSX from 'xlsx-style';
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


  const handleDownload = () => {
    let sumWithoutDisCount = mainData?.length ? mainData.reduce((a, b) => a + (Number(b.Quantity) * Number(get(b, 'PriceBefDi'))), 0) : 0
    const headerRow = [
      "№", "Код", "Продукция", "Кол-во (в кейсе)", "Кол-во (в шт.)", "Цена", "Скидка/наценка", "Цена с наценкой", "Сумма"
    ];

    const rows = mainData.map((item, i) => ([
      i + 1,
      get(item, 'ItemCode'),
      get(item, 'ItemName'),
      (Number(get(item, 'Quantity')) / Number(get(item, 'U_Karobka', 1))).toFixed(1),
      Number(get(item, 'Quantity')),
      Number(get(item, 'PriceBefDi')),
      `-${Number(get(item, 'DiscPrcnt', 5))}%`,
      Number(get(item, 'Price')).toFixed(3),
      Number(get(item, 'LineTotal')).toFixed(2),
    ]));

    const footerRow1 = ["Итого", "", "", "", "", "", "", "", sumWithoutDisCount.toFixed(2)];
    const footerRow2 = ["Сумма переоценки (к заказу)", "", "", "", "", "", "", "", (sumWithoutDisCount - Number(get(mainData, '[0].DocTotal', 0))).toFixed(2)];
    const footerRow3 = ["Сумма с учётом переоценки", "", "", "", "", "", "", "", 1];
    const footerRow4 = ["Сумма с учётом переоценки", "", "", "", "", "", "", "", Number(get(mainData, '[0].DocTotal', 0)).toFixed(2)];

    const worksheetData = [
      headerRow,
      ...rows,
      footerRow1,
      footerRow2,
      footerRow3,
      footerRow4
    ];

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // Add styles
    const style = {
      font: { name: "Arial", sz: 12, bold: true },
      fill: { fgColor: { rgb: "FFFFAA00" } },
      alignment: { vertical: "center", horizontal: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } }
      }
    };

    // Apply styles to header row
    headerRow.forEach((_, colIdx) => {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: colIdx });
      ws[cellRef].s = style;
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoice");

    XLSX.writeFile(wb, 'invoice.xlsx');
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
