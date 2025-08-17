import React, { useEffect, useState, useRef, useCallback } from 'react';
import Layout from '../../components/Layout';
import { useParams, useLocation } from 'react-router-dom';
import Style from './Style';
import { useNavigate } from 'react-router-dom';
import searchImg from '../../assets/images/search-normal.svg';
import filterImg from '../../assets/images/filter-search.svg';
import arrowDown from '../../assets/images/arrow-down.svg';
import pagination from '../../assets/images/pagination.svg';
import tickSquare from '../../assets/images/tick-square.svg';
import add from '../../assets/images/add.svg';
import close from '../../assets/images/Close-filter.svg';
import axios from 'axios';
import { get, isNumber } from 'lodash';
import formatterCurrency from '../../helpers/currency';
import { FadeLoader } from "react-spinners";
import LazyLoad from "react-lazyload";
import { ErrorModal, ConfirmModal, FilterModal, FilterModalResizable, WarningModal } from '../../components/Modal';
import { Spinner } from '../../components';
import { useSelector } from 'react-redux';
import { FixedSizeList as List } from 'react-window';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { limitList, statuses, errorNotify, warningNotify, successNotify } from '../../components/Helper';
import 'react-resizable/css/styles.css';
import Resizable from './Resizable';
import moment from 'moment';

let url = process.env.REACT_APP_API_URL

const override = {
  position: "absolute",
  left: "50%",
  top: "50%",
};
let returnStatusList = ['Возврат', 'Брак']

const Order = () => {
  const { getMe, userType } = useSelector(state => state.main);

  let { id } = useParams();
  let location = useLocation();
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
  const [actualData, setActualData] = useState([])
  const [allPageLengthSelect, setAllPageLengthSelect] = useState(state.length);
  const [isEmpty, setIsEmpty] = useState(false)
  const [customer, setCustomer] = useState('')
  const [customerCode, setCustomerCode] = useState('')
  const [customerData, setCustomerData] = useState([])
  const [customerDataInvoice, setCustomerDataInvoice] = useState({})
  const [orderLoading, setOrderLoading] = useState(false)
  const [date, setDate] = useState({ DocDate: moment().format("YYYY-MM-DD"), DocDueDate: moment().format("YYYY-MM-DD") })
  const [limitSelect, setLimitSelect] = useState(10);
  const [pageSelect, setPageSelect] = useState(1);
  const [tsSelect, setTsSelect] = useState(10);
  const [docEntry, setDocEntry] = useState({
    id,
    status: false,
    draft: get(location, 'pathname').includes('draft')
  });

  const [orderStatus, setOrderStatus] = useState('2')

  const [salesPersonList, setSalesPersonList] = useState([
    { SlpCode: -1, SlpName: "Нет" }])

  const [showDropDownWarehouse, setShowDropdownWarehouse] = useState(false)

  const [statusName, setStatusName] = useState(returnStatusList[0])

  const [showDropDownSalesPerson, setShowDropdownSalesPerson] = useState(false)
  const [salesPerson, setSalesPerson] = useState('Нет')
  const [salesPersonCode, setSalesPersonCode] = useState(-1)

  const [showDropDownStatus, setShowDropdownStatus] = useState(false)
  const [comment, setComment] = useState('')

  const [filterData, setFilterData] = useState([])

  const [filterProperty, setFilterProperty] = useState({})
  const [filterPropertyResize, setFilterPropertyResize] = useState({})

  const errorRef = useRef();
  const warningRef = useRef();
  const confirmRef = useRef();

  const filterRef = useRef();




  const filterModalRef = useCallback(ref => {
    filterRef.current = ref;
  }, []);

  const getErrorRef = useCallback(ref => {
    errorRef.current = ref;
  }, []);

  const getWarningRef = useCallback(ref => {
    warningRef.current = ref;
  }, []);

  const confirmModalRef = useCallback(ref => {
    confirmRef.current = ref;
  }, []);

  const filterOrders = () => {
    filterRef.current?.open(filterData);
  }






  useEffect(() => {
    const delay = 1000;
    let timeoutId;
    if (search) {
      timeoutId = setTimeout(() => {
        getItems({ page: 1, limit, value: search, filterProperty })
        setTs(limit)
        setPage(1);
      }, delay);
    }
    else {
      getItems({ page: 1, limit, filterProperty })
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
    return axios
      .get(
        url + `/api/customer?search=${get(customerDataObj, 'customer', '').toLowerCase()}&type=${userType}`,
      )
      .then(({ data }) => {
        setCustomerData(
          get(data, 'value', [])
        )
        return get(data, 'value', [])
      })
      .catch(err => {
        errorNotify("Mijozlarni yuklashda muommo yuzaga keldi")
        return
      });
  };

  const getOrderByDocEntry = (doc) => {
    let link = `/api/draft/return/${doc}`
    return axios
      .get(
        url + link,
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
  const getSalesPerson = () => {
    return axios
      .get(
        url + `/api/sales`,
      )
      .then(({ data }) => {
        setSalesPersonList(get(data, 'value', []))
        if (filterData.length == 0) {
          getFilterItemData()
        }
      })
      .catch(err => {
        errorNotify("SalesPerson not found")
      });
  };

  const getFilterItemData = () => {
    return axios
      .get(
        url + `/api/filter`,
      )
      .then(({ data }) => {
        setFilterData(get(data, 'value', []))
      })
      .catch(err => {
        errorNotify("Filter not found")
      });

    return;
  };

  const getItems = (pagination) => {
    setLoading(true)
    let { link } = subQuery(get(pagination, 'filterProperty', {}))
    axios
      .get(
        url + `/api/items-return?offset=${get(pagination, 'page', 1)}&limit=${get(pagination, 'limit', limit)}&type=${userType}&search=${get(pagination, 'value', '').toLowerCase()}&items=${actualData.map(item => `'${item.ItemCode}'`)}` + link,
      )
      .then(async ({ data }) => {
        if (get(docEntry, 'id', 0) && !get(docEntry, 'status')) {
          await getOrderByDocEntry(get(docEntry, 'id', 0)).then(async orderData => {
            setDocEntry({ ...docEntry, status: true })
            orderData = get(orderData, 'value', [])
            setStatusName(get(orderData, '[0].WhsCode', '') == 'B-X' ? returnStatusList[1] : returnStatusList[0])
            setLoading(false)
            setCustomer(get(orderData, '[0].CardName', ''))
            setCustomerCode(get(orderData, '[0].CardCode', ''))

            setCustomerDataInvoice(orderData[0] || {})

            setSalesPerson(get(orderData, '[0].SLP'))
            setSalesPersonCode(get(orderData, '[0].SLPCODE'))
            setComment(get(orderData, '[0].COMMENTS'))
            setDate({
              DocDate: moment(get(orderData, '[0].DocDate', '')).format("YYYY-MM-DD"),
              DocDueDate: moment(get(orderData, '[0].DocDueDate', '')).format("YYYY-MM-DD")
            })
            setAllPageLengthSelect(orderData.length)
            setAllPageLength(get(data, 'value[0].LENGTH', 0) - orderData.length)
            // salom
            setMainData(get(data, 'value', []).map(item => {
              return { ...item, value: '', karobka: '', DfltWH: (statusName == returnStatusList[0] ? get(item, 'WHS', '') : 'B-X') }
            }).filter(el => !orderData.map(item => item.ItemCode).includes(get(el, 'ItemCode'))))
            setState(orderData.map(item => {
              return { ...item, value: Number(item.Quantity).toString(), karobka: Math.floor(item.Quantity / Number(get(item, 'U_Karobka', 1) || 1)), Price: item.PriceBefDi }
            }))
            setActualData(orderData.map(item => {
              return { ...item, value: Number(item.Quantity).toString(), karobka: Math.floor(item.Quantity / Number(get(item, 'U_Karobka', 1) || 1)), Price: item.PriceBefDi, }
            }))
            if (salesPersonList.length == 1) {
              getSalesPerson()
            }
          })
        }
        else {
          if (salesPersonList.length == 1) {
            getSalesPerson()
          }
          setLoading(false)
          setMainData(get(data, 'value', []).map(item => {
            return { ...item, value: '', karobka: '', DfltWH: (statusName == returnStatusList[0] ? get(item, 'WHS', '') : 'B-X') }
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
    setActualData([item, ...actualData])
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

  const postOrder = async () => {
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
    if (actualData.find(item => item.value.length == 0) || actualData.find(item => Number(item.value) < 0)) {
      warningNotify("Miqdor yozilmagan")
      setIsEmpty(true)
      return
    }

    setIsEmpty(false)
    confirmRef.current?.open(`Вы уверены, что хотите это ${get(docEntry, 'id', 0) ? 'обновить' : 'добавить'} ? `);
  }

  const Orders = () => {
    let link = '/api/draft/return'
    setOrderLoading(true)
    let schema = {
      "CardCode": customerCode,
      "DocDate": get(date, 'DocDate'),
      "DocDueDate": get(date, 'DocDueDate'),
      "SalesPersonCode": salesPersonCode,
      "Comments": comment,
      "DocumentLines": actualData.map(item => {

        let obj =
        {
          "ItemCode": get(item, 'ItemCode', ''),
          "Quantity": Number(get(item, 'value', 0)),
          "WarehouseCode": get(item, 'DfltWH', '')
        }
        if (get(item, 'itemDiscount')) {
          obj.Price = 0
          obj.UnitPrice = 0
          obj.DiscountPercent = 0
        }
        if (get(customerDataInvoice, 'U_discount', '').toString().toUpperCase().trim() !== 'YES') {
          obj.DiscountPercent = 0
          obj.LineTotal = (Number(get(item, 'value', 0)) * get(item, 'Price'))
        }
        return obj
      })
    }
    let body = actualData.map(item => {
      return { ...item, DiscPrcnt: Number((customerDataInvoice && get(customerDataInvoice, 'U_discount') !== 'no') ? get(item, 'Discount', 0) : 0), CardName: customer, CardCode: customerCode, ...date, WhsCode: get(item, 'DfltWH', ''), Quantity: item.value, schema, salesPersonCode, salesPerson, comment, ...customerDataInvoice, type: userType }
    })
    axios
      .post(
        url + link,
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
        setCustomer('')
        setCustomerCode('')
        setOrderLoading(false)
        successNotify()
        setMainData([...actualData, ...mainData].map(item => {
          return { ...item, value: '', karobka: '', }
        }))
        setState([])
        setActualData([])
        setAllPageLength(allPageLength + actualData.length)
        setAllPageLengthSelect(0)
        setLimitSelect(10)
        setPageSelect(1)
        setTsSelect(10)
        setComment('')
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

  const Update = () => {
    let link = `/api/draft/return/${get(docEntry, 'id', 0)}`
    let schema = {
      "CardCode": customerCode,
      "DocDate": get(date, 'DocDate'),
      "DocDueDate": get(date, 'DocDueDate'),
      "SalesPersonCode": salesPersonCode,
      "Comments": comment,
      "DocumentLines": actualData.map(item => {
        let obj = {
          "ItemCode": get(item, 'ItemCode', ''),
          "Quantity": Number(get(item, 'value', 0)),
          "WarehouseCode": get(item, 'DfltWH', '')
        }
        if (get(item, 'itemDiscount')) {
          obj.Price = 0
          obj.UnitPrice = 0
          obj.DiscountPercent = 0
        }
        if (get(customerDataInvoice, 'U_discount', '').toString().toUpperCase().trim() !== 'YES') {
          obj.DiscountPercent = 0
          obj.LineTotal = (Number(get(item, 'value', 0)) * get(item, 'Price'))
        }
        return obj
      })
    }
    let body = actualData.map(item => {
      return { ...item, DiscPrcnt: Number((customerDataInvoice && get(customerDataInvoice, 'U_discount') !== 'no') ? get(item, 'Discount', 0) : 0), CardName: customer, CardCode: customerCode, ...date, WhsCode: get(item, 'DfltWH', ''), Quantity: item.value, schema, salesPersonCode, salesPerson, comment, ...customerDataInvoice, type: userType }
    })
    setOrderLoading(true)
    axios
      .patch(
        url + link,
        body,
        {
          headers: {
            info: JSON.stringify({
              'Cookie': get(getMe, 'Cookie[0]', '') + get(getMe, 'Cookie[1]', ''),
              'SessionId': get(getMe, 'SessionId', ''),
            }),
            "B1S-ReplaceCollectionsOnPatch": "true",
          },
        }
      )
      .then(({ data }) => {
        setOrderLoading(false)
        successNotify("Ma'lumot muvaffaqiyatli o'zgartirildi")
      })
      .catch(err => {
        if (get(err, 'response.status') == 401) {
          navigate('/login')
          return
        }
        setOrderLoading(false)
        errorRef.current?.open(get(err, 'response.data.error.message.value', 'Ошибка'));
      });
  }

  const subQuery = (prop = {}) => {
    let group = get(prop, 'Group', '')
    let category = get(prop, 'CategoryCode', '').toString()
    let groupCode = get(prop, 'GroupCode', '').toString()

    let list = [
      { name: 'group', data: group },
      { name: 'code', data: groupCode },
      { name: 'category', data: category },
    ].filter(item => get(item, 'data', '').length)

    return {
      link: list.map(item => {
        return `&${get(item, 'name', '')}=${get(item, 'data', '')}`
      }).join(''), status: list.length
    }
  }

  const inputRefs = useRef([]);
  const inputKarobkaRefs = useRef([]);

  const handleKarobkaKeyDown = (event, index) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault(); // ArrowDown tugmasining default harakatini to'xtatish
      if (index < inputKarobkaRefs.current.length - 1) {
        inputKarobkaRefs.current[index + 1].focus();
        setTimeout(() => {
          const nextInput = inputKarobkaRefs.current[index + 1];
          if (nextInput.type === 'number') {
            const value = nextInput.value; // Hozirgi qiymatini saqlab qo'yamiz
            nextInput.type = 'text'; // Vaqtinchalik text turiga o'zgartirish
            nextInput.setSelectionRange(value.length, value.length);
            nextInput.type = 'number'; // Qayta number turiga o'zgartirish
            nextInput.value = value; // Qiymatini qaytarish
          }
        }, 0);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault(); // ArrowUp tugmasining default harakatini to'xtatish
      if (index > 0) {
        inputKarobkaRefs.current[index - 1].focus();
        setTimeout(() => {
          const prevInput = inputKarobkaRefs.current[index - 1];
          if (prevInput.type === 'number') {
            const value = prevInput.value; // Hozirgi qiymatini saqlab qo'yamiz
            prevInput.type = 'text'; // Vaqtinchalik text turiga o'zgartirish
            prevInput.setSelectionRange(value.length, value.length);
            prevInput.type = 'number'; // Qayta number turiga o'zgartirish
            prevInput.value = value; // Qiymatini qaytarish
          }
        }, 0);
      }
    }
  };

  const handleKeyDown = (event, index) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault(); // ArrowDown tugmasining default harakatini to'xtatish
      if (index < inputRefs.current.length - 1) {
        inputRefs.current[index + 1].focus();
        setTimeout(() => {
          const nextInput = inputRefs.current[index + 1];
          if (nextInput.type === 'number') {
            const value = nextInput.value; // Hozirgi qiymatini saqlab qo'yamiz
            nextInput.type = 'text'; // Vaqtinchalik text turiga o'zgartirish
            nextInput.setSelectionRange(value.length, value.length);
            nextInput.type = 'number'; // Qayta number turiga o'zgartirish
            nextInput.value = value; // Qiymatini qaytarish
          }
        }, 0);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault(); // ArrowUp tugmasining default harakatini to'xtatish
      if (index > 0) {
        inputRefs.current[index - 1].focus();
        setTimeout(() => {
          const prevInput = inputRefs.current[index - 1];
          if (prevInput.type === 'number') {
            const value = prevInput.value; // Hozirgi qiymatini saqlab qo'yamiz
            prevInput.type = 'text'; // Vaqtinchalik text turiga o'zgartirish
            prevInput.setSelectionRange(value.length, value.length);
            prevInput.type = 'number'; // Qayta number turiga o'zgartirish
            prevInput.value = value; // Qiymatini qaytarish
          }
        }, 0);
      }
    }
  };

  return (
    <>
      <Style>
        <Layout>

          <div className='container'>
            <div className="order-head">

              <div className="order-main d-flex align justify">
                <div className='d-flex align'>
                  <button onClick={() => navigate('/return')} className='btn-back'>Назад</button>
                  <h3 className='title-menu'>Возврат</h3>
                </div>
                <button onClick={postOrder} className={`btn-head position-relative`}>
                  {orderLoading ? <Spinner /> : (get(docEntry, 'id', 0) ? 'Обновить' : 'Добавить')}
                </button>
              </div>
              <div className="order-head-data d-flex align justify">
                <div className='w-100 position-relative' >
                  <input onChange={(e) => {
                    setCustomer(e.target.value)
                    setCustomerCode('')
                  }} value={customer} type="search" className='order-inp' placeholder='Клиент' />
                  {(customerData.length) ? (
                    <ul className="dropdown-menu" style={{ top: '49px', zIndex: 1 }}>
                      {customerData.map((customerItem, i) => (
                        <li onClick={() => {
                          setCustomer(get(customerItem, 'CardName', ''))
                          setCustomerCode(get(customerItem, 'CardCode', ''))
                          setCustomerDataInvoice(customerData.find(e => get(e, 'CardCode', '') == get(customerItem, 'CardCode', '')))
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

                <div className='w-100'>
                  <input type="text" value={comment} onChange={(e) => setComment(e.target.value)} className='order-inp' placeholder='Комментарий' />
                </div>
              </div>

              <div className='d-flex align justify'>
                <div className='d-flex align'>
                  <div className='right-limit' style={{ width: "190px" }}>
                    <button onClick={() => setShowDropdownSalesPerson(!showDropDownSalesPerson)} className={`right-dropdown w-100`}>
                      <p className='right-limit-text'>{salesPerson}</p>
                      <img src={arrowDown} className={showDropDownSalesPerson ? "up-arrow" : ""} alt="arrow-down-img" />
                    </button>
                    <ul style={{ zIndex: 1 }} className={`dropdown-menu  ${(showDropDownSalesPerson && salesPersonList.length) ? "display-b" : "display-n"}`} aria-labelledby="dropdownMenuButton1">
                      {
                        salesPersonList.map((item, i) => {
                          return (<li key={i} onClick={() => {
                            if (salesPerson != get(item, 'SlpName')) {
                              setSalesPerson(get(item, 'SlpName'));
                              setSalesPersonCode(get(item, 'SlpCode'))
                              setShowDropdownSalesPerson(false)
                            }
                            return
                          }} className={`dropdown-li ${salesPerson == get(item, 'SlpName') ? 'dropdown-active' : ''}`}><a className="dropdown-item" href="#">{get(item, 'SlpName')}</a></li>)
                        })
                      }
                    </ul>
                  </div>
                  <div className='right-limit' style={{ marginLeft: '20px' }}>
                    <button disabled={actualData.length} style={{ width: "110px" }} onClick={() => setShowDropdownWarehouse(!showDropDownWarehouse)} className={`right-dropdown ${actualData?.length ? 'opacity-5' : ''}`}>
                      <p className='right-limit-text'>{statusName}</p>
                      <img src={arrowDown} className={showDropDownWarehouse ? "up-arrow" : ""} alt="arrow-down-img" />
                    </button>
                    <ul style={{ zIndex: 1 }} className={`dropdown-menu  ${(showDropDownWarehouse && actualData.length == 0) ? "display-b" : "display-n"}`} aria-labelledby="dropdownMenuButton1">
                      {
                        returnStatusList.map((item, i) => {
                          return (<li key={i} onClick={() => {
                            if (statusName != item) {
                              setStatusName(item);
                              setShowDropdownWarehouse(false)
                              setMainData([...mainData.map(el => {
                                return { ...el, DfltWH: (item == returnStatusList[0] ? get(el, 'WHS', '') : 'B-X') }
                              })])
                            }
                            return
                          }} className={`dropdown-li ${statusName == item ? 'dropdown-active' : ''}`}><a className="dropdown-item" href="#">{item}</a></li>)
                        })
                      }
                    </ul>
                  </div>
                  {
                    !get(docEntry, 'id') && (
                      <div className='right-limit' style={{ marginLeft: '20px' }}>
                        <button style={{ width: "140px" }} onClick={() => setShowDropdownStatus(!showDropDownStatus)} className='right-dropdown'>
                          <p className='right-limit-text'>{statuses[orderStatus].name}</p>
                          <img src={arrowDown} className={showDropDownStatus ? "up-arrow" : ""} alt="arrow-down-img" />
                        </button>
                        <ul style={{ zIndex: 1 }} className={`dropdown-menu  ${showDropDownStatus ? "display-b" : "display-n"}`} aria-labelledby="dropdownMenuButton1">
                          {
                            ([2]).map((item, i) => {
                              return (<li key={i} onClick={() => {
                                if (orderStatus != item) {
                                  setShowDropdownStatus(false)
                                  setOrderStatus(item)
                                }
                                return
                              }} className={`dropdown-li ${orderStatus == item ? 'dropdown-active' : ''}`}><a className="dropdown-item" href="#">{statuses[item].name}</a></li>)
                            })
                          }
                        </ul>
                      </div>
                    )
                  }
                </div>
                <div className='right-head order-head-filter'>
                  <div className='right-pagination'>
                    <p className='pagination-text'><span>{page}-{ts}</span> <span>of {allPageLength}</span> </p>
                    <button onClick={() => {
                      if (page > 1) {
                        getItems({ page: page - limit, limit, value: search, filterProperty })
                        setPage(page - limit);
                        setTs(ts - limit)
                      }
                    }} disabled={page == 1} className={`pagination-button left-pagination ${page == 1 ? 'opcity-5' : ''}`}>
                      <img src={pagination} alt="arrow-button-pagination" />
                    </button>

                    <button onClick={() => {
                      if (ts < allPageLength) {
                        getItems({ page: page + limit, limit, value: search, filterProperty })
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
                          setFilterProperty({})
                          getItems({ page: 1, limit, value: search })
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
                    <button style={{ width: "200px" }} onClick={() => setShowDropdown(!showDropdown)} className='right-dropdown'>
                      <p className='right-limit-text'>{limit}</p>
                      <img src={arrowDown} className={showDropdown ? "up-arrow" : ""} alt="arrow-down-img" />
                    </button>
                    <ul style={{ zIndex: 1 }} className={`dropdown-menu ${showDropdown ? "display-b" : "display-n"}`} aria-labelledby="dropdownMenuButton1">
                      {
                        limitList.map((item, i) => {
                          return (<li key={i} onClick={() => {
                            if (limit != item) {
                              setLimit(item);
                              setPage(1);
                              setShowDropdown(false);
                              setTs(item)
                              getItems({ page: 1, limit: item, value: search, filterProperty })
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
            <div className='table' >
              <div className='table-head'>
                <ul className='table-head-list d-flex align  justify'>
                  <li className='table-head-item w-50'>
                    Код
                  </li>
                  <li className='table-head-item w-100'>Продукция/Производитель</li>
                  <li className='table-head-item w-70'>Модел</li>
                  <li className='table-head-item w-50'>Куб / Brutto</li>
                  <li className='table-head-item w-50'>Цена</li>
                  <li className='table-head-item w-50'>Остаток</li>
                  <li className='table-head-item w-70'>Количество</li>
                  <li className='table-head-item w-70'>В кейсе</li>
                  <li className='table-head-item w-47px'>
                    <button onClick={() => {
                      let filterData = mainData.filter(el => {
                        let free = Number(get(el, 'OnHand', '')) - Number(get(el, 'IsCommited', ''))
                        return Number(el.value) > 0 && (free >= Number(el.value.trim()))
                      })
                      if (filterData.length) {
                        setAllPageLengthSelect(allPageLengthSelect + filterData.length)
                        setAllPageLength(allPageLength - filterData.length)
                        setMainData(mainData.filter(el => !filterData.map(item => item.ItemCode).includes(el.ItemCode)))
                        setState([...filterData, ...state])
                        setActualData([...filterData, ...actualData])
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
                                    <p style={{ width: '200px' }} className='table-body-text truncated-text' title={get(item, 'ItemName', '')}>
                                      {get(item, 'ItemName', '') || '-'}
                                    </p>
                                  </div>
                                  <div className='w-70 p-16' >
                                    <p className='table-body-text truncated-text ' title={get(item, 'U_model', '')}>
                                      {get(item, 'U_model', '-') || '-'}
                                    </p>
                                  </div>
                                  <div className='w-50 p-16' >
                                    <p className='table-body-text truncated-text' title={`${Number(get(item, 'BVolume', '-')) || '-'} / ${Number(get(item, 'U_U_brutto', '-')) || '-'}`}>
                                      {Number(get(item, 'BVolume', '-')) || '-'} / {Number(get(item, 'U_U_brutto', '-')) || '-'}
                                    </p>
                                  </div>
                                  <div className='w-50 p-16' >
                                    <p className='table-body-text 50'>
                                      {formatterCurrency(Number(get(item, 'Price', 0)), get(item, 'Currency', "USD") || 'USD')}
                                    </p>
                                  </div>
                                  <div className='w-50 p-16' >
                                    <p className='table-body-text '>
                                      {Number(get(item, 'OnHand', ''))} / <span className='isCommited'>{Number(get(item, 'OnHand', '')) - Number(get(item, 'IsCommited', ''))}</span>
                                    </p>
                                  </div>
                                  <div className='w-70 p-16' >
                                    <input
                                      ref={(el) => (inputRefs.current[i] = el)}
                                      onKeyDown={(event) => handleKeyDown(event, i)}
                                      value={get(item, 'value', '')}
                                      onChange={(e) => {
                                        if (/^\d*$/.test(e.target.value)) {
                                          changeValue(e.target.value, get(item, 'ItemCode', ''))
                                          changeKarobka((e.target.value ? (Math.floor(e.target.value / Number(get(item, 'U_Karobka', 1) || 1))).toString() : ''), get(item, 'ItemCode', ''))

                                        }
                                      }}
                                      type="text"
                                      className='table-body-inp'
                                      placeholder='-' />
                                  </div>
                                  <div className='w-70 p-16' >
                                    <input

                                      ref={(el) => (inputKarobkaRefs.current[i] = el)}
                                      onKeyDown={(event) => handleKarobkaKeyDown(event, i)}
                                      value={get(item, 'karobka', '')}
                                      onChange={(e) => {
                                        if (/^\d*$/.test(e.target.value)) {
                                          changeKarobka(e.target.value, get(item, 'ItemCode', ''))
                                          changeValue((e.target.value ? ((e.target.value || 1) * Number(get(item, 'U_Karobka', 1) || 1)).toString() : ''), get(item, 'ItemCode', ''))
                                        }
                                      }}
                                      type="text"
                                      className='table-body-inp'
                                      placeholder={`${Number(get(item, 'U_Karobka', 1) || 1)} / кор`}
                                    />
                                  </div>
                                  <div className='w-47px p-16' >
                                    <button

                                      onClick={() => addState(item)}
                                      className={`table-body-text table-head-check-btn`}>
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
            filterPropertyResize={filterPropertyResize}
            setFilterPropertyResize={setFilterPropertyResize}
            customerDataInvoice={customerDataInvoice}
            filterData={filterData}
          />
        </Layout>
      </Style>
      <>
        <ToastContainer />
        <FilterModal
          getRef={filterModalRef}
          filterProperty={filterProperty}
          setFilterProperty={setFilterProperty}
          getItems={getItems}
          arg={{ page: 1, limit, value: search }}
          setPage={setPage}
          setTs={setTs}
        />

        <ErrorModal
          getRef={getErrorRef}
          title={'Ошибка'}
        />
        <WarningModal
          getRef={getWarningRef}
          title={'Ошибка'}
        />
        <ConfirmModal getRef={confirmModalRef} title={"Oshibka"} fn={get(docEntry, 'id', '') ? Update : Orders} />
      </>
    </>
  );
};

export default Order;