import React, { memo, useEffect, useState } from 'react';
import Styles from './Styles';
import Modal from 'react-modal';
import { useTranslation } from 'react-i18next';
import { statuses, warehouseList } from '../../Helper';
import arrowDown from '../../../assets/images/arrow-down.svg';
import CloseFilter from '../../../assets/images/close.svg'
import { get } from 'lodash';
const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    border: 'none',
    width: "927px",
    padding: 0,
    overflow: 'none',
    borderRadius: 0
  },
  overlay: {
    background: '#0000008D',
    zIndex: '1000'
  },
};

const FilterOrderModal = ({ getRef, }) => {
  const { t } = useTranslation();
  const [showDropDownWarehouse, setShowDropdownWarehouse] = useState(false)
  const [warehouse, setWarehouse] = useState('BAZA1')
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [filterData, setFilterData] = useState({});
  useEffect(() => {
    const ref = {
      open: (data) => {
        setIsOpenModal(true);
        setFilterData(data)
      },
      close: () => setIsOpenModal(false),
    };
    getRef(ref);
  }, []);

  return (
    <Modal
      isOpen={isOpenModal}
      onRequestClose={() => setIsOpenModal(false)}
      style={customStyles}
      contentLabel="Example Modal"
      ariaHideApp={false}>
      <Styles>
        <div className="card df">
          <div className='card-left'>
            <h2 className='card-left-title'>Фильтр</h2>
          </div>
          <div className='card-right' style={{ position: 'relative' }}>
            <button onClick={() => setIsOpenModal(false)} className='close-filter'>
              <img src={CloseFilter} alt="close" />
            </button>
            <div className='card-filter'>
              <div className='filter-manager'>
                <h3 className='filter-title'>Торговый представитель</h3>
                <div className='filter-wrapper df align'>
                  {
                    get(filterData, 'SalesPerson', []).map(item => {
                      return (
                        <div className='df align mr-24 filter-wrapper-inner'>
                          <input className='checkbox-filter' type="checkbox" id={get(item, 'SlpCode')} />
                          <label className='checkbox-label' for={get(item, 'SlpCode')}>{get(item, 'SlpName')}</label>
                        </div>
                      )
                    })
                  }
                </div>
              </div>
              <div className='filter-manager'>
                <h3 className='filter-title'>Контрагент</h3>
                <input className='filter-inp' type="search" placeholder='Контрагент' />
              </div>
              <div className='filter-manager'>
                <h3 className='filter-title'>Дата заказа</h3>
                <div className='df align justify'>
                  <input style={{ width: '48%' }} className='filter-inp' type="date" id='manager' />
                  <input style={{ width: '48%' }} className='filter-inp' type="date" id='manager' />
                </div>
              </div>
              <div className='filter-manager'>
                <h3 className='filter-title'>Дата отгрузка</h3>
                <div className='df align justify'>
                  <input style={{ width: '48%' }} className='filter-inp' type="date" id='manager' />
                  <input style={{ width: '48%' }} className='filter-inp' type="date" id='manager' />
                </div>
              </div>
              <div className='filter-manager'>
                <h3 className='filter-title'>Состояние</h3>
                <div className='filter-wrapper df align'>
                  {
                    get(filterData, 'Status', []).map(item => {
                      return (
                        <div className='df align mr-24 filter-wrapper-inner'>
                          <input className='checkbox-filter' type="checkbox" id={statuses[get(item, 'U_status', '')]?.name} />
                          <label className='checkbox-label' for={statuses[get(item, 'U_status', '')]?.name}>{statuses[get(item, 'U_status', '')]?.name}</label>
                        </div>
                      )
                    })
                  }
                </div>
              </div>
              <div className='filter-manager'>
                <h3 className='filter-title'>Склад</h3>
                <div className='right-limit' style={{ width: "110px" }}>
                  <button style={{ width: "110px" }} onClick={() => setShowDropdownWarehouse(!showDropDownWarehouse)} className={`right-dropdown`}>
                    <p className='right-limit-text'>{warehouse}</p>
                    <img src={arrowDown} className={showDropDownWarehouse ? "up-arrow" : ""} alt="arrow-down-img" />
                  </button>
                  <ul style={{ zIndex: 1 }} className={`dropdown-menu  ${(showDropDownWarehouse) ? "display-b" : "display-n"}`} aria-labelledby="dropdownMenuButton1">
                    {
                      warehouseList.map((item, i) => {
                        return (<li key={i} onClick={() => {
                          if (warehouse != item) {
                            setWarehouse(item);
                            setShowDropdownWarehouse(false)
                          }
                          return
                        }} className={`dropdown-li ${warehouse == item ? 'dropdown-active' : ''}`}><a className="dropdown-item" href="#">{item}</a></li>)
                      })
                    }
                  </ul>
                </div>
              </div>
            </div>
            <div className='card-buttons'>
              <button className='card-btn-filter card-btn-clear'>Очистить фильтр</button>
              <button className='card-btn-filter'>Фильтр</button>
            </div>
          </div>
        </div>
      </Styles>
    </Modal>
  );
};

export default memo(FilterOrderModal);
