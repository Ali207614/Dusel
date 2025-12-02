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
import { sendExcelAct } from './excel';

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
  let [priceLists, setPriceList] = useState([]);
  let [color, setColor] = useState("#ffffff");

  const [mode, setMode] = useState('add'); // add | edit | view
  const [partner, setPartner] = useState({
    CardCode: '',
    CardName: '',
    Phone1: '',
    Phone2: '',
    Currency: 'UZS',
    Balance: 0,
    U_discount: 'no',
  });

  useEffect(() => {
    const ref = {
      open: (data, type) => {
        setIsOpenModal(true);
        setLoading(false)
        setMode(type);
        if ((type === 'edit' || type === 'view') && data) {
          console.log(data)
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
        getPriceList()

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
        Series: 72,
        PriceListNum: partner.ListNum,
        "Currency": "##",
        U_discount: partner.U_discount
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

  const getPriceList = async () => {
    try {
      let priceList = await axios.get(
        url + `/api/price-list`,
        {
          headers: {
            info: JSON.stringify({
              'Cookie': get(getMe, 'Cookie[0]', '') + get(getMe, 'Cookie[1]', ''),
              'SessionId': get(getMe, 'SessionId', ''),
            })
          },
        }
      );
      setPriceList(priceList?.data?.value || [])
    } catch (err) {
      errorNotify && errorNotify("Price List olib kelishda xatolik yuz berdi");
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
        PriceListNum: partner.ListNum,
        U_discount: partner.U_discount
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

              <select
                disabled={mode === 'view'}
                value={partner.U_discount}
                onChange={(e) => handleChange('U_discount', e.target.value)}
                className='filter-inp'
              >
                <option value="yes">Есть</option>
                <option value="no">Нет</option>
              </select>
              {/* <div className='filter-manager'>
                <h3 className='filter-title'>Прайс-лист</h3>
                <select
                  value={+partner.ListNum}
                  onChange={(e) => handleChange('ListNum', e.target.value)}
                  className='filter-inp'
                >
                  {priceLists
                    .map(pl => (
                      <option key={+pl.ListNum} value={+pl.ListNum}>
                        {pl.ListName}
                      </option>
                    ))}
                </select>
              </div> */}

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

            <button
              className='btn-excel'
              onClick={async () => {
                try {
                  setLoading(true);
                  const { data: rows } = await axios.get(
                    `${url}/api/act?CardCode=${partner.CardCode}`,
                    {
                      headers: {
                        info: JSON.stringify({
                          Cookie: get(getMe, 'Cookie[0]', '') + get(getMe, 'Cookie[1]', ''),
                          SessionId: get(getMe, 'SessionId', ''),
                        }),
                      },
                    }
                  );

                  if (!Array.isArray(rows) || rows.length === 0) {
                    errorNotify("Ma'lumot topilmadi");
                  } else {
                    await sendExcelAct(rows);
                    successNotify("Excel yaratildi");
                  }
                  setLoading(false);
                } catch (e) {
                  errorNotify("Excel yaratishda xatolik");
                } finally {
                  setLoading(false);
                }
              }}
            >
              Download as Excel
            </button>

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
