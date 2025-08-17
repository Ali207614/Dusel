import { get } from 'lodash';
import React, { useEffect } from 'react';

const InvoiceTable = ({ total = false, items, setItems, draft = false }) => {

    let sumWithoutDisCount = items?.length ? items.reduce((a, b) => a + (Number(b.Quantity) * Number(get(b, 'PriceBefDi'))), 0) : 0


    useEffect(() => {
        if (draft) {
            setItems(items.map((el, i, self) => {
                let discountPrice = Number(get(el, 'PriceBefDi')) - (Number(get(el, 'PriceBefDi')) * Number(get(el, 'DiscPrcnt', 5)) / 100)
                return {
                    ...el,
                    Price: discountPrice,
                    LineTotal: discountPrice * Number(get(el, 'Quantity')).toFixed(2),
                }
            }).map((el, i, self) => {
                return { ...el, DocTotal: self.reduce((a, b) => a + get(b, 'LineTotal'), 0) }
            }))
        }
    }, []);


    return (
        <table>
            <thead>
                <tr>
                    <th>№</th>
                    <th>Код</th>
                    <th>Продукция</th>
                    <th>Кол-во (в кейсе)</th>
                    <th>Кол-во (в шт.)</th>
                    {
                        total ? <>
                            <th>Цена</th>
                            <th>Скидка/наценка</th>
                            <th>Цена с наценкой</th>
                            <th>Сумма</th>
                        </> : ''
                    }
                </tr>
            </thead>
            <tbody>
                {items.map((item, i) => {
                    return (<tr key={i + 1}>
                        <td>{i + 1}</td>
                        <td>{get(item, 'U_model')}</td>
                        <td>{get(item, 'ItemName')}</td>
                        <td>{parseFloat((Number(get(item, 'Quantity')) / Number(get(item, 'U_Karobka', 1))).toFixed(2))}</td>
                        <td>{Number(get(item, 'Quantity'))}</td>
                        {
                            total ? (
                                <>
                                    <td>{Number(get(item, 'PriceBefDi'))}</td>
                                    <td>-{Number(get(item, 'DiscPrcnt', 0))}%</td>
                                    <td>{parseFloat(Number(get(item, 'Price')).toFixed(3))}</td>
                                    <td>{parseFloat(Number(get(item, 'LineTotal')).toFixed(2))}</td>
                                </>
                            ) : ''
                        }
                    </tr>)
                })}
            </tbody>
            <tfoot>
                <tr>
                    <td {...(total ? { rowSpan: 4 } : {})} colSpan="3">Итого</td>
                    <td> {parseFloat((items?.length ? items.reduce((a, b) => a + (Number(get(b, 'Quantity')) / Number(get(b, 'U_Karobka', 1))), 0) : 0).toFixed(4))}</td>
                    <td>{parseFloat((items?.length ? items.reduce((a, b) => a + Number(b.Quantity), 0) : 0).toFixed(4))}</td>
                    {
                        total ? (
                            <>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td>{sumWithoutDisCount.toFixed(2)}</td>
                            </>
                        ) : ""
                    }
                </tr>

                {
                    total ? (
                        <>
                            <tr>
                                <td colSpan="5">Сумма переоценки (к заказу)</td>
                                <td>{(sumWithoutDisCount - Number(get(items, '[0].DocTotal', 0))).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td colSpan="5">Сумма с учётом переоценки</td>
                                <td>{Number(get(items, '[0].DocTotal', 0)).toFixed(2)}</td>
                            </tr>
                        </>
                    ) : ''
                }
            </tfoot>
        </table>
    );
};


export default InvoiceTable;