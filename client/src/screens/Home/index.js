import React, { useEffect, useState } from 'react';
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
let url = process.env.REACT_APP_API_URL

let limitList = [1, 10, 50, 100, 500, 1000]


const Home = () => {
  const { t } = useTranslation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [activeData, setActiveData] = useState(false);
  const [allPageLength, setAllPageLength] = useState(1502);
  const [loading, setLoading] = useState(false)
  const [mainData, setMainData] = useState([])


  const { getMe } = useSelector(state => state.main);
  const changeLanguage = ln => {
    AsyncStorage.setItem('lan', ln);
    i18next.changeLanguage(ln);
  };

  useEffect(() => {
    getOrders()
  }, []);

  const getOrders = (e) => {
    setLoading(true)
    axios
      .get(
        url + "/api/orders",
      )
      .then(({ data }) => {
        setMainData(get(data, 'value', []))
      })
      .catch(err => {
        console.log(err, ' bu err')
      });
    setLoading(false)
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
                        return
                      }} className={`dropdown-li ${limit == item ? 'dropdown-active' : ''}`}><a className="dropdown-item" href="#">{item}</a></li>)
                    })
                  }
                </ul>
              </div>

              <div className='right-pagination'>
                <button onClick={() => setPage()} className={`pagination-button left-pagination ${page == 1 ? 'opcity-5' : ''}`}><img src={pagination} alt="arrow-button-pagination" /></button>
                <button onClick={() => setPage()} className={`pagination-button ${page * limit >= allPageLength ? 'opcity-5' : ''}`}><img src={pagination} alt="arrow-button-pagination" /></button>
                <p className='pagination-text'><span>{page}-{limit}</span> <span>of {allPageLength}</span> </p>
              </div>

              <button className='btn-head'>
                Добавить
              </button>
            </div>
          </div>
          <div className='table'>
            <div className='table-head'>
              <ul className='table-head-list d-flex align  justify'>
                <li className='table-head-item d-flex align'>
                  <input className='m-right-16' type="checkbox" name="checkbox" />
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
              <ul className='table-body-list'>
                {
                  mainData.map((item, i) => {
                    return (
                      <li key={i} onClick={() => setActiveData(activeData === i + 1 ? 0 : (i + 1))} className={`table-body-item ${activeData === i + 1 ? 'active-table' : ''}`}>
                        <div className='table-item-head d-flex align  justify'>
                          <div className='d-flex align  w-100 p-16'>
                            <input className='m-right-16' type="checkbox" name="checkbox" />
                            <p className='table-body-text'>
                              {get(item, 'CardName', '')}
                            </p>
                          </div>
                          <div className='w-100 p-16'>
                            <p className='table-body-text'>
                              {get(item, 'SlpName', '')}
                            </p>
                          </div>
                          <div className='w-100 p-16'>
                            <p className='table-body-text'>
                              {moment(get(item, 'DocDate', '')).format("DD-MM-YYYY")}
                            </p>
                          </div>
                          <div className='w-100 p-16'>
                            <p className='table-body-text '>
                              {moment(get(item, 'DocDueDate', '')).format("DD-MM-YYYY")}
                            </p>
                          </div>
                          <div className='w-100 p-16'>
                            <p className='table-body-text '>
                              {formatterCurrency(get(item, 'DocTotal', 0), get(item, 'DocCur', 'UZS'))}
                            </p>
                          </div>
                          <div className='w-100 p-16'>
                            <p className='table-body-text '>
                              Наличные  деньги
                            </p>
                          </div>
                          <div className='w-100 p-16'>
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
            </div>
          </div>
        </div>
      </Layout>
    </Style>
  );
};

export default Home;
