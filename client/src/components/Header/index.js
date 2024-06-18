import React from 'react';
import Style from './Style';
import TopImage from '../../assets/images/Dusel_logo.svg';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash';
import { Link, NavLink } from 'react-router-dom';

const Header = () => {
  const { t } = useTranslation();
  const menuData = [
    {
      title: t('Menu'),
      path: '/menu',
    },
    {
      title: t('Menu2'),
      path: '/menu',
    },
    {
      title: t('Menu3'),
      path: '/menu',
    },
    {
      title: t('Menu4'),
      path: '/menu',
    },
  ];

  return (
    <Style>
      <div className="main">
        <div className='container'>
          <div className='inner-container'>
            <div className='d-flex align-items'>
              <a className='display-block' href="/home">
                <img width={114} height={32} src={TopImage} alt="top logo" className="topLogo" />
              </a>
              <nav className='navbar'>
                <ul className='d-flex align-items list'>
                  <li className='list-item'>
                    <NavLink
                      to="/home"
                      className={({ isActive }) => (`list-item-link ${isActive && 'opacity-1'} `)}
                    >
                      Заказ
                    </NavLink>
                  </li>
                  <li className='list-item'>
                    <NavLink
                      to="/return"
                      className={({ isActive }) => (` list-item-link ${isActive && 'opacity-1'} `)}
                    >
                      Возврат
                    </NavLink>
                  </li>
                </ul>
              </nav>
            </div>
            <div className='left-side df'>
              <span className='circle'>M</span>
              <p className='textMain'>Manager</p>
            </div>
          </div>
        </div>
      </div>


    </Style>
  );
};

export default Header;
