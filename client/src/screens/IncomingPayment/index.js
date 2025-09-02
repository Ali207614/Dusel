import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Style from './Style';
import Layout from '../../components/Layout';
import { useTranslation } from 'react-i18next';

import rightArrow from '../../assets/images/right-arrow.png';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import searchImg from '../../assets/images/search-normal.svg';
import filterImg from '../../assets/images/filter-search.svg';
import arrowDown from '../../assets/images/arrow-down.svg';
import pagination from '../../assets/images/pagination.svg';
import editIcon from '../../assets/images/edit-icon.svg';
import close from '../../assets/images/Close-filter.svg';
import { get } from 'lodash';
import formatterCurrency from '../../helpers/currency';
import moment from 'moment';
import { FadeLoader } from "react-spinners";
import { ConfirmModal, ErrorModal, ConfirmModalOrder, FilterOrderModal, FilterIncomingPayment, BusinessPartner } from '../../components/Modal';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { errorNotify, successNotify, warningNotify, limitList, override, statuses } from '../../components/Helper';
import { main } from '../../store/slices';

let url = process.env.REACT_APP_API_URL



const IncomingPayment = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { setFilter } = main.actions;
  const { getMe, getFilter, userType, accounts } = useSelector(state => state.main);

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
      getOrders({ page: 1, limit, filterProperty, value: search })
      setTs(limit)
      setPage(1);
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [search]);

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
        url + `/api/payments?offset=${get(pagination, 'page', 1)}&accounts=${accounts.map(el => Object.values(el)[0])}&type=${userType}&limit=${get(pagination, 'limit', limit)}&search=${get(pagination, 'value', '').toLowerCase()}` + link,
      )
      .then(({ data }) => {
        setLoading(false)
        setMainData(get(data, 'value', []).filter(item => !get(item, 'filter')))
        setFilterData(get(data, 'value', []).find(item => get(item, 'filter')))
        setAllPageLength(get(data, 'value[0].LENGTH', 0))
        setSelect([])
      })
      .catch(err => {
        setLoading(false)
        errorNotify("Malumot yuklashda xatolik yuz berdi")
      });

    return;
  };

  const cancelOrder = (doc) => {
    setDropdownOpen(false);
    setUpdateLoading(true)
    axios
      .post(
        url + `/b1s/v1/JournalEntries(${doc})/Cancel`,
        {},
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
        setActiveData(0)
        setMainData([...mainData.filter(item => item.TransId != doc)])
        setAllPageLength(allPageLength - 1)
        successNotify("Malumot muvaffaqiyatli bekor qilindi")
      })
      .catch(err => {
        if (get(err, 'response.status') == 401) {
          navigate('/login')
          return
        }
        errorRef.current?.open(get(err, 'response.data.error.message.value', 'Ошибка'));
        setUpdateLoading(false)
      });
  }

  const handleSelect = (status, docEntry) => {
    let handleFn = {
      6: {
        name: 'отменить',
        fn: () => cancelOrder
      },
    };
    if (handleFn[status]) {
      confirmRef.current?.open(`Вы уверены, что хотите это ${handleFn[status].name} ? `, handleFn[status].fn, docEntry);
      return
    }
  };

  const statusChange = () => setFnState(true)

  const businessRef = useRef();

  const businessModalRef = useCallback(ref => {
    businessRef.current = ref;
  }, []);

  const filterOrders = () => {
    filterRef.current?.open(filterData);
  }


  return (
    <>

      <Style>
        <Layout>
          <div className='container'>
            <div className='head'>
              <div className='left-head d-flex align'>
                <h3 className='left-title'>Оплата</h3>
              </div>
              <div className='right-head'>

                <div className='right-pagination'>
                  <p className='pagination-text'><span>{page}-{ts}</span> <span>of {allPageLength}</span> </p>
                  <button onClick={() => {
                    if (page > 1) {
                      getOrders({ page: page - limit, limit, value: search, filterProperty })
                      setPage(page - limit);
                      setTs(ts - limit)
                    }
                  }} disabled={page == 1} className={`pagination-button left-pagination ${page == 1 ? 'opcity-5' : ''}`}>
                    <img src={pagination} alt="arrow-button-pagination" />
                  </button>

                  <button onClick={() => {
                    if (ts < allPageLength) {
                      getOrders({ page: page + limit, limit, value: search, filterProperty })
                      setPage(page + limit)
                      setTs(limit + ts)
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
                            setMainCheck(false)
                          }
                          return
                        }} className={`dropdown-li ${limit == item ? 'dropdown-active' : ''}`}><a className="dropdown-item" href="#">{item}</a></li>)
                      })
                    }
                  </ul>
                </div>


                <button onClick={() => navigate('/payment-add')} className='btn-head'>
                  Добавить
                </button>
              </div>
            </div>
            <div className='table'>
              <div className='table-head'>
                <ul className='table-head-list d-flex align  justify'>
                  <li className='table-head-item w-70'>
                    Код контрагента
                  </li>
                  <li className='table-head-item '>Название контрагента</li>
                  <li className='table-head-item w-70'>Дата регистрации</li>
                  <li className='table-head-item w-70'>Сумма по кредиту</li>
                  <li className='table-head-item w-70'>Описание по строке</li>
                </ul>
              </div>
              <div className='table-body'>
                {
                  !loading ? (
                    <ul className='table-body-list'>
                      {
                        mainData.map((item, i) => {
                          return (
                            <li key={i} className={`table-body-item ${activeData === (i + 1) ? 'active-table' : ''}`}>
                              <div className='table-item-head d-flex align  justify'>
                                <div className='d-flex align  w-70 p-16' onClick={() => setActiveData(activeData === i + 1 ? 0 : (i + 1))}>
                                  <p className='table-body-text truncated-text d-flex align '>
                                    {get(item, 'CardCode', '')}
                                  </p>
                                </div>
                                <div className='d-flex align  w-100 p-16' onClick={() => setActiveData(activeData === i + 1 ? 0 : (i + 1))}>
                                  <p className='table-body-text truncated-text d-flex align ' style={{ width: '200px' }} title={get(item, 'CardName', '')}>
                                    {get(item, 'CardName', '')}
                                  </p>
                                </div>
                                <div className='w-70 p-16' onClick={() => setActiveData(activeData === i + 1 ? 0 : (i + 1))} >
                                  <p className='table-body-text '>
                                    {moment(get(item, 'RefDate', '')).format("DD-MM-YYYY")}
                                  </p>
                                </div>
                                <div className='w-70 p-16' onClick={() => setActiveData(activeData === i + 1 ? 0 : (i + 1))}>
                                  <p className='table-body-text w-70'>
                                    {formatterCurrency(Number(get(item, 'Credit', 0)), (get(item, 'DocCur', 'USD') || 'USD'))}
                                  </p>
                                </div>
                                <div className='w-70 p-16' onClick={() => setActiveData(activeData === i + 1 ? 0 : (i + 1))}>
                                  <p className='table-body-text '>
                                    {get(item, 'LineMemo', '')}
                                  </p>
                                </div>
                              </div>
                              <div className='table-item-foot d-flex align'>
                                <button disabled={updateLoading} onClick={() => {
                                  handleSelect(6, get(item, 'TransId', 0))
                                }} className='table-item-btn d-flex align table-item-text position-relative'>
                                  Отменить {updateLoading ?
                                    <div className="spinner-border" role="status">
                                      <span className="sr-only">Loading...</span>
                                    </div>
                                    : <img style={{ marginLeft: '6px' }} src={editIcon} alt="arrow-right" />}
                                </button>
                                <button className='table-item-btn d-flex align'>
                                  <Link className='table-item-text d-flex align' to={(`/payment-add/${item.TransId}`)}>Просмотреть <img src={editIcon} alt="arrow right" /></Link>
                                </button>
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
        <FilterIncomingPayment
          getRef={filterModalRef}
          filterProperty={filterProperty}
          setFilterProperty={setFilterProperty}
          getOrders={getOrders}
          arg={{ page: 1, limit, value: search }}
          setPage={setPage}
          setTs={setTs}
        />
        <BusinessPartner
          getRef={businessModalRef}
        />
        <ErrorModal
          getRef={getErrorRef}
          title={'Ошибка'}
        />
      </>
    </>
  );
};

export default IncomingPayment;
