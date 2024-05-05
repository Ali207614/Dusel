import React from 'react';
import Style from './Style';
import Layout from '../../components/Layout';
import Button from '../../components/Button';
import {useTranslation} from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18next from 'i18next';

const Home = () => {
  const {t} = useTranslation();

  const changeLanguage = ln => {
    AsyncStorage.setItem('lan', ln);
    i18next.changeLanguage(ln);
  };

  // yarn run babel -f .babelrc 'src/**/*.{js,jsx,ts,tsx}'
  // 👆 bu commanda barcha t ga o'ralgan key larni yig'ib beradi

  return (
    <Style>
      <Layout>
        <h1>{t('Uy')}</h1>
        {/* 👆 har bir language almashadigan joyda, so'zlarni t ga o'rab ketasiz */}

        <Button onClick={() => changeLanguage('uz')}>UZ</Button>
        <Button onClick={() => changeLanguage('ru')}>RU</Button>
      </Layout>
    </Style>
  );
};

export default Home;
