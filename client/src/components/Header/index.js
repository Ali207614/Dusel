import React from 'react';
import Style from './Style';
import TopImage from '../../assets/images/big_logo.png';
import {useTranslation} from 'react-i18next';
import {get} from 'lodash';

const Header = () => {
  const {t} = useTranslation();
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
      <img src={TopImage} alt="top logo" className="topLogo" />
      <div className="centerCard">
        <ul className="mainMenu">
          {menuData.map((v, i) => {
            return (
              <li>
                <button className={'btn'}>{get(v, 'title', '')}</button>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="rightCard">
        <p>Log uout</p>
      </div>
    </Style>
  );
};

export default Header;
