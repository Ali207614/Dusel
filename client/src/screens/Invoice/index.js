import React, { useState, useCallback, useRef, useEffect } from 'react';
import ConsignmentStyle from './InvoiceStyle';
import { Layout } from '../../components';
import { useParams, useLocation } from 'react-router-dom';
import InvoiceHeader from './InvoiceHeader';
import InvoiceTable from './InvoiceTable';
import { useNavigate } from 'react-router-dom';
import exportTableToExcel from './excel';
import { errorNotify, override } from '../../components/Helper';
import { get } from 'lodash';
import axios from 'axios';
import { FadeLoader } from 'react-spinners';

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





  return (
    <>
      <ConsignmentStyle>
        <Layout>
          <div className='container'>
            <div className="order-main ">
              <button onClick={() => navigate('/home')} className='btn-back'>Закрить</button>
              {
                (mainData?.length && !get(docEntry, 'draft')) ? <button onClick={() => exportTableToExcel({ mainData })}>Download as Excel</button> : ''
              }
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
