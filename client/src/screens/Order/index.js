import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Style from './Style';
import { useNavigate } from 'react-router-dom';
import searchImg from '../../assets/images/search-normal.svg';
import filterImg from '../../assets/images/filter-search.svg';
import arrowDown from '../../assets/images/arrow-down.svg';
import pagination from '../../assets/images/pagination.svg';
import editIcon from '../../assets/images/edit-icon.svg';

let url = process.env.REACT_APP_API_URL

let limitList = [1, 10, 50, 100, 500, 1000]
const Order = () => {
  const navigate = useNavigate();

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
                    setPage(page - limit);
                    setTs(ts - limit)
                    setSelect([])
                  }
                }} disabled={page == 1} className={`pagination-button left-pagination ${page == 1 ? 'opcity-5' : ''}`}>
                  <img src={pagination} alt="arrow-button-pagination" />
                </button>

                <button onClick={() => {
                  if (ts < allPageLength) {
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
                        setSelect([])
                        setMainCheck(false)
                        return
                      }} className={`dropdown-li ${limit == item ? 'dropdown-active' : ''}`}><a className="dropdown-item" href="#">{item}</a></li>)
                    })
                  }
                </ul>
              </div>

            </div>
          </div>
        </div>
      </Layout>
    </Style>
  );
};

export default Order;