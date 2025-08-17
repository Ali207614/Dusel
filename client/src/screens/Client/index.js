import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Style from './Style';
import Layout from '../../components/Layout';
import { useTranslation } from 'react-i18next';

import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import searchImg from '../../assets/images/search-normal.svg';
import rightArrow from '../../assets/images/right-arrow.png';
import filterImg from '../../assets/images/filter-search.svg';
import arrowDown from '../../assets/images/arrow-down.svg';
import pagination from '../../assets/images/pagination.svg';
import editIcon from '../../assets/images/edit-icon.svg';
import close from '../../assets/images/Close-filter.svg';
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



const Client = () => {
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
        url + `/api/customer?offset=${get(pagination, 'page', 1)}&type=${userType}&limit=${get(pagination, 'limit', limit)}&search=${get(pagination, 'value', '').toLowerCase()}` + link,
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
                <h3 className='left-title'>Клеинты</h3>
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
                  <li className='table-head-item d-flex align w-50'>
                    Контрагент
                  </li>
                  <li className='table-head-item w-50'>Телефон 1</li>
                  <li className='table-head-item w-50'>Телефон 2</li>
                  <li className='table-head-item w-50'>Баланcе</li>
                  <li className='table-head-item w-50'>Группа</li>
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
                                <div className='d-flex align  w-50 p-16'>
                                  <p className='table-body-text truncated-text d-flex align' title={get(item, 'CardName', '')} onClick={() => setActiveData(activeData === i + 1 ? 0 : (i + 1))}>
                                    <button className='clientBtn'>
                                      <img src={rightArrow} className='clientImg' alt="open create modal" />
                                    </button> {get(item, 'CardName', '')}
                                  </p>
                                </div>
                                <div className='w-50 p-16' onClick={() => setActiveData(activeData === i + 1 ? 0 : (i + 1))}>
                                  <p className='table-body-text'>
                                    {get(item, 'Phone1', '') || '-'}
                                  </p>
                                </div>
                                <div className='w-50 p-16' onClick={() => setActiveData(activeData === i + 1 ? 0 : (i + 1))}>
                                  <p className='table-body-text'>
                                    {get(item, 'Phone2', '') || '-'}
                                  </p>
                                </div>
                                <div className='w-50 p-16' onClick={() => setActiveData(activeData === i + 1 ? 0 : (i + 1))}>
                                  <p className='table-body-text'>
                                    {formatterCurrency(Number(get(item, 'Balance', 0)), 'USD')}
                                  </p>
                                </div>
                                <div className='w-50 p-16' onClick={() => setActiveData(activeData === i + 1 ? 0 : (i + 1))}>
                                  <p className='table-body-text'>
                                    {get(item, 'GroupName', '-') || '-'}
                                  </p>
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

export default Client;
