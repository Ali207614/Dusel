import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Style from './Style';
import Layout from '../../components/Layout';
import Button from '../../components/Button';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18next from 'i18next';
import axios from 'axios';
import { useSelector } from 'react-redux';
import searchImg from '../../assets/images/search-normal.svg';
import filterImg from '../../assets/images/filter-search.svg';
import arrowDown from '../../assets/images/arrow-down.svg';
import pagination from '../../assets/images/pagination.svg';
import editIcon from '../../assets/images/edit-icon.svg';
import { get } from 'lodash';
import formatterCurrency from '../../helpers/currency';
import moment from 'moment';
import { FadeLoader } from "react-spinners";
import { ConfirmModal, ErrorModal, ConfirmModalOrder } from '../../components/Modal';
import { Spinner } from '../../components';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

let url = process.env.REACT_APP_API_URL

let limitList = [1, 10, 50, 100, 500, 1000]

const override = {
  position: "absolute",
  left: "50%",
  top: "50%",
  width: "100px",
  height: "100px",
  margin: 'auto'
};


let statuses = {
  2: {
    color: '#FFFFFF',
    backgroundColor: '#6C757D',
    name: 'Черновик',
    access: [2, 1, 7],
    actualName: 'Черновик'
  },
  1: {
    color: '#FFFFFF',
    backgroundColor: '#388E3C',
    name: 'Новый',
    access: [1, 3, 4, 5, 6],
    actualName: 'Новый'
  },
  3: {
    color: '#FFFFFF',
    backgroundColor: '#FFA000',
    name: 'Ожидания',
    access: [3, 4, 5, 6],
    actualName: 'Ожидания'
  },
  4: {
    color: '#FFFFFF',
    backgroundColor: '#0056B3',
    name: 'Подтвердить',
    access: [4, 5, 6],
    actualName: 'Подтвержден'
  },
  5: {
    color: '#FFFFFF',
    backgroundColor: '#00A2C7',
    name: 'Напечатать',
    access: [5, 6, 8],
    actualName: 'Печатанный'
  },
  6: {
    color: '#FFFFFF',
    backgroundColor: '#00A2C7',
    name: 'Отменить'
  },
  7: {
    color: '#FFFFFF',
    backgroundColor: '#00A2C7',
    name: 'Удалить'
  },
  8: {
    color: '#FFFFFF',
    backgroundColor: '#00A2C7',
    name: 'Архивировать'
  }
};


const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [activeData, setActiveData] = useState(false);
  const [allPageLength, setAllPageLength] = useState(0);
  const [loading, setLoading] = useState(false)
  const [mainCheck, setMainCheck] = useState(false)
  const [mainData, setMainData] = useState([])
  const [ts, setTs] = useState(10);
  const [select, setSelect] = useState([])
  const [search, setSearch] = useState('')
  const [fnState, setFnState] = useState(false)

  const [updateLoading, setUpdateLoading] = useState(false)

  const [dropdownOpen, setDropdownOpen] = useState(false);

  let [color, setColor] = useState("#3C3F47");

  const { getMe } = useSelector(state => state.main);

  const confirmRef = useRef();

  const errorRef = useRef();

  const confirmModalRef = useCallback(ref => {
    confirmRef.current = ref;
  }, []);
  const getErrorRef = useCallback(ref => {
    errorRef.current = ref;
  }, []);



  const handleChange = e => {
    const newSearchTerm = e.target.value;
    setSearch(newSearchTerm);
  };


  const errorNotify = (text) => toast.error(text, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "colored",
  });
  const warningNotify = (text) => toast.warning(text, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "colored",
  });

  const successNotify = (text) => toast.success(text, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "colored",
  });

  useEffect(() => {
    const delay = 1000;
    let timeoutId;

    if (search) {
      timeoutId = setTimeout(() => {
        getOrders({ page: 1, limit, value: search })
        setTs(limit)
        setPage(1);
      }, delay);
    }
    else {
      getOrders({ page: 1, limit })
      setTs(limit)
      setPage(1);
    }

    return () => {
      // Agar component o'chirilsa, timeoutni bekor qilish
      clearTimeout(timeoutId);
    };
  }, [search]);

  useEffect(() => {
    getOrderApi()
    getOrders({ page, limit })
  }, []);

  const getOrders = (pagination) => {
    setLoading(true)
    axios
      .get(
        url + `/api/orders?offset=${get(pagination, 'page', 1)}&limit=${get(pagination, 'limit', limit)}&search=${get(pagination, 'value', '').toLowerCase()}`,
      )
      .then(({ data }) => {
        setLoading(false)
        setMainData(get(data, 'value', []))
        setAllPageLength(get(data, 'value[0].LENGTH', []))
      })
      .catch(err => {
        setLoading(false)
        errorNotify("Malumot yuklashda xatolik yuz berdi")
      });

    return;
  };

  const deleteDraft = (doc) => {
    setDropdownOpen(false);
    setUpdateLoading(true)
    axios
      .delete(
        url + `/api/draft/${doc}`,
      )
      .then(({ data }) => {
        setMainData(mainData.filter(item => !item.draft && item.DocEntry != doc))
        successNotify("Malumot muvaffaqiyatli o'chirldi")
        setUpdateLoading(false)
        setActiveData(0)
        return
      })
      .catch(err => {
        errorNotify('Xatolik yuz berdi')
        setUpdateLoading(false)
      });
  }

  const addDraft = (body) => {

    if (get(body, 'schema.CardCode')) {
      setDropdownOpen(false);
      setUpdateLoading(true)
      let link = `/b1s/v1/Orders`
      axios
        .post(
          url + link,
          get(body, 'schema', {}),
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
          successNotify("Malumot muvaffaqiyatli qo'shildi")
          axios
            .delete(
              url + `/api/draft/${get(body, 'DocEntry')}`,
            )
            .then(({ el }) => {
              let index = mainData.findIndex(item => item.draft && item.DocEntry == get(body, 'DocEntry'))
              mainData[index] = { ...mainData[index], U_status: 1, DocEntry: get(data, 'DocEntry'), draft: false }
              setMainData([...mainData])
              setUpdateLoading(false)
              setActiveData(0)
              return
            })
            .catch(err => {
              errorNotify('Xatolik yuz berdi ochirishda')
              setUpdateLoading(false)
            });
        })
        .catch(err => {
          if (get(err, 'response.status') == 401) {
            navigate('/login')
            return
          }
          setUpdateLoading(false)
          errorRef.current?.open(get(err, 'response.data.error.message.value', 'Ошибка'));
        });

      return;
    }
    return
  };


  const statusChange = () => setFnState(true)

  const handleSelect = (status, docEntry, isDraft = false) => {
    let handleFn = {
      1: {
        name: 'новый',
        fn: () => addDraft
      },
      6: {
        name: 'отменить',
      },
      7: {
        name: 'удалить',
        fn: () => deleteDraft
      },
      8: {
        name: 'архивировать',
      }
    };
    console.log(docEntry, isDraft, status)
    if (isDraft && status == 1) {
      confirmRef.current?.open(`Вы уверены, что хотите это добавить ? `, handleFn[status].fn, mainData.find(item => item.DocEntry == docEntry));
      return
    }
    if (handleFn[status]) {

      confirmRef.current?.open(`Вы уверены, что хотите это ${handleFn[status].name} ? `, handleFn[status].fn, docEntry);
      return
    }
    setDropdownOpen(false);
    axios
      .patch(
        url + `/b1s/v1/Orders(${docEntry})`,
        {
          U_status: status
        },
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
        setUpdateLoading(false)
        let index = mainData.findIndex((el => el.DocEntry == docEntry))
        mainData[index].U_status = status
        setMainData([...mainData])
        successNotify(`Status muvaffaqiyatli o'zgartirildi`)
      })
      .catch(err => {
        setUpdateLoading(false)
        if (get(err, 'response.status') == 401) {
          navigate('/login')
          return
        }
        errorNotify(`Status o'zgartirishda xatolik yuz berdi`)
      });
  };

  const getOrderApi = () => {
    axios
      .get(
        url + `/b1s/v1/Orders`,
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
      })
      .catch(err => {
        if (get(err, 'response.status') == 401) {
          navigate('/login')
          return
        }
      });
  }
  return (
    <>

      <Style>
        <Layout>
          <div className='container'>
            <div className='head'>
              <div className='left-head'>
                <h3 className='left-title'>Заказы</h3>
              </div>
              <div className='right-head'>

                <div className='right-pagination'>
                  <p className='pagination-text'><span>{page}-{ts}</span> <span>of {allPageLength}</span> </p>
                  <button onClick={() => {
                    if (page > 1) {
                      getOrders({ page: page - limit, limit })
                      setPage(page - limit);
                      setTs(ts - limit)
                      setSelect([])
                    }
                  }} disabled={page == 1} className={`pagination-button left-pagination ${page == 1 ? 'opcity-5' : ''}`}>
                    <img src={pagination} alt="arrow-button-pagination" />
                  </button>

                  <button onClick={() => {
                    if (ts < allPageLength) {
                      getOrders({ page: page + limit, limit })
                      setPage(page + limit)
                      setTs(limit + ts)
                      setSelect([])
                    }
                  }} disabled={ts >= allPageLength} className={`pagination-button margin-right ${ts >= allPageLength ? 'opcity-5' : ''}`}>
                    <img src={pagination} alt="arrow-button-pagination" />
                  </button>
                </div>
                <div className='right-input'>
                  <img className='right-input-img' src={searchImg} alt="search-img" />
                  <input onChange={handleChange} value={search} type="search" className='right-inp' placeholder='Поиск' />
                </div>

                <button className='right-filter'>
                  <img className='right-filter-img' src={filterImg} alt="filter-img" />
                </button>

                <div className='right-limit'>
                  <button onClick={() => setShowDropdown(!showDropdown)} className='right-dropdown'>
                    <p className='right-limit-text'>{limit}</p>
                    <img src={arrowDown} className={showDropdown ? "up-arrow" : ""} alt="arrow-down-img" />
                  </button>
                  <ul className={`dropdown-menu ${showDropdown ? "display-b" : "display-n"}`} aria-labelledby="dropdownMenuButton1">
                    {
                      limitList.map((item, i) => {
                        return (<li key={i} onClick={() => {
                          if (limit != item) {
                            setLimit(item);
                            setPage(1);
                            setShowDropdown(false);
                            setTs(item)
                            getOrders({ page: 1, limit: item })
                            setSelect([])
                            setMainCheck(false)
                          }
                          return
                        }} className={`dropdown-li ${limit == item ? 'dropdown-active' : ''}`}><a className="dropdown-item" href="#">{item}</a></li>)
                      })
                    }
                  </ul>
                </div>


                <button onClick={() => navigate('/order')} className='btn-head'>
                  Добавить
                </button>
              </div>
            </div>
            <div className='table'>
              <div className='table-head'>
                <ul className='table-head-list d-flex align  justify'>
                  {/* <li className='table-head-item'>DocNum</li> */}
                  <li className='table-head-item d-flex align '>
                    <input checked={mainCheck} className='m-right-16 inp-checkbox' onClick={() => {
                      if (mainCheck) {
                        setSelect([])
                      }
                      else {
                        setSelect([...mainData.map((item, i) => i + 1)])
                      }
                      setMainCheck(!mainCheck)
                    }} type="checkbox" name="checkbox" />
                    Контрагент
                  </li>
                  <li className='table-head-item'>Дата заказа</li>
                  <li className='table-head-item'>Дата создания</li>
                  <li className='table-head-item'>Сумма сделки</li>
                  <li className='table-head-item'>Нетто / Брутто</li>
                  <li className='table-head-item w-50'>Состояние</li>
                </ul>
              </div>
              <div className='table-body'>
                {
                  !loading ? (
                    <ul className='table-body-list'>
                      {
                        mainData.map((item, i) => {
                          return (
                            <li key={i} className={`table-body-item ${activeData === i + 1 ? 'active-table' : ''}`}>
                              <div className='table-item-head d-flex align  justify'>
                                <div className='d-flex align  w-100 p-16'>
                                  <input checked={select.find(item => item == i + 1)} className='m-right-16 inp-checkbox' onClick={(e) => {
                                    if (select.find(item => item == i + 1)) {
                                      setSelect([...select.filter(item => item != i + 1)])
                                    }
                                    else {
                                      setSelect([...select, i + 1])
                                    }
                                  }} type="checkbox" name="checkbox" />
                                  <p className='table-body-text truncated-text w-100' title={get(item, 'CardName', '')} onClick={() => setActiveData(activeData === i + 1 ? 0 : (i + 1))}>
                                    {get(item, 'CardName', '')}
                                  </p>
                                </div>
                                <div className='w-100 p-16' onClick={() => setActiveData(activeData === i + 1 ? 0 : (i + 1))}>
                                  <p className='table-body-text'>
                                    {moment(get(item, 'DocDate', '')).format("DD-MM-YYYY")}
                                  </p>
                                </div>
                                <div className='w-100 p-16' onClick={() => setActiveData(activeData === i + 1 ? 0 : (i + 1))}>
                                  <p className='table-body-text '>
                                    {moment(get(item, 'CreateDate', '')).format("DD-MM-YYYY")}
                                  </p>
                                </div>
                                <div className='w-100 p-16' onClick={() => setActiveData(activeData === i + 1 ? 0 : (i + 1))}>
                                  <p className='table-body-text '>
                                    {formatterCurrency(Number(get(item, 'DocTotal', 0)), get(item, 'DocCur', 'UZS'))}
                                  </p>
                                </div>
                                <div className='w-100 p-16' onClick={() => setActiveData(activeData === i + 1 ? 0 : (i + 1))}>
                                  <p className='table-body-text '>
                                    {Number(get(item, 'NETTO', '-')).toFixed(4)} / {Number(get(item, 'BRUTTO', '-')).toFixed(4)}
                                  </p>
                                </div>
                                <div className='w-50 p-16' onClick={() => setActiveData(activeData === i + 1 ? 0 : (i + 1))}>
                                  <button style={{ color: statuses[get(item, 'U_status', '1')].color, backgroundColor: statuses[get(item, 'U_status', '1')].backgroundColor }} className='table-body-text status-button'>
                                    {statuses[get(item, 'U_status', '1')].actualName}
                                  </button>
                                </div>
                              </div>
                              <div className='table-item-foot d-flex align'>
                                <button className='table-item-btn d-flex align'>
                                  <Link className='table-item-text d-flex align' to={(get(item, 'draft') ? `/order/${item.DocEntry}/draft` : `/order/${item.DocEntry}`)}>Просмотреть и изменить заказ  <img src={editIcon} alt="arrow right" /></Link>
                                </button>
                                <button className='table-item-btn d-flex align table-item-text'> Накладный <img src={editIcon} alt="arrow-right" /></button>
                                <div className="dropdown-container">
                                  <button style={{ width: '110px' }} disabled={updateLoading} className="table-item-btn d-flex align table-item-text position-relative" onClick={() => setDropdownOpen(!dropdownOpen)}>
                                    Состояние  {updateLoading ? <div className="spinner-border" role="status">
                                      <span className="sr-only">Loading...</span>
                                    </div> : <img style={{ marginLeft: '6px' }} src={editIcon} alt="arrow-right" />}
                                  </button>
                                  {(dropdownOpen) && (
                                    <ul className="dropdown-menu">
                                      {get(statuses, `${[get(item, 'U_status', '')]}.access`, []).map((status, i) => (
                                        <li key={i} onClick={() => {
                                          if (status != get(item, 'U_status', '')) {
                                            handleSelect(status, get(item, 'DocEntry', 0), get(item, 'draft'))
                                          }
                                        }} className={`dropdown-li ${get(item, 'U_status', '') == status ? 'dropdown-active' : ''}`}><a className="dropdown-item" href="#">{statuses[status].name}</a></li>
                                      ))}

                                    </ul>
                                  )}
                                </div>
                              </div>
                            </li>
                          )
                        })
                      }
                    </ul>
                  ) : <FadeLoader color={color} loading={loading} cssOverride={override} size={100} />
                }
              </div>
            </div>
          </div>
          <div className='footer-main'>
            <div className='footer-info'>
              <div className="container">
                <div className='right-head' style={{ justifyContent: 'end' }}>
                  <div className='footer-block'>
                    <p className='footer-text'>Сумма сделки : <span className='footer-text-spn'>{formatterCurrency(Number(get(mainData, '[0].ALLDOCTOTAL', 0)), "USD")}</span></p>
                  </div>
                  <div className='footer-block'>
                    <p className='footer-text'>Нетто : <span className='footer-text-spn'>{Number(get(mainData, '[0].ALLNETTO', 0)).toFixed(4)}</span></p>
                  </div>
                  <div className='footer-block'>
                    <p className='footer-text'>Брутто : <span className='footer-text-spn'>{Number(get(mainData, '[0].ALLBRUTTO', 0)).toFixed(4)}</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Layout>
      </Style>
      <>
        <ToastContainer />
        <ConfirmModalOrder getRef={confirmModalRef} title={"Oshibka"} fn={statusChange} />
        <ErrorModal
          getRef={getErrorRef}
          title={'Ошибка'}
        />
      </>
    </>
  );
};

export default Home;
