import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

  let [color, setColor] = useState("#3C3F47");

  const { getMe } = useSelector(state => state.main);
  const changeLanguage = ln => {
    AsyncStorage.setItem('lan', ln);
    i18next.changeLanguage(ln);
  };

  useEffect(() => {
    getOrders({ page, limit })
  }, []);

  const getOrders = (pagination) => {
    setLoading(true)
    axios
      .get(
        url + `/api/orders?offset=${get(pagination, 'page', 1)}&limit=${get(pagination, 'limit', limit)}`,
      )
      .then(({ data }) => {
        setLoading(false)
        setMainData(get(data, 'value', []))
        setAllPageLength(get(data, 'value[0].LENGTH', []))
      })
      .catch(err => {
        setLoading(false)
      });

    return;
  };

  return (
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
                <input type="text" className='right-inp' placeholder='Поиск' />
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
                        setLimit(item);
                        setPage(1);
                        setShowDropdown(false);
                        setTs(item)
                        getOrders({ page: 1, limit: item })
                        setSelect([])
                        setMainCheck(false)
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
                <li className='table-head-item'>Торговый представитель</li>
                <li className='table-head-item'>Дата заказа</li>
                <li className='table-head-item'>Дата отгрузки</li>
                <li className='table-head-item'>Сумма сделки</li>
                <li className='table-head-item'>Тип оплаты</li>
                <li className='table-head-item'>Состояние</li>
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
                              {/* <div className='w-100 p-16'>
                                <p className='table-body-text'>
                                  {get(item, 'DocNum')}
                                </p>
                              </div> */}
                              <div className='d-flex align  w-100 p-16'>
                                <input checked={select.find(item => item == i + 1)} className='m-right-16 inp-checkbox' onClick={(e) => {
                                  if (select.find(item => item == i + 1)) {
                                    setSelect([...select.filter(item => item != i + 1)])
                                  }
                                  else {
                                    setSelect([...select, i + 1])
                                  }
                                }} type="checkbox" name="checkbox" />
                                <p className='table-body-text' onClick={() => setActiveData(activeData === i + 1 ? 0 : (i + 1))}>
                                  {get(item, 'CardName', '')}
                                </p>
                              </div>
                              <div className='w-100 p-16' onClick={() => setActiveData(activeData === i + 1 ? 0 : (i + 1))}>
                                <p className='table-body-text'>
                                  {get(item, 'SlpName', '')}
                                </p>
                              </div>
                              <div className='w-100 p-16' onClick={() => setActiveData(activeData === i + 1 ? 0 : (i + 1))}>
                                <p className='table-body-text'>
                                  {moment(get(item, 'DocDate', '')).format("DD-MM-YYYY")}
                                </p>
                              </div>
                              <div className='w-100 p-16' onClick={() => setActiveData(activeData === i + 1 ? 0 : (i + 1))}>
                                <p className='table-body-text '>
                                  {moment(get(item, 'DocDueDate', '')).format("DD-MM-YYYY")}
                                </p>
                              </div>
                              <div className='w-100 p-16' onClick={() => setActiveData(activeData === i + 1 ? 0 : (i + 1))}>
                                <p className='table-body-text '>
                                  {formatterCurrency(Number(get(item, 'DocTotal', 0)), get(item, 'DocCur', 'UZS'))}
                                </p>
                              </div>
                              <div className='w-100 p-16' onClick={() => setActiveData(activeData === i + 1 ? 0 : (i + 1))}>
                                <p className='table-body-text '>
                                  Наличные  деньги
                                </p>
                              </div>
                              <div className='w-100 p-16' onClick={() => setActiveData(activeData === i + 1 ? 0 : (i + 1))}>
                                <button className='table-body-text'>
                                  Новый
                                </button>
                              </div>
                            </div>
                            <div className='table-item-foot d-flex align'>
                              <button className='table-item-btn d-flex align'>Edit <img src={editIcon} alt="arrow right" /></button>
                              <button className='table-item-btn d-flex align'> Накладный <img src={editIcon} alt="arrow-right" /></button>
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
      </Layout>
    </Style>
  );
};

export default Home;
