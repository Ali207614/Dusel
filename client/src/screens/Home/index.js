import React, { useState } from 'react';
import Style from './Style';
import Layout from '../../components/Layout';
import Button from '../../components/Button';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18next from 'i18next';
import { useSelector } from 'react-redux';
import searchImg from '../../assets/images/search-normal.svg';
import filterImg from '../../assets/images/filter-search.svg';
import arrowDown from '../../assets/images/arrow-down.svg';
import pagination from '../../assets/images/pagination.svg';

let limitList = [1, 10, 50, 100, 500, 1000]


const Home = () => {
  const { t } = useTranslation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [allPageLength, setAllPageLength] = useState(1502);

  const { getMe } = useSelector(state => state.main);
  const changeLanguage = ln => {
    AsyncStorage.setItem('lan', ln);
    i18next.changeLanguage(ln);
  };

  // yarn run babel -f .babelrc 'src/**/*.{js,jsx,ts,tsx}'
  // 👆 bu commanda barcha t ga o'ralgan key larni yig'ib beradi

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
                <ul class={`dropdown-menu ${showDropdown ? "display-b" : "display-n"}`} aria-labelledby="dropdownMenuButton1">
                  {
                    limitList.map(item => {
                      return (<li onClick={() => {
                        setLimit(item);
                        setPage(1);
                        setShowDropdown(false);
                        return
                      }} className={`dropdown-li ${limit == item ? 'dropdown-active' : ''}`}><a class="dropdown-item" href="#">{item}</a></li>)
                    })
                  }
                </ul>
              </div>

              <div className='right-pagination'>
                <button onClick={() => setPage(page == 1 ? 1 : (page - 1))} className={`pagination-button left-pagination ${page == 1 ? 'opcity-5' : ''}`}><img src={pagination} alt="arrow-button-pagination" /></button>
                <button onClick={() => setPage((page * limit) >= allPageLength ? page : (page + 1))} className={`pagination-button ${page * limit >= allPageLength ? 'opcity-5' : ''}`}><img src={pagination} alt="arrow-button-pagination" /></button>
                <p className='pagination-text'><span>{page}-{limit}</span> <span>of {allPageLength}</span> </p>
              </div>

              <button className='btn-head'>
                Добавить
              </button>
            </div>
          </div>
          <div className='table'>

          </div>
        </div>
      </Layout>
    </Style>
  );
};

export default Home;
