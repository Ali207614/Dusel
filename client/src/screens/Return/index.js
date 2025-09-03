import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Style from './Style';
import Layout from '../../components/Layout';
import { useTranslation } from 'react-i18next';

import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import searchImg from '../../assets/images/search-normal.svg';
import filterImg from '../../assets/images/filter-search.svg';
import arrowDown from '../../assets/images/arrow-down.svg';
import pagination from '../../assets/images/pagination.svg';
import editIcon from '../../assets/images/edit-icon.svg';
import close from '../../assets/images/Close-filter.svg';
import notFound from '../../assets/images/not_found.png';
import { get } from 'lodash';
import formatterCurrency from '../../helpers/currency';
import moment from 'moment';
import { FadeLoader } from "react-spinners";
import { ConfirmModal, ErrorModal, ConfirmModalOrder, FilterOrderModal } from '../../components/Modal';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { errorNotify, successNotify, warningNotify, limitList, override } from '../../components/Helper';
import { main } from '../../store/slices';

let url = process.env.REACT_APP_API_URL



const Return = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { setFilter } = main.actions;
  const { getMe, getFilter, userType } = useSelector(state => state.main);

  const [showDropdown, setShowDropdown] = useState(false);
  const [limit, setLimit] = useState(get(getFilter, 'limit', 10));
  const [page, setPage] = useState(get(getFilter, 'page', 1));
  const [ts, setTs] = useState(get(getFilter, 'ts', 10));
  const [select, setSelect] = useState(get(getFilter, 'select', []))
  const [search, setSearch] = useState(get(getFilter, 'search', ''))

  const [activeData, setActiveData] = useState(get(getFilter, 'activeData', false));
  const [allPageLength, setAllPageLength] = useState(0);
  const [loading, setLoading] = useState(false)
  const [mainCheck, setMainCheck] = useState(false)
  const [mainData, setMainData] = useState([])
  const [fnState, setFnState] = useState(false)
  const [filterData, setFilterData] = useState({})

  const [filterProperty, setFilterProperty] = useState(get(getFilter, 'filterProperty', {}))

  const [updateLoading, setUpdateLoading] = useState(false)

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [invoiceDropDown, setInvoiceDropDown] = useState(false);

  let [color, setColor] = useState("#3C3F47");


  const confirmRef = useRef();

  const errorRef = useRef();

  const filterRef = useRef();

  const filterModalRef = useCallback(ref => {
    filterRef.current = ref;
  }, []);

  const confirmModalRef = useCallback(ref => {
    confirmRef.current = ref;
  }, []);

  const getErrorRef = useCallback(ref => {
    errorRef.current = ref;
  }, []);

  let statuses = {
    2: {
      color: '#FFFFFF',
      backgroundColor: '#6C757D',
      name: 'Черновик',
      access: [2, 8, 7],
      actualName: 'Черновик'
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
  }

  const handleChange = e => {
    const newSearchTerm = e.target.value;
    setSearch(newSearchTerm);
  };

  useEffect(() => {
    dispatch(setFilter({ limit, ts, search, filterProperty, activeData }));
  }, [limit, ts, search, filterProperty, activeData])


  useEffect(() => {
    const delay = 1000;
    let timeoutId;

    if (search) {
      timeoutId = setTimeout(() => {
        getOrders({ page: 1, limit, value: search, filterProperty })
        setTs(limit)
        setPage(1);
      }, delay);
    }
    else {
      getOrders({ page: 1, limit, filterProperty })
      setTs(limit)
      setPage(1);
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [search]);

  useEffect(() => {
    getOrderApi()
    getOrders({ page, limit, value: search, filterProperty })
  }, []);

  const subQuery = (prop = {}) => {
    let creationDateStart = get(prop, 'CreationDate.start', {})
    let creationDateEnd = get(prop, 'CreationDate.end', {})
    let docDateStart = get(prop, 'DocDate.start', {})
    let docDateEnd = get(prop, 'DocDate.end', {})

    let salesPerson = get(prop, 'SalesPerson', [])
    let status = get(prop, 'Status', [])
    let warehouseCode = get(prop, 'WarehouseCode', '')

    let list = [
      { name: 'creationDateStart', data: creationDateStart },
      { name: 'creationDateEnd', data: creationDateEnd },
      { name: 'docDateStart', data: docDateStart },
      { name: 'docDateEnd', data: docDateEnd },
      { name: 'salesPerson', data: salesPerson },
      { name: 'status', data: status },
      { name: 'warehouseCode', data: warehouseCode },
    ].filter(item => get(item, 'data', '').length)
    return {
      link: list.map(item => {
        return `&${get(item, 'name', '')}=${get(item, 'data', '')}`
      }).join(''), status: list.length
    }
  }

  const getOrders = (pagination) => {
    setLoading(true)
    let { link } = subQuery(get(pagination, 'filterProperty', {}))
    axios
      .get(
        url + `/api/returns?offset=${get(pagination, 'page', 1)}&type=${userType}&limit=${get(pagination, 'limit', limit)}&search=${get(pagination, 'value', '').toLowerCase()}` + link,
      )
      .then(({ data }) => {
        setLoading(false)
        setMainData(get(data, 'value', []).filter(item => !get(item, 'filter')))
        setFilterData(get(data, 'value', []).find(item => get(item, 'filter')))
        setAllPageLength(get(data, 'value[0].LENGTH', 0))
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
        url + `/api/draft/return/${doc}`,
      )
      .then(({ data }) => {
        setMainData(mainData.filter(item => item.DocEntry != doc))
        setAllPageLength(allPageLength - 1)
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

  const invoice = (doc) => {
    setDropdownOpen(false);
    setUpdateLoading(true)
    let body = mainData.find(item => item.DocEntry === doc)
    if (!body) {
      errorNotify('Body mavjud emas')
      return
    }
    axios
      .post(
        url + `/b1s/v1/CreditNotes`,
        { ...get(body, 'schema', {}), "DocType": "dDocument_Items", "DocObjectCode": "oCreditNotes", },
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
        axios
          .delete(
            url + `/api/draft/return/${doc}`,
          )
          .then(({ data }) => {
            setUpdateLoading(false)
            successNotify('Muvaffaqiyatli amalaga oshirildi')
            setMainData(mainData.filter(item => item.DocEntry !== doc))
            setActiveData(0)
            return
          })
          .catch(err => {
            errorNotify("O'chirishda Xatolik yuz berdi  'A/R Credit Memo' ")
            setUpdateLoading(false)
          });
      })
      .catch(err => {
        if (get(err, 'response.status') == 401) {
          navigate('/login')
          return
        }
        errorRef.current?.open(get(err, 'response.data.error.message.value', 'Ошибка') + " order");
        setUpdateLoading(false)
      });
  }

  const handleSelect = (status, docEntry, isDraft = false) => {
    let handleFn = {
      7: {
        name: 'удалить',
        fn: () => deleteDraft
      },
      8: {
        name: 'архивировать',
        fn: () => invoice
      }
    };
    if (handleFn[status]) {
      confirmRef.current?.open(`Вы уверены, что хотите это ${handleFn[status].name} ? `, handleFn[status].fn, docEntry);
      return
    }
  };
  const statusChange = () => setFnState(true)

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

  const filterOrders = () => {
    filterRef.current?.open(filterData);
  }


  return (
    <>
      <Style>
        <Layout>
          <div className='container'>
            <div className='head'>
              <div className='left-head'>
                <h3 className='left-title'>Возвраты</h3>
              </div>
              <div className='right-head'>

                <div className='right-pagination'>
                  <p className='pagination-text'><span>{page}-{ts}</span> <span>of {allPageLength}</span> </p>
                  <button onClick={() => {
                    if (page > 1) {
                      getOrders({ page: page - limit, limit, value: search, filterProperty })
                      setPage(page - limit);
                      setTs(ts - limit)
                      setSelect([])
                    }
                  }} disabled={page == 1} className={`pagination-button left-pagination ${page == 1 ? 'opcity-5' : ''}`}>
                    <img src={pagination} alt="arrow-button-pagination" />
                  </button>

                  <button onClick={() => {
                    if (ts < allPageLength) {
                      getOrders({ page: page + limit, limit, value: search, filterProperty })
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

                <div style={{ position: 'relative' }}>
                  {
                    (get(subQuery(filterProperty), 'status') && get(filterProperty, 'click')) ? (
                      <button onClick={() => {
                        setFilterProperty({ clear: true })
                        getOrders({ page: 1, limit, value: search })
                        setPage(1)
                        setTs(limit)
                      }} className={`close-btn`}>
                        <img src={close} alt="close-filter" />
                      </button>
                    ) : ''
                  }

                  <button onClick={filterOrders} className='right-filter'>
                    <img className='right-filter-img' src={filterImg} alt="filter-img" />
                  </button>
                </div>

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
                            getOrders({ page: 1, limit: item, value: search, filterProperty })
                            setSelect([])
                            setMainCheck(false)
                          }
                          return
                        }} className={`dropdown-li ${limit == item ? 'dropdown-active' : ''}`}><a className="dropdown-item" href="#">{item}</a></li>)
                      })
                    }
                  </ul>
                </div>


                <button onClick={() => navigate('/return-manage')} className='btn-head'>
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
                  <li className='table-head-item w-50'>Менеджер</li>
                  <li className='table-head-item w-50'>Дата заказа</li>
                  <li className='table-head-item w-50'>Дата создания</li>
                  <li className='table-head-item w-70'>Сумма сделки</li>
                  <li className='table-head-item w-70'>Склад</li>
                  <li className='table-head-item w-70'>Куб / Брутто</li>
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
                                      setSelect([i + 1])
                                    }
                                  }} type="checkbox" name="checkbox" />
                                  <p className='table-body-text truncated-text ' style={{ width: '200px' }} title={get(item, 'CardName', '')} onClick={() => setActiveData(activeData === i + 1 ? 0 : (i + 1))}>
                                    {get(item, 'CardName', '')}
                                  </p>
                                </div>
                                <div className='w-50 p-16' onClick={() => setActiveData(activeData === i + 1 ? 0 : (i + 1))}>
                                  <p className='table-body-text'>
                                    {get(item, 'SlpName', '')}
                                  </p>
                                </div>
                                <div className='w-50 p-16' onClick={() => setActiveData(activeData === i + 1 ? 0 : (i + 1))}>
                                  <p className='table-body-text '>
                                    {moment(get(item, 'DocDate', '')).format("DD-MM-YYYY")}
                                  </p>
                                </div>
                                <div className='w-50 p-16' onClick={() => setActiveData(activeData === i + 1 ? 0 : (i + 1))}>
                                  <p className='table-body-text '>
                                    {moment(get(item, 'CreateDate', '')).format("DD-MM-YYYY")}
                                  </p>
                                </div>
                                <div className='w-70 p-16' onClick={() => setActiveData(activeData === i + 1 ? 0 : (i + 1))}>
                                  <p className='table-body-text w-70'>
                                    {formatterCurrency(Number(get(item, 'DocTotal', 0)), 'USD')}
                                  </p>
                                </div>
                                <div className='w-70 p-16' onClick={() => setActiveData(activeData === i + 1 ? 0 : (i + 1))}>
                                  <p className='table-body-text w-70'>
                                    {get(item, 'WhsCode', '-')}
                                  </p>
                                </div>
                                <div className='w-70 p-16' onClick={() => setActiveData(activeData === i + 1 ? 0 : (i + 1))}>
                                  <p className='table-body-text w-70'>
                                    {parseFloat(Number(get(item, 'KUB', '-')).toFixed(2))} / {parseFloat(Number(get(item, 'BRUTTO', '-')).toFixed(2))}
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
                                  <Link className='table-item-text d-flex align' to={`/return-manage/${item.DocEntry}/draft`}>Просмотреть и изменить заказ  <img src={editIcon} alt="arrow right" /></Link>
                                </button>
                                {/* invoice */}
                                <div className="dropdown-container" >
                                  <button onClick={() => {
                                    setInvoiceDropDown(!invoiceDropDown)
                                    setDropdownOpen(false)
                                  }} style={{ width: '110px' }} className='table-item-btn d-flex align table-item-text position-relative'>
                                    Накладный <img src={editIcon} alt="arrow-right" />
                                  </button>
                                  {(invoiceDropDown) && (
                                    <ul className="dropdown-menu">
                                      {['N1 Накладная', 'N2 Накладная'].map((status, i) => (
                                        <li key={i} className={`dropdown-li`}>
                                          <Link to={(`/return-invoice/${item.DocEntry}/draft/${i === 0 ? 'total' : ''}`)} className="dropdown-item display-b" href="#">
                                            {status}
                                          </Link>
                                        </li>
                                      ))}

                                    </ul>
                                  )}
                                </div>
                                <div className="dropdown-container">
                                  <button style={{ width: '110px' }} disabled={updateLoading} className="table-item-btn d-flex align table-item-text position-relative" onClick={() => {
                                    setDropdownOpen(!dropdownOpen)
                                    setInvoiceDropDown(false)
                                  }}>
                                    Состояние  {updateLoading ?
                                      <div className="spinner-border" role="status">
                                        <span className="sr-only">Loading...</span>
                                      </div>
                                      : <img style={{ marginLeft: '6px' }} src={editIcon} alt="arrow-right" />}
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
                    <p className='footer-text'>Куб : <span className='footer-text-spn'>{Number(get(mainData, '[0].ALLKUB', 0)).toFixed(4)}</span></p>
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
        <FilterOrderModal
          getRef={filterModalRef}
          filterProperty={filterProperty}
          setFilterProperty={setFilterProperty}
          getOrders={getOrders}
          arg={{ page: 1, limit, value: search }}
          setPage={setPage}
          setTs={setTs}
        />
        <ErrorModal
          getRef={getErrorRef}
          title={'Ошибка'}
        />
      </>
    </>
  );
};

export default Return;
