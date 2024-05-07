import React from 'react';
import Style from './Style';
import TopImage from '../../assets/images/logo.svg';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash';

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
            <a className='display-block' href="/home">
              <img src={TopImage} alt="top logo" className="topLogo" />
            </a>
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
