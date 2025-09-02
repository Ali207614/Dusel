import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Style from './Style';
import axios from 'axios';
import { get } from 'lodash';
import { FadeLoader } from "react-spinners";
import LazyLoad from "react-lazyload";
import { errorNotify, successNotify, warningNotify } from '../../components/Helper';
import { useSelector } from 'react-redux';
import remove from '../../assets/images/bin.png';
import { Spinner } from '../../components';
import { ToastContainer, toast } from 'react-toastify';
import moment from 'moment';

let url = process.env.REACT_APP_API_URL;

const override = {
  position: "absolute",
  left: "50%",
  top: "50%",
};

const IncomingPaymentAdd = () => {
  let { id } = useParams();
  let location = useLocation();
  const navigate = useNavigate();

  const { accounts = [], getMe, userType } = useSelector(state => state.main);

  const [color] = useState("#3C3F47");
  const [loading, setLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [mainData, setMainData] = useState([]);
  const [rowResults, setRowResults] = useState({});
  const [activeRow, setActiveRow] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState('');

  useEffect(() => {
    if (id) {
      getOrders()
    }
    else {
      setMainData('_'.repeat(5).split('_').map(() => ({
        LineMemo: '',
        CardName: '',
        CardCode: '',
        Credit: '',
        RefDate: moment().format("YYYY-MM-DD")
      })));
    }
  }, [id, location]);

  const getCustomer = (search) => {
    return axios
      .get(`${url}/api/customer?search=${search.toLowerCase()}&type=${userType}`)
      .then(({ data }) => get(data, 'value', []))
      .catch(() => {
        errorNotify("Mijozlarni yuklashda muommo yuzaga keldi");
        return [];
      });
  };

  const getOrders = () => {
    setLoading(true)
    axios
      .get(
        url + `/api/payments?TransId=${id}`,
      )
      .then(({ data }) => {
        setLoading(false)
        const rows = data?.value ?? [];
        setSelectedAccount(rows[0]?.ContraAct || '')
        const padded = [
          ...rows.map(el => ({ ...el, RefDate: moment(el.RefDate).format("YYYY-MM-DD") })),
          ...Array(Math.max(0, 6 - rows.length)).fill(null).map(() => ({
            LineMemo: '',
            CardName: '',
            CardCode: '',
            Credit: '',
            RefDate: moment().format("YYYY-MM-DD")
          }))
        ];

        setMainData(padded);
      })
      .catch(err => {
        setLoading(false)
        errorNotify("Malumot yuklashda xatolik yuz berdi")
      });

    return;
  };

  const addJournalEntries = (filtered) => {
    setOrderLoading(true)
    let currency = accounts.find(el => Object.values(el)[0] == selectedAccount)?.currency
    let body = {
      "OriginalJournal": "ttJournalEntry",
      "ReferenceDate": filtered[0].RefDate,
      "Series": 17,
      "JournalEntryLines": [
        {
          "AccountCode": selectedAccount,
          "Debit": currency == 'USD' ? filtered.reduce((a, b) => a + Number(b.Credit), 0) : 0,
          "FCDebit": currency == 'USD' ? 0 : filtered.reduce((a, b) => a + Number(b.Credit), 0),
          "Credit": 0.0,
          FCCurrency: "Sum",
          "ShortName": selectedAccount,
          "LineMemo": "",
        },
        ...filtered.map(el => {
          return {
            AccountCode: '4010',
            ShortName: el.CardCode,
            FCCurrency: "Sum",
            Credit: currency == 'USD' ? Number(el.Credit) : 0,
            FCCredit: currency == 'USD' ? 0 : Number(el.Credit),
            LineMemo: el.LineMemo
          }
        })
      ]
    }
    axios
      .post(
        url + `/b1s/v1/JournalEntries`,
        body,
        {
          headers: {
            info: JSON.stringify({
              'Cookie': get(getMe, 'Cookie[0]', '') + get(getMe, 'Cookie[1]', ''),
              'SessionId': get(getMe, 'SessionId', ''),
            })
          },
        }
      )
      .then(({ data }) => {
        setOrderLoading(false)
        setMainData(prev => [
          ...prev,
          { LineMemo: '', CardName: '', CardCode: '', Credit: '' }
        ]);
        successNotify("Malumot muvaffaqiyatli qo'shildi")
      })
      .catch(err => {
        if (get(err, 'response.status') == 401) {
          navigate('/login')
          return
        }
        errorNotify("Qo'shishda xatolik yuzaga keldi " + err)
        setOrderLoading(false)
      });
  }

  const handleCardCodeChange = async (value, i) => {
    const updated = [...mainData];
    updated[i] = { ...updated[i], CardCode: value };
    setMainData(updated);

    if (value.length >= 1) {
      const results = await getCustomer(value);
      setRowResults(prev => ({ ...prev, [i]: results }));
      setActiveRow(i);
    } else {
      setRowResults(prev => ({ ...prev, [i]: [] }));
      setActiveRow(null);
    }
  };

  const handleAddRow = () => {
    setOrderLoading(true)
    if (!selectedAccount) {
      warningNotify("Hisob mavjud emas!");
      setOrderLoading(false)
      return;
    }
    let filtered = mainData.filter(item => item.CardCode && +item.Credit > 0)
    if (filtered.length == 0) {
      warningNotify("Ma'lumot to'liq emas");
      setOrderLoading(false)

      return
    }
    addJournalEntries(filtered)
    setSelectedAccount('')
    setMainData(prev => [
      ...prev,
      { LineMemo: '', CardName: '', CardCode: '', Credit: '' }
    ]);
  };

  function formatterCurrency(number = 0, locale = "ru") {
    if (!number) return "";
    return Number(number).toLocaleString(locale, {
      minimumFractionDigits: 0
    });
  }

  return (
    <>
      <Style>
        <Layout>
          <div className='container'>
            <div className="order-head">
              <div className="order-main d-flex align justify">
                <div className='d-flex align'>
                  <button onClick={() => navigate('/payment')} className='btn-back'>Назад</button>
                  <h3 className='title-menu'>{id ? 'Просмотреть' : "Добавить"} оплату</h3>
                </div>
              </div>
            </div>

            {/* Hisob turi select + qo'shish tugmasi */}
            <div style={{ marginBottom: '15px' }} className="d-flex align justify">
              <select
                className="table-body-inp"
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
              >
                <option value="">Hisob turini tanlang</option>
                {accounts.map((acc, idx) => {
                  const value = Object.values(acc)[0];
                  const name = acc.name || 'No name';
                  if (!value) return null;
                  return (
                    <option key={idx} value={value}>
                      {value} - {name}
                    </option>
                  );
                })}
              </select>
              <div className='w-70'>
                <input value={get(mainData, '[0].RefDate', '')} onChange={(e) => setMainData([...mainData.map(el => ({ ...el, RefDate: e.target.value }))])} type="date" className='table-body-inp' placeholder='Doc Date' />
              </div>

              {!id &&
                <button onClick={handleAddRow} className={`btn-head position-relative ${!accounts.some(acc => Object.values(acc)[0]) ? 'opacity-5' : ''}`}>
                  {orderLoading ? <Spinner /> : ('Добавить')}
                </button>}
            </div>


            <div className='table'>
              <div className='table-head'>
                <ul className='table-head-list d-flex align  justify'>
                  <li className='table-head-item w-20'>№</li>
                  <li className='table-head-item w-100'>Код контрагента</li>
                  <li className='table-head-item w-100'>Название контрагента</li>
                  <li className='table-head-item w-100'>Сумма</li>
                  <li className='table-head-item w-50'>Валюта</li>
                  <li className='table-head-item w-100'>Примечания</li>
                  <li className='table-head-item w-20'>Удалить</li>
                </ul>
              </div>

              <div className='table-body'>
                {!loading ? (
                  <ul className='table-body-list'>
                    {mainData.map((item, i) => (
                      <LazyLoad key={i} height={65} once>
                        <li className='table-body-item'>
                          <div className='table-item-head d-flex align justify'>

                            {/* № */}
                            <div className='w-20 p-16'>
                              <span>{i + 1}</span>
                            </div>

                            {/* CardCode + dropdown */}
                            <div className='w-100 p-16' style={{ position: 'relative' }}>
                              <input
                                value={item.CardCode}
                                onChange={(e) => handleCardCodeChange(e.target.value, i)}
                                type="text"
                                className='table-body-inp'
                                placeholder='-' />
                              {activeRow === i && rowResults[i]?.length > 0 && (
                                <ul
                                  className="dropdown-menu display-b"
                                  style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    zIndex: 1000,
                                    background: '#fff',
                                    border: '1px solid #ddd',
                                    width: '100%'
                                  }}
                                >
                                  {rowResults[i].map((cust, idx) => (
                                    <li
                                      key={idx}
                                      onClick={() => {
                                        const updated = [...mainData];
                                        updated[i] = {
                                          ...updated[i],
                                          CardCode: cust.CardCode,
                                          CardName: cust.CardName
                                        };
                                        setMainData(updated);
                                        setActiveRow(null);
                                      }}
                                      className="dropdown-li"
                                    >
                                      {cust.CardCode} - {cust.CardName}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>

                            {/* CardName */}
                            <div className='w-100 p-16'>
                              <p className='table-body-text truncated-text' title={item.CardName}>
                                {item.CardName || '-'}
                              </p>
                            </div>

                            {/* Credit */}
                            <div className='w-100 p-16'>
                              <input
                                value={item.Credit ? formatterCurrency(item.Credit, "ru") : ""}
                                onChange={(e) => {
                                  // Faqat raqamlarni qoldiramiz
                                  const raw = +e.target.value.replace(/\D/g, "");
                                  const updated = [...mainData];
                                  updated[i] = { ...updated[i], Credit: raw };
                                  setMainData(updated);
                                }}
                                type="text"
                                className='table-body-inp'
                                placeholder='-' />
                            </div>
                            <div className='w-50 p-16'>
                              <p className='table-body-text truncated-text' title={item.CardName}>
                                {selectedAccount ? (accounts.find(el => Object.values(el)[0] == selectedAccount)?.currency || 'USD') : 'USD'}
                              </p>
                            </div>

                            {/* LineMemo */}
                            <div className='w-100 p-16'>
                              <input
                                value={item.LineMemo}
                                onChange={(e) => {
                                  const updated = [...mainData];
                                  updated[i] = { ...updated[i], LineMemo: e.target.value };
                                  setMainData(updated);
                                }}
                                type="text"
                                className='table-body-inp'
                                placeholder='-' />
                            </div>

                            {/* Remove */}
                            <div className='w-20 p-16'>
                              <button
                                onClick={() => {
                                  setMainData(mainData.filter((_, idx) => idx !== i));
                                }}
                                className="table-body-text table-head-check-btn"
                              >
                                <img src={remove} style={{ width: '20px', cursor: "pointer" }} alt="remove button" />
                              </button>
                            </div>
                          </div>
                        </li>
                      </LazyLoad>
                    ))}
                  </ul>
                ) : (
                  <FadeLoader color={color} loading={loading} cssOverride={override} size={100} />
                )}
              </div>
            </div>
          </div>
        </Layout>
      </Style>
      <>
        <ToastContainer />
      </>
    </>
  );
};

export default IncomingPaymentAdd;
