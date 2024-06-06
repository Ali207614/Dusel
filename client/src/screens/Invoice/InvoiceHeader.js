import { get } from 'lodash';
import moment from 'moment';
import React from 'react';


const InvoiceHeader = ({ header }) => {
    return (
        <div className="invoice-header">
            <h2>Накладная: №  от {moment(get(header, '[0].DocDate')).format('DD.MM.YYYY')}</h2>
            <div className="invoice-info">
                <div>
                    <p>Контрагент : {get(header, '[0].CardName', '')}</p>
                    <p>ИНН: {get(header, '[0].LicTradNum', '')}</p>
                    <p>Район: {get(header, 'region', '')}</p>
                    <p>Адрес: {get(header, '[0].Address', '')}</p>
                    <p>Ориентир: {get(header, 'landmark')}</p>
                    <p>Телефон: {get(header, '[0].Phone1', '')} , {get(header, '[0].Phone2', '')}</p>
                </div>
                <div>
                    <p>ТП: {get(header, '[0].SLP')}</p>
                    <p>Тел. ТП: {get(header, '[0].Mobil', '')}</p>
                </div>
            </div>
        </div>
    );
};


export default InvoiceHeader;