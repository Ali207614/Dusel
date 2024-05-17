import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Style from './Style';
import { useNavigate } from 'react-router-dom';
import searchImg from '../../assets/images/search-normal.svg';
import filterImg from '../../assets/images/filter-search.svg';
import arrowDown from '../../assets/images/arrow-down.svg';
import pagination from '../../assets/images/pagination.svg';
import tickSquare from '../../assets/images/tick-square.svg';
import add from '../../assets/images/add.svg';
import editIcon from '../../assets/images/edit-icon.svg';
import axios from 'axios';
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

const Order = () => {
  const navigate = useNavigate();
  let [color, setColor] = useState("#3C3F47");
  const [showDropdown, setShowDropdown] = useState(false);
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [activeData, setActiveData] = useState(false);
  const [allPageLength, setAllPageLength] = useState(2200);
  const [loading, setLoading] = useState(false)
  const [mainCheck, setMainCheck] = useState(false)
  const [mainData, setMainData] = useState([])
  const [ts, setTs] = useState(10);
  const [select, setSelect] = useState([])

  useEffect(() => {
    getItems({ page, limit })
  }, []);

  const getItems = (pagination) => {
    setLoading(true)
    axios
      .get(
        url + `/api/items?offset=${get(pagination, 'page', 1)}&limit=${get(pagination, 'limit', limit)}&whsCode='BAZA1'`,
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
          <div className="order-head">
            <div className="order-main d-flex align justify">
              <button onClick={() => navigate('/home')} className='btn-back'>Закрить</button>
              <button className='btn-head'>
                Добавить
              </button>
            </div>
            <div className="order-head-data d-flex align justify">
              <input type="text" className='order-inp' placeholder='Card Code' />
              <input type="text" className='order-inp' placeholder='Card Name' />
              <input type="text" className='order-inp' placeholder='Doc Date' />
              <input type="text" className='order-inp' placeholder='Due Date' />
            </div>


            <div className='right-head order-head-filter'>
              <div className='right-pagination'>
                <p className='pagination-text'><span>{page}-{ts}</span> <span>of {allPageLength}</span> </p>
                <button onClick={() => {
                  if (page > 1) {
                    getItems({ page: page - limit, limit })
                    setPage(page - limit);
                    setTs(ts - limit)
                    setSelect([])
                  }
                }} disabled={page == 1} className={`pagination-button left-pagination ${page == 1 ? 'opcity-5' : ''}`}>
                  <img src={pagination} alt="arrow-button-pagination" />
                </button>

                <button onClick={() => {
                  if (ts < allPageLength) {
                    getItems({ page: page - limit, limit })
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
                        if (limit != item) {
                          setLimit(item);
                          setPage(1);
                          setShowDropdown(false);
                          setTs(item)
                          getItems({ page: 1, limit: item })
                          setSelect([])
                          setMainCheck(false)
                        }
                        return
                      }} className={`dropdown-li ${limit == item ? 'dropdown-active' : ''}`}><a className="dropdown-item" href="#">{item}</a></li>)
                    })
                  }
                </ul>
              </div>

            </div>
          </div>
          <div className='table'>
            <div className='table-head'>
              <ul className='table-head-list d-flex align  justify'>
                <li className='table-head-item '>
                  Код
                </li>
                <li className='table-head-item'>Продукция / Производитель </li>
                <li className='table-head-item'>Цена</li>
                <li className='table-head-item'>Остаток</li>
                <li className='table-head-item'>Количество</li>
                <li className='table-head-item'>В кейсе</li>
                <li className='table-head-item w-47px'>
                  <button className='table-head-check-btn'>
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
                          <li key={i} className={`table-body-item`}>
                            <div className='table-item-head d-flex align  justify'>
                              <div className='w-100 p-16'>
                                <p className='table-body-text' >
                                  {get(item, 'ItemCode', '')}
                                </p>
                              </div>
                              <div className='w-100 p-16' >
                                <p className='table-body-text'>
                                  {get(item, 'ItemName', '')}
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
                                  <input type="text" className='table-body-inp' placeholder='-' />
                                </p>
                              </div>
                              <div className='w-100 p-16' >
                                <p className='table-body-text '>
                                  <input type="text" className='table-body-inp' placeholder='100  /кор' />
                                </p>
                              </div>
                              <div className='w-47px p-16' >
                                <button className='table-body-text table-head-check-btn'>
                                  <img src={add} alt="add button" />
                                </button>
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
      </Layout>
    </Style>
  );
};

export default Order;