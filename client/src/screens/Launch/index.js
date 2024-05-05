import React, { useEffect } from 'react';
import LaunchStyle from './LaunchStyle';
import { useNavigate } from 'react-router-dom';
import Logo from '../../assets/images/big_logo.png';

const Launch = () => {
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => {
      navigate('/home');
    }, 2000);
  }, []);

  return (
    <LaunchStyle>
      <div className="container">
        <img src={Logo} alt="logo" className="img" />
      </div>
    </LaunchStyle>
  );
};

export default Launch;
