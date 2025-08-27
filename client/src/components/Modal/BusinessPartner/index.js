import React, { memo, useEffect, useState } from 'react';
import Styles from './Styles';
import Modal from 'react-modal';
import { useTranslation } from 'react-i18next';
import CloseFilter from '../../../assets/images/close.svg';
import { get } from 'lodash';
import axios from 'axios';
import formatterCurrency from '../../../helpers/currency';
import { errorNotify, successNotify } from '../../Helper';
import { useSelector, useDispatch } from 'react-redux';
import { ClipLoader } from 'react-spinners';

let url = process.env.REACT_APP_API_URL
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

const override = {
  // position: "absolute",
  // left: "50%",
  // top: "0",
  // bottom: 0,
  // margin: 'auto'
};

const BusinessPartnerModal = ({ getRef }) => {
  const { t } = useTranslation();
  const { getMe, getFilter, userType } = useSelector(state => state.main);
  const [isOpenModal, setIsOpenModal] = useState(false);
  let [loading, setLoading] = useState(false);
  let [color, setColor] = useState("#ffffff");

  const [mode, setMode] = useState('add'); // add | edit | view
  const [partner, setPartner] = useState({
    CardCode: '',
    CardName: '',
    Phone1: '',
    Phone2: '',
    Currency: 'UZS',
    Balance: 0,
  });

  useEffect(() => {
    const ref = {
      open: (data, type) => {
        setIsOpenModal(true);
        setMode(type);
        if ((type === 'edit' || type === 'view') && data) {
          setPartner(data);
        } else {
          setPartner({
            CardCode: '',
            CardName: '',
            Phone1: '',
            Phone2: '',
            Currency: 'UZS',
            Balance: 0,
          });
        }
      },
      close: () => setIsOpenModal(false),
    };
    getRef(ref);
  }, []);

  const handleChange = (key, value) => {
    setPartner(prev => ({ ...prev, [key]: value }));
  };

  // ADD
  const handleAdd = async () => {
    try {
      setLoading(true)
      const body = {
        CardName: partner.CardName,
        Phone1: partner.Phone1,
        Phone2: partner.Phone2,
        CardType: "C",
        GroupCode: userType === 'Tools' ? 111 : 100,
        Series: 72
      };

      await axios.post(
        url + '/b1s/v1/BusinessPartners',
        body,
        {
          headers: {
            info: JSON.stringify({
              'Cookie': get(getMe, 'Cookie[0]', '') + get(getMe, 'Cookie[1]', ''),
              'SessionId': get(getMe, 'SessionId', ''),
            })
          },
        }
      );

      setLoading(false)
      successNotify && successNotify('Клиент успешно добавлен');
      setIsOpenModal(false);

    } catch (err) {
      setLoading(false)
      if (get(err, 'response.status') === 401) {
        window.location.href = '/login';
        return;
      }
      errorNotify && errorNotify(get(err, 'response.data.error.message.value', 'Ошибка'));
    }
  };

  // UPDATE
  const handleUpdate = async () => {
    try {
      setLoading(true)

      const body = {
        CardName: partner.CardName,
        Phone1: partner.Phone1,
        Phone2: partner.Phone2,
      };

      await axios.patch(
        url + `/b1s/v1/BusinessPartners('${partner.CardCode}')`,
        body,
        {
          headers: {
            info: JSON.stringify({
              'Cookie': get(getMe, 'Cookie[0]', '') + get(getMe, 'Cookie[1]', ''),
              'SessionId': get(getMe, 'SessionId', ''),
            })
          },
        }
      );
      setLoading(false)
      successNotify && successNotify('Клиент успешно обновлен');
      setIsOpenModal(false);
    } catch (err) {
      if (get(err, 'response.status') === 401) {
        window.location.href = '/login';
        setLoading(true)

        return;
      }
      setLoading(true)

      errorNotify && errorNotify(get(err, 'response.data.error.message.value', 'Ошибка'));
    }
  };

  const savePartner = () => {
    if (mode === 'add') {
      handleAdd();
    } else if (mode === 'edit') {
      handleUpdate();
    }
  };

  return (
    <Modal
      isOpen={isOpenModal}
      onRequestClose={() => setIsOpenModal(false)}
      style={customStyles}
      ariaHideApp={false}>
      <Styles>
        <div className="card df">
          <div className='card-left'>
            <h2 className='card-left-title'>
              {mode === 'add' ? 'Добавить Клиент' : mode === 'edit' ? 'Редактировать Клиент' : 'Информация Клиента'}
            </h2>
          </div>
          <div className='card-right' style={{ position: 'relative' }}>
            <button onClick={() => setIsOpenModal(false)} className='close-filter'>
              <img src={CloseFilter} alt="close" />
            </button>
            <div className='card-filter'>

              <div className='filter-manager'>
                <h3 className='filter-title'>Название клиента</h3>
                <input
                  disabled={mode === 'view'}
                  value={partner.CardName}
                  onChange={(e) => handleChange('CardName', e.target.value)}
                  className='filter-inp'
                  type="text"
                />
              </div>

              <div className='filter-manager'>
                <h3 className='filter-title'>Телефон 1</h3>
                <input
                  disabled={mode === 'view'}
                  value={partner.Phone1}
                  onChange={(e) => handleChange('Phone1', e.target.value)}
                  className='filter-inp'
                  type="text"
                />
              </div>

              <div className='filter-manager'>
                <h3 className='filter-title'>Телефон 2</h3>
                <input
                  disabled={mode === 'view'}
                  value={partner.Phone2}
                  onChange={(e) => handleChange('Phone2', e.target.value)}
                  className='filter-inp'
                  type="text"
                />
              </div>

              <div className='filter-manager'>
                <h3 className='filter-title'>Валюта</h3>
                <select
                  disabled={mode === 'view'}
                  value={partner.Currency}
                  onChange={(e) => handleChange('Currency', e.target.value)}
                  className='filter-inp'
                >
                  <option value="UZS">UZS</option>
                  <option value="USD">USD</option>
                  <option value="ALL">Все валюты</option>
                </select>
              </div>

              {mode === 'view' && (
                <div className='filter-manager'>
                  <h3 className='filter-title'>Баланс</h3>
                  <input
                    disabled
                    value={formatterCurrency(Number(partner?.Balance || 0), 'USD')}
                    className='filter-inp'
                    type="text"
                  />
                </div>
              )}

            </div>

            <div className='card-buttons'>
              {(mode === 'add' || mode === 'edit') && (
                <button className='card-btn-filter' onClick={savePartner}>

                  {loading ? <ClipLoader color={color} loading={loading} cssOverride={override} size={25} /> : (mode === 'add' ? 'Добавить' : 'Сохранить')}
                </button>
              )}
            </div>
          </div>
        </div>
      </Styles>
    </Modal>
  );
};

export default memo(BusinessPartnerModal);
