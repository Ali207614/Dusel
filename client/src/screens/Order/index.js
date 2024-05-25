import React, { useEffect, useState, useRef, useCallback } from 'react';
import Layout from '../../components/Layout';
import { useParams } from 'react-router-dom';
import Style from './Style';
import { useNavigate } from 'react-router-dom';
import searchImg from '../../assets/images/search-normal.svg';
import filterImg from '../../assets/images/filter-search.svg';
import arrowDown from '../../assets/images/arrow-down.svg';
import pagination from '../../assets/images/pagination.svg';
import tickSquare from '../../assets/images/tick-square.svg';
import add from '../../assets/images/add.svg';
import axios from 'axios';
import { get, isNumber } from 'lodash';
import formatterCurrency from '../../helpers/currency';
import { FadeLoader } from "react-spinners";
import LazyLoad from "react-lazyload";
import { ErrorModal, ConfirmModal } from '../../components/Modal';
import { Spinner } from '../../components';
import { useSelector } from 'react-redux';
import { FixedSizeList as List } from 'react-window';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import 'react-resizable/css/styles.css';
import Resizable from './Resizable';
import moment from 'moment';

let url = process.env.REACT_APP_API_URL
let limitList = [1, 10, 50, 100, 500, 1000]
let warehouseList = ['BAZA1', 'BAZA2', 'LYUSTRA', 'YANGI']
const override = {
  position: "absolute",
  left: "50%",
  top: "50%",
};

const Order = () => {
  const { getMe } = useSelector(state => state.main);

  let { id } = useParams();
  const navigate = useNavigate();
  let [color, setColor] = useState("#3C3F47");
  const [showDropdown, setShowDropdown] = useState(false);
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [allPageLength, setAllPageLength] = useState(0);
  const [ts, setTs] = useState(10);
  const [loading, setLoading] = useState(false)
  const [mainData, setMainData] = useState([])
  const [search, setSearch] = useState('')
  const [state, setState] = useState([])
  const [allPageLengthSelect, setAllPageLengthSelect] = useState(state.length);
  const [actualData, setActualData] = useState([])
  const [isEmpty, setIsEmpty] = useState(false)
  const [customer, setCustomer] = useState('')
  const [customerCode, setCustomerCode] = useState('')
  const [customerData, setCustomerData] = useState([])
  const [orderLoading, setOrderLoading] = useState(false)
  const [date, setDate] = useState({ DocDate: moment().format("YYYY-MM-DD"), DocDueDate: moment().format("YYYY-MM-DD") })
  const [limitSelect, setLimitSelect] = useState(10);
  const [pageSelect, setPageSelect] = useState(1);
  const [tsSelect, setTsSelect] = useState(10);
  const [docEntry, setDocEntry] = useState({
    id,
    status: false
  });


  const [showDropDownWarehouse, setShowDropdownWarehouse] = useState(false)
  const [warehouse, setWarehouse] = useState('BAZA1')

  const errorRef = useRef();
  const confirmRef = useRef();

  const getErrorRef = useCallback(ref => {
    errorRef.current = ref;
  }, []);
  const confirmModalRef = useCallback(ref => {
    confirmRef.current = ref;
  }, []);

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

  const successNotify = () => toast.success("Ma'lumot muvaffaqiyatli qo'shildi", {
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
        getItems({ page: 1, limit, value: search, warehouse })
        setTs(limit)
        setPage(1);
      }, delay);
    }
    else {
      getItems({ page: 1, limit })
      setTs(limit)
      setPage(1);
    }
    return () => {
      clearTimeout(timeoutId);
    };
  }, [search]);

  useEffect(() => {
    const delay = 1000;
    let timeoutId;
    if (customer.length && !customerCode) {
      timeoutId = setTimeout(() => {
        getCustomer({ customer })
      }, delay);
    }
    else {
      setCustomerData([])
    }
    return () => {
      clearTimeout(timeoutId);
    };
  }, [customer]);

  const handleChange = e => {
    const newSearchTerm = e.target.value;
    setSearch(newSearchTerm);
  };

  const getCustomer = (customerDataObj) => {
    axios
      .get(
        url + `/api/customer?search=${get(customerDataObj, 'customer', '').toLowerCase()}`,
      )
      .then(({ data }) => {
        setCustomerData(
          get(data, 'value', [])
        )
      })
      .catch(err => {
        errorNotify("Mijozlarni yuklashda muommo yuzaga keldi")
      });

    return;
  };

  const getOrderByDocEntry = (doc) => {
    return axios
      .get(
        url + `/api/order?docEntry=${doc}`,
      )
      .then(({ data }) => {
        return data
      })
      .catch(err => {
        setLoading(false)
        errorNotify("Buyurtmani yuklashda muommo yuzaga keldi")
      });

    return;
  };

  const getItems = (pagination) => {
    setLoading(true)
    axios
      .get(
        url + `/api/items?offset=${get(pagination, 'page', 1)}&limit=${get(pagination, 'limit', limit)}&whsCode=${get(pagination, 'warehouse', warehouse)}&search=${get(pagination, 'value', '').toLowerCase()}&items=${state.map(item => `'${item.ItemCode}'`)}`,
      )
      .then(({ data }) => {
        if (get(docEntry, 'id', 0) && !get(docEntry, 'status')) {
          getOrderByDocEntry(get(docEntry, 'id', 0)).then(orderData => {
            setDocEntry({ ...docEntry, status: true })
            orderData = get(orderData, 'value', [])
            setLoading(false)
            setCustomer(get(orderData, '[0].CardName', ''))
            setCustomerCode(get(orderData, '[0].CardCode', ''))
            setDate({
              DocDate: moment(get(orderData, '[0].DocDate', '')).format("YYYY-MM-DD"),
              DocDueDate: moment(get(orderData, '[0].DocDueDate', '')).format("YYYY-MM-DD")
            })
            setWarehouse(get(orderData, '[0].WhsCode'))
            setAllPageLengthSelect(orderData.length)
            setAllPageLength(get(data, 'value[0].LENGTH', 0) - orderData.length)

            setMainData(get(data, 'value', []).map(item => {
              return { ...item, value: '', karobka: '' }
            }).filter(el => !orderData.map(item => item.ItemCode).includes(get(el, 'ItemCode'))))

            setState(orderData.map(item => {
              return { ...item, value: Number(item.Quantity) }
            }))
            setActualData(orderData.map(item => {
              return { ...item, value: Number(item.Quantity) }
            }))
          })
        }
        else {
          setLoading(false)
          setMainData(get(data, 'value', []).map(item => {
            return { ...item, value: '', karobka: '' }
          }))
          setAllPageLength(get(data, 'value[0].LENGTH', 0))
        }

      })
      .catch(err => {
        setLoading(false)
        errorNotify("Tovarlarni yuklashda muommo yuzaga keldi")
      });

    return;
  };


  const addState = (item) => {
    setAllPageLengthSelect(allPageLengthSelect + 1)
    setAllPageLength(allPageLength - 1)
    setMainData(mainData.filter(el => get(el, 'ItemCode', '') !== get(item, 'ItemCode', '')))
    setState([item, ...state])
    setActualData([item, ...state])
  }



  const changeValue = (value, itemCode) => {
    let index = mainData.findIndex(el => get(el, 'ItemCode', '') == itemCode)
    if (index >= 0) {
      mainData[index].value = value
      setMainData([...mainData])
    }
  }

  const changeKarobka = (value, itemCode) => {
    let index = mainData.findIndex(el => get(el, 'ItemCode', '') == itemCode)
    if (index >= 0) {
      mainData[index].karobka = value
      setMainData([...mainData])
    }
  }

  const postOrder = () => {
    if (!customerCode) {
      warningNotify("Customer tanlanmagan")
      return
    }
    if (!get(date, 'DocDate', '')) {
      warningNotify("Sana tanlanmagan")
      return
    }
    if (!get(date, "DocDueDate", '')) {
      warningNotify("Sana tanlanmagan")
      return
    }
    if (actualData.length == 0) {
      warningNotify("Ma'lumot mavjud emas")
      return
    }
    if (actualData.find(item => item.value.length == 0)) {
      warningNotify("Miqdor yozilmagan")
      setIsEmpty(true)
      return
    }
    if (actualData.find(item => {
      let free = Number(get(item, 'OnHand', '')) - Number(get(item, 'IsCommited', ''))
      if (free < Number(item.value.trim())) {
        return true
      }
    })) {
      warningNotify("Miqdor ko'p")
      return
    }
    setIsEmpty(false)
    confirmRef.current?.open(`Вы уверены, что хотите это ${get(docEntry, 'id', 0) ? 'обновить' : 'добавить'} ? `);
  }

  const Orders = () => {
    setOrderLoading(true)
    let body = {
      "CardCode": customerCode,
      "DocDate": get(date, 'DocDate'),
      "DocDueDate": get(date, 'DocDueDate'),
      "DocumentLines": state.map(item => {
        return {
          "ItemCode": get(item, 'ItemCode', ''),
          "Quantity": Number(get(item, 'value', 0)),
          "WarehouseCode": warehouse
        }
      })
    }
    axios
      .post(
        url + `/b1s/v1/Orders`,
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
        successNotify()
        setMainData([...state, ...mainData].map(item => {
          return { ...item, value: '' }
        }))
        setState([])
        setActualData([])
        setAllPageLength(allPageLength + state.length)
        setAllPageLengthSelect(0)
        setLimitSelect(10)
        setPageSelect(1)
        setTsSelect(10)
      })
      .catch(err => {
        if (get(err, 'response.status') == 401) {
          navigate('/login')
          return
        }
        setOrderLoading(false)
        errorRef.current?.open(get(err, 'response.data.error.message.value', 'Ошибка'));
      });

    return;
  };



  return (
    <>
      <Style>
        <Layout>

          <div className='container'>
            <div className="order-head">
              <div className="order-main d-flex align justify">
                <button onClick={() => navigate('/home')} className='btn-back'>Закрить</button>
                <button onClick={postOrder} className={`btn-head position-relative`}>
                  {orderLoading ? <Spinner /> : (get(docEntry, 'id', 0) ? 'Обновить' : 'Добавить')}
                </button>
              </div>
              <div className="order-head-data d-flex align justify">
                <div className='w-100 position-relative' >
                  <input onChange={(e) => {
                    setCustomer(e.target.value)
                    setCustomerCode('')
                  }} value={customer} type="search" className='order-inp' placeholder='Customer' />
                  {(customerData.length) ? (
                    <ul className="dropdown-menu" style={{ top: '49px', zIndex: 1 }}>
                      {customerData.map((customerItem, i) => (
                        <li onClick={() => {
                          setCustomer(get(customerItem, 'CardName', ''))
                          setCustomerCode(get(customerItem, 'CardCode', ''))
                          setCustomerData([])
                        }} key={i} className={`dropdown-li`}><a className="dropdown-item" href="#">
                            {get(customerItem, 'CardCode', '') || '-'} - {get(customerItem, 'CardName', '') || '-'}
                          </a></li>
                      ))}
                    </ul>
                  ) : ''}
                </div>
                <div className='w-100'>
                  <input value={get(date, 'DocDate', '')} onChange={(e) => setDate({ ...date, DocDate: e.target.value })} type="date" className='order-inp' placeholder='Doc Date' />
                </div>
                <div className='w-100'>
                  <input value={get(date, 'DocDueDate', '')} onChange={(e) => setDate({ ...date, DocDueDate: e.target.value })} type="date" className='order-inp' placeholder='Due Date' />
                </div>
              </div>

              <div className='d-flex align justify'>
                <div className='right-limit'>
                  <button style={{ width: "110px" }} onClick={() => setShowDropdownWarehouse(!showDropDownWarehouse)} className='right-dropdown'>
                    <p className='right-limit-text'>{warehouse}</p>
                    <img src={arrowDown} className={showDropDownWarehouse ? "up-arrow" : ""} alt="arrow-down-img" />
                  </button>
                  <ul style={{ zIndex: 0 }} className={`dropdown-menu  ${showDropDownWarehouse ? "display-b" : "display-n"}`} aria-labelledby="dropdownMenuButton1">
                    {
                      warehouseList.map((item, i) => {
                        return (<li key={i} onClick={() => {
                          if (warehouse != item) {
                            setWarehouse(item);
                            setShowDropdownWarehouse(false)
                            getItems({ page, limit, value: search, warehouse: item })
                          }
                          return
                        }} className={`dropdown-li ${warehouse == item ? 'dropdown-active' : ''}`}><a className="dropdown-item" href="#">{item}</a></li>)
                      })
                    }
                  </ul>
                </div>
                <div className='right-head order-head-filter'>
                  <div className='right-pagination'>
                    <p className='pagination-text'><span>{page}-{ts}</span> <span>of {allPageLength}</span> </p>
                    <button onClick={() => {
                      if (page > 1) {
                        getItems({ page: page - limit, limit, value: search, warehouse })
                        setPage(page - limit);
                        setTs(ts - limit)
                      }
                    }} disabled={page == 1} className={`pagination-button left-pagination ${page == 1 ? 'opcity-5' : ''}`}>
                      <img src={pagination} alt="arrow-button-pagination" />
                    </button>

                    <button onClick={() => {
                      if (ts < allPageLength) {
                        getItems({ page: page + limit, limit, value: search, warehouse })
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
                              getItems({ page: 1, limit: item, value: search, warehouse })
                            }
                            return
                          }} className={`dropdown-li ${limit == item ? 'dropdown-active' : ''}`}><a className="dropdown-item" href="#">{item}</a></li>)
                        })
                      }
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className='table'>
              <div className='table-head'>
                <ul className='table-head-list d-flex align  justify'>
                  <li className='table-head-item w-50'>
                    Код
                  </li>
                  <li className='table-head-item'>Продукция/Производитель</li>
                  <li className='table-head-item'>Модел</li>
                  <li className='table-head-item'>Netto / Brutto</li>
                  <li className='table-head-item'>Цена</li>
                  <li className='table-head-item'>Остаток</li>
                  <li className='table-head-item'>Количество</li>
                  <li className='table-head-item'>В кейсе</li>
                  <li className='table-head-item w-47px'>
                    <button onClick={() => {
                      console.log(mainData)
                      let filterData = mainData.filter(el => {
                        let free = Number(get(el, 'OnHand', '')) - Number(get(el, 'IsCommited', ''))
                        return el.value.trim().length > 0 && (free >= Number(el.value.trim()))
                      })
                      if (filterData.length) {
                        setAllPageLengthSelect(allPageLengthSelect + filterData.length)
                        setAllPageLength(allPageLength - filterData.length)
                        setMainData(mainData.filter(el => !filterData.map(item => item.ItemCode).includes(el.ItemCode)))
                        setState([...filterData, ...state])
                        setActualData([...filterData, ...state])
                      }

                    }} className='table-head-check-btn'>
                      <img src={tickSquare} alt="tick" />
                    </button>
                  </li>
                </ul>
              </div>
              <div className='table-body'>
                {
                  !loading ? (
                    <ul className='table-body-list'>
                      {
                        mainData.map((item, i) => {
                          return (
                            <LazyLoad height={65} once>
                              <li key={i} className={`table-body-item`}>
                                <div className='table-item-head d-flex align  justify'>
                                  <div className='w-50 p-16'>
                                    <p className='table-body-text' >
                                      {get(item, 'ItemCode', '')}
                                    </p>
                                  </div>
                                  <div className='w-100 p-16' >
                                    <p className='table-body-text truncated-text' title={get(item, 'ItemName', '')}>
                                      {get(item, 'ItemName', '') || '-'}
                                    </p>
                                  </div>
                                  <div className='w-100 p-16' >
                                    <p className='table-body-text truncated-text' title={get(item, 'ItemName', '')}>
                                      {get(item, 'U_model', '-') || '-'}
                                    </p>
                                  </div>
                                  <div className='w-100 p-16' >
                                    <p className='table-body-text truncated-text' title={get(item, 'ItemName', '')}>
                                      {Number(get(item, 'U_U_netto', '-')) || '-'} / {Number(get(item, 'U_U_brutto', '-')) || '-'}
                                    </p>
                                  </div>
                                  <div className='w-100 p-16' >
                                    <p className='table-body-text'>
                                      {formatterCurrency(Number(get(item, 'Price', 0)), get(item, 'Currency', "USD") || 'USD')}
                                    </p>
                                  </div>
                                  <div className='w-100 p-16' >
                                    <p className='table-body-text '>
                                      {Number(get(item, 'OnHand', ''))} / <span className='isCommited'>{Number(get(item, 'OnHand', '')) - Number(get(item, 'IsCommited', ''))}</span>
                                    </p>
                                  </div>
                                  <div className='w-100 p-16' >
                                    <p className='table-body-text '>
                                      <input value={get(item, 'value', '')} onChange={(e) => {
                                        changeValue(e.target.value, get(item, 'ItemCode', ''))
                                        changeKarobka((e.target.value ? (Math.floor(e.target.value / Number(get(item, 'U_Karobka', 1) || 1))).toString() : ''), get(item, 'ItemCode', ''))
                                      }} type="text" className='table-body-inp' placeholder='-' />
                                    </p>
                                  </div>
                                  <div className='w-100 p-16' >
                                    <p className='table-body-text '>
                                      <input value={get(item, 'karobka', '')} onChange={(e) => {
                                        changeKarobka(e.target.value, get(item, 'ItemCode', ''))
                                        changeValue((e.target.value ? ((e.target.value || 1) * Number(get(item, 'U_Karobka', 1) || 1)).toString() : ''), get(item, 'ItemCode', ''))
                                      }} type="text" className='table-body-inp' placeholder={`${Number(get(item, 'U_Karobka', 1) || 1)} / кор`} />
                                    </p>
                                  </div>
                                  <div className='w-47px p-16' >
                                    <button
                                      disabled={
                                        Number(get(item, 'OnHand', '')) <= 0 ? true : (Number(get(item, 'OnHand', '')) - Number(get(item, 'IsCommited', ''))) < Number(get(item, 'value', 0))
                                      }
                                      onClick={() => addState(item)}
                                      className={`table-body-text table-head-check-btn ${Number(get(item, 'OnHand', '')) <= 0 ? 'opacity-5' : (
                                        (Number(get(item, 'OnHand', '')) - Number(get(item, 'IsCommited', ''))) < Number(get(item, 'value', 0)) ? 'opacity-5' : '2')}`}>
                                      <img src={add} alt="add button" />
                                    </button>
                                  </div>
                                </div>
                              </li>
                            </LazyLoad>
                          )
                        })
                      }
                    </ul>) :
                    <FadeLoader color={color} loading={loading} cssOverride={override} size={100} />
                }
              </div>
            </div>
          </div>

          <Resizable
            state={state}
            setState={setState}
            setAllPageLengthSelect={setAllPageLengthSelect}
            allPageLengthSelect={allPageLengthSelect}
            setMainData={setMainData}
            setAllPageLength={setAllPageLength}
            allPageLength={allPageLength}
            mainData={mainData}
            actualData={actualData}
            setActualData={setActualData}
            isEmpty={isEmpty}
            setIsEmpty={setIsEmpty}
            limitSelect={limitSelect}
            setLimitSelect={setLimitSelect}
            pageSelect={pageSelect}
            setPageSelect={setPageSelect}
            tsSelect={tsSelect}
            setTsSelect={setTsSelect}
          />
        </Layout>
      </Style>
      <>
        <ToastContainer />
        <ErrorModal
          getRef={getErrorRef}
          title={'Ошибка'}
        />
        <ConfirmModal getRef={confirmModalRef} title={"Oshibka"} Orders={Orders} />
      </>
    </>
  );
};

export default Order;