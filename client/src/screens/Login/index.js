import React, { useState, useCallback, useRef } from 'react';
import LoginStyle from './LoginStyle';
import { useDispatch, useSelector } from 'react-redux';
import { main } from '../../store/slices';
import { get } from 'lodash';
import { useNavigate } from 'react-router-dom';
import { ErrorModal } from '../../components/Modal';
import { useTranslation } from 'react-i18next';
import Logo from '../../assets/images/login_logo.svg';
import colors from '../../assets/style/colors';
import offEye from '../../assets/images/off_eye.svg';
import onEye from '../../assets/images/on_eye.svg';
import axios from 'axios';
import { ClipLoader } from "react-spinners";

let url = process.env.REACT_APP_API_URL
let db = process.env.REACT_APP_API_COMPANY_DB
const override = {
  // position: "absolute",
  // left: "50%",
  // top: "0",
  // bottom: 0,
  // margin: 'auto'
};

const Login = () => {

  const { t } = useTranslation();
  const { setMe, setUserType, setAccounts } = main.actions;

  const { info } = useSelector(state => state.main);

  const loginValue = get(info, 'login', '');
  const passwordValue = get(info, 'password', '');

  const dispatch = useDispatch();

  const navigate = useNavigate();

  const [login, setLogin] = useState(loginValue);
  const [password, setPassword] = useState(passwordValue);
  const [eye, setEye] = useState(false);

  let [loading, setLoading] = useState(false);
  let [color, setColor] = useState("#ffffff");

  const errorRef = useRef();

  const getErrorRef = useCallback(ref => {
    errorRef.current = ref;
  }, []);


  const loginFn = (e) => {
    e.preventDefault()
    setLoading(true)
    axios
      .post(
        url + "/b1s/v1/Login",
        {
          UserName: login,
          Password: password,
          CompanyDB: db,
        },

      )
      .then(({ data }) => {
        dispatch(setMe({
          'Cookie': get(data, 'set-cookie', ''),
          'SessionId': get(data, 'SessionId', '')
        }));
        dispatch(setUserType(data?.userType));
        console.log(data)
        dispatch(setAccounts([
          { cardAcct: data?.cardAcct && data.cardAcct.trim().toString(), name: "Terminal", currency: "UZS" },
          { acctMainCashbox: data?.acctMainCashbox && data.acctMainCashbox.trim().toString(), name: "Naqd", currency: "USD" },
          //{ ePaymentAcct: data?.ePaymentAcct && data.ePaymentAcct.trim().toString() },
          { bankTransferAcct: data?.bankTransferAcct && data.bankTransferAcct.trim().toString(), name: "Perichisleniya", currency: 'UZS' }
        ]));
        setLoading(false)
        navigate('/home');
      })
      .catch(err => {
        setLoading(false);
        errorRef.current?.open(get(err, 'response.data.error.message.value', 'Ошибка логина или пароля'));
      });
  };

  return (
    <>


      <LoginStyle>
        <div className="mainContainer">
          <div className="container">
            <div className='logo'>
              <img className='logoImg' src={Logo} alt="logo" />
            </div>
            <div className='loginMain'>
              <form >
                <input onChange={(e) => setLogin(e.target.value)} className='loginInput' type="text" placeholder='Username' value={login} />
                <div className='passwordGroup'>
                  <img onClick={() => setEye(!eye)} className='eye-off' src={!eye ? offEye : onEye} alt="logo" />
                  <input onChange={(e) => setPassword(e.target.value)} className='loginInput passwordInput' type={!eye ? "password" : "text"} placeholder='Password' value={password} />
                </div>

                <button onClick={loginFn} className='loginBtn'>
                  {loading ? <ClipLoader color={color} loading={loading} cssOverride={override} size={25} /> : ("Sign in")}
                </button>
              </form>
            </div>
          </div>
        </div>
      </LoginStyle>
      <>
        <ErrorModal
          getRef={getErrorRef}
          title={t('Ошибка логина или пароля, проверьте еще раз')}
        />
      </>
    </>
  );
};

export default Login;
