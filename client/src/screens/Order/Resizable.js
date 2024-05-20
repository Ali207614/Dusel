import React, { useEffect, useState, useRef } from 'react';
import Style from './Style';
import searchImg from '../../assets/images/search-normal.svg';
import filterImg from '../../assets/images/filter-search.svg';
import arrowDown from '../../assets/images/arrow-down.svg';
import pagination from '../../assets/images/pagination.svg';
import remove from '../../assets/images/remove.svg';
import allRemove from '../../assets/images/close.svg';
import { get } from 'lodash';
import formatterCurrency from '../../helpers/currency';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';
import { memo } from 'react';



const Resizable = memo(({
    state,
    setState,
    setAllPageLengthSelect,
    allPageLengthSelect,
    setMainData,
    setAllPageLength,
    allPageLength,
    mainData,
    actualData,
    setActualData,
    isEmpty,
    setIsEmpty
}) => {

    let limitList = [1, 10, 50, 100, 500, 1000]
    const [height, setHeight] = useState(100);
    const [showDropdownSelect, setShowDropdownSelect] = useState(false);
    const [limitSelect, setLimitSelect] = useState(10);
    const [pageSelect, setPageSelect] = useState(1);
    const [tsSelect, setTsSelect] = useState(10);
    const [search, setSearch] = useState('')
    const [show, setShow] = useState(true)

    const pageHeight = window.innerHeight;

    const minTopSpacing = 300;

    const maxHeight = pageHeight - minTopSpacing;
    function paginateState(arr, perPage, nextPage) {
        return arr.slice(perPage, nextPage);
    }

    const handleResize = (event, { size }) => {
        setHeight(size.height);
    };

    const handleChange = e => {
        const newSearchTerm = e.target.value;
        if (newSearchTerm.length == 0) {
            setState(actualData)
        }
        else {
            setState(actualData.filter(item => get(item, 'ItemCode', '').toLowerCase().includes(newSearchTerm.toLowerCase()) || get(item, 'ItemName', '').toLowerCase().includes(newSearchTerm.toLowerCase())))
        }
        setSearch(newSearchTerm);
    };

    const changeValue = (value, itemCode) => {
        let indexAct = actualData.findIndex(el => get(el, 'ItemCode', '') == itemCode)
        let indexState = state.findIndex(el => get(el, 'ItemCode', '') == itemCode)
        if (indexAct >= 0) {
            actualData[indexAct].value = value
            setActualData([...actualData])
        }
        if (indexState >= 0) {
            state[indexState].value = value
            setState([...state])
        }
    }

    useEffect(() => {
        if (actualData.length == 0) {
            setSearch('')
        }
    }, [actualData])

    return (
        <Style>
            {
                (actualData.length) ? (
                    <ResizableBox
                        width={Infinity}
                        height={height}
                        minConstraints={[Infinity, 100]}
                        maxConstraints={[Infinity, maxHeight]}
                        resizeHandles={['n']}
                        onResize={handleResize}
                        axis="y"
                        style={{
                            position: 'fixed',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            backgroundColor: '#F7F8F9'
                        }}
                    >
                        <div style={{ width: '100%', height: '100%' }}>
                            <div style={{
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                backgroundColor: 'transparent'
                            }} className="select-items">
                                <div className='container' style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                                    <div className='right-head select-items-filter'>
                                        <div className='right-pagination'>
                                            <p className='pagination-text'><span>{pageSelect}-{tsSelect}</span> <span>of {allPageLengthSelect}</span> </p>
                                            <button onClick={() => {
                                                if (pageSelect > 1) {
                                                    setPageSelect(pageSelect - limitSelect);
                                                    setTsSelect(tsSelect - limitSelect)
                                                }
                                            }} disabled={pageSelect == 1} className={`pagination-button left-pagination bg-white ${pageSelect == 1 ? 'opcity-5' : ''}`}>
                                                <img src={pagination} alt="arrow-button-pagination" />
                                            </button>

                                            <button onClick={() => {
                                                if (tsSelect < allPageLengthSelect) {

                                                    setPageSelect(pageSelect + limitSelect)
                                                    setTsSelect(limitSelect + tsSelect)
                                                }
                                            }} disabled={tsSelect >= allPageLengthSelect} className={`pagination-button margin-right bg-white ${tsSelect >= allPageLengthSelect ? 'opcity-5' : ''}`}>
                                                <img src={pagination} alt="arrow-button-pagination" />
                                            </button>
                                        </div>
                                        <div className='right-input'>
                                            <img className='right-input-img' src={searchImg} alt="search-img" />
                                            <input onChange={handleChange} value={search} type="text" className='right-inp bg-white' placeholder='Поиск' />
                                        </div>
                                        <button className='right-filter bg-white'>
                                            <img className='right-filter-img' src={filterImg} alt="filter-img" />
                                        </button>
                                        <div className='right-limit'>
                                            <button onClick={() => setShowDropdownSelect(!showDropdownSelect)} className='right-dropdown bg-white'>
                                                <p className='right-limit-text'>{limitSelect}</p>
                                                <img src={arrowDown} className={showDropdownSelect ? "up-arrow" : ""} alt="arrow-down-img" />
                                            </button>
                                            <ul className={`dropdown-menu bg-white ${showDropdownSelect ? "display-b" : "display-n"}`} aria-labelledby="dropdownMenuButton1">
                                                {
                                                    limitList.map((item, i) => {
                                                        return (<li key={i} onClick={() => {
                                                            if (limitSelect != item) {
                                                                setLimitSelect(item);
                                                                setPageSelect(1);
                                                                setShowDropdownSelect(false);
                                                                setTsSelect(item)
                                                            }
                                                            return
                                                        }} className={`dropdown-li ${limitSelect == item ? 'dropdown-active' : ''}`}><a className="dropdown-item" href="#">{item}</a></li>)
                                                    })
                                                }
                                            </ul>
                                        </div>

                                    </div>
                                    <div className='table tab-table'>
                                        <div className='table-head'>
                                            <ul className='table-head-list d-flex align  justify'>
                                                <li className='table-head-item w-50'>
                                                    Код
                                                </li>
                                                <li className='table-head-item'>Продукция / Производитель </li>
                                                <li className='table-head-item'>Модел</li>
                                                <li className='table-head-item'>Netto/Brutto</li>
                                                <li className='table-head-item'>Цена</li>
                                                <li className='table-head-item'>Остаток</li>
                                                <li className='table-head-item'>Количество</li>
                                                <li className='table-head-item'>В кейсе</li>
                                                <li className='table-head-item w-47px'>
                                                    <button onClick={() => {
                                                        setMainData([...state, ...mainData])
                                                        setState([])
                                                        setActualData([])
                                                        setAllPageLength(allPageLength + state.length)
                                                        setAllPageLengthSelect(0)
                                                        setLimitSelect(10)
                                                        setPageSelect(1)
                                                        setTsSelect(10)
                                                    }} className='table-head-check-btn'>
                                                        <img src={allRemove} alt="tick" />
                                                    </button>
                                                </li>
                                            </ul>
                                        </div>
                                        <div className='table-body'>
                                            {
                                                (
                                                    <ul className='table-body-list'>
                                                        {
                                                            paginateState(state, pageSelect - 1, tsSelect).map((item, i) => {
                                                                return (
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
                                                                                    {get(item, 'U_U_netto', '-') || '-'}/{get(item, 'U_U_brutto', '-') || '-'}
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
                                                                                    <input value={get(item, 'value', '')} onChange={(e) => changeValue(e.target.value, get(item, 'ItemCode', ''))} type="text" className={`table-body-inp bg-white ${(isEmpty && item?.value.length == 0) ? 'borderRed' : ''}`} placeholder='-' />
                                                                                </p>
                                                                            </div>
                                                                            <div className='w-100 p-16' >
                                                                                <p className='table-body-text '>
                                                                                    <input type="text" className='table-body-inp bg-white' placeholder='100  /кор' />
                                                                                </p>
                                                                            </div>
                                                                            <div className='w-47px p-16' >
                                                                                <button onClick={() => {
                                                                                    setState([...state.filter(el => get(el, 'ItemCode') !== get(item, 'ItemCode'))])
                                                                                    setActualData([...actualData.filter(el => get(el, 'ItemCode') !== get(item, 'ItemCode'))])
                                                                                    setMainData([item, ...mainData])
                                                                                    setAllPageLength(allPageLength + 1)
                                                                                    setAllPageLengthSelect(allPageLengthSelect - 1)
                                                                                }} className='table-body-text table-head-check-btn'>
                                                                                    <img src={remove} alt="add button" />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </li>
                                                                )
                                                            })
                                                        }
                                                    </ul>)
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </ResizableBox>
                ) : ''
            }
        </Style>
    )
});


export default Resizable;