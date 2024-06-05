import { get } from 'lodash';
import moment from 'moment';
import React from 'react';

const InvoiceHeader = ({ header }) => {
    return (
        <div className="invoice-header">
            <h2>Накладная: №  от {moment(get(header, '[0].DocDate')).format('DD.MM.YYYY')}</h2>
            <div className="invoice-info">
                <div>
                    <p>Контрагент : {get(header, '[0].CardName')}</p>
                    <p>ИНН: {get(header, 'inn')}</p>
                    <p>Район: {get(header, 'region')}</p>
                    <p>Адрес: {get(header, 'address')}</p>
                    <p>Ориентир: {get(header, 'landmark')}</p>
                </div>
                <div>
                    <p>Телефон: {get(header, 'phone')}</p>
                    <p>ТП: {get(header, '[0].SLP')}</p>
                    <p>Тел. ТП: {get(header, 'tpPhone')}</p>
                </div>
            </div>
        </div>
    );
};


export default InvoiceHeader;