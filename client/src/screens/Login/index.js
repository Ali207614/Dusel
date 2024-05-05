import React, { useState, useCallback, useRef } from 'react';
import LoginStyle from './LoginStyle';
import { useDispatch, useSelector } from 'react-redux';
import { main } from '../../store/slices';
import api from '../../api';
import { get } from 'lodash';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import { ErrorModal } from '../../components/Modal';
import { useTranslation } from 'react-i18next';
import { AiFillEyeInvisible, AiFillEye } from 'react-icons/ai';
import Logo from '../../assets/images/login_logo.svg';
import colors from '../../assets/style/colors';
import offEye from '../../assets/images/off_eye.svg';
import onEye from '../../assets/images/on_eye.svg';
import axios from 'axios';


const Login = () => {
  const { t } = useTranslation();
  // 👆 bu til o'zgartirish uchun
  const { setMe } = main.actions;
  // 👆 bu redux ga qiymat olish uhcun

  const { info } = useSelector(state => state.main);
  // 👆 bu redux ga olingan ma'lumotni chaqirish uchun

  const loginValue = get(info, 'login', '');
  const passwordValue = get(info, 'password', '');

  const dispatch = useDispatch();
  // 👆 bu reduxga ma'lumotni olib borib beradi

  const navigate = useNavigate();
  // 👆 bu boshqa oynaga o'tish uchun

  const [login, setLogin] = useState(loginValue);
  const [password, setPassword] = useState(passwordValue);
  const [isLoading, setIsLoading] = useState(false);
  const [isShow, setIsShow] = useState(false);
  const [eye, setEye] = useState(false);

  const errorRef = useRef();

  const getErrorRef = useCallback(ref => {
    errorRef.current = ref;
  }, []);

  // Font lar bilan ishlash
  // zagruzka icon
  // error 

  const loginFn = (e) => {
    e.preventDefault()
    console.log(login, password)
    // setIsLoading(true);
    // axios
    //   .post(
    //     'https://ro-food-backend.bis-pro.com/api/login',
    //     {
    //       UserName: login,
    //       Password: password,
    //       Company: 'ROFOD_TEST',
    //     },
    //     {
    //       withCredentials: true,
    //     },
    //   )
    //   .then(res => {
    //     axios.defaults.headers.common['Authorization'] = `Bearer ${get(
    //       res,
    //       'data.SessionId',
    //       '',
    //     )}`;
    //     getProfile(get(res, 'data.SessionId', ''));
    //   })
    //   .catch(err => {
    //     setIsLoading(false);
    //     errorRef.current?.open('Ошибка логина или пароля');
    //   });
  };

  const getProfile = t => {
    console.log(t);
    axios
      .get('https://ro-food-backend.bis-pro.com/api/userData', {
        withCredentials: true,
      })
      .then(res => {
        dispatch(setMe(res.data));
      })
      .catch(err => {
        errorRef.current?.open('Информация о пользователе не найдена');
        setIsLoading(false);
        console.log(err);
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

                <button onClick={loginFn} className='loginBtn'>Sign in</button>
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
