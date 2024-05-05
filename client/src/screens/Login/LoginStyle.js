import styled from "styled-components";
import colors from "../../assets/style/colors";

const LoginStyle = styled.div`
  .mainContainer {
    height: 100vh;
    padding: 20px;
    background-size: 150%;
    box-sizing: border-box;
    background-position: center center;
    background-repeat: no-repeat;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .text {
    color: green;
  }

  .container {
    height: 70%;
    width: 70%;
    margin:0 auto;
  }
  .logo{
    margin-bottom:20px;
  }
  .logoImg{
    display: block;
    margin-left: auto;
    margin-right: auto;
  }
  .loginMain{
    width: 510px;
    margin: 0 auto;
  }
  .loginInput{
    width: 100%;
    border:1px solid #DFE1E6;
    border-radius: 12px;
    outline:none;
    padding: 20px 16px;
    margin-top:16px;
    
  }
  .loginInput::-webkit-input-placeholder {
    font-size:16px;
    font-weight:400;
    line-height:24px;
    color:#A4ABB8;
  }
  .passwordGroup{
    position:relative;
    margin-top:16px;
  }
  .eye-off{
    position:absolute;
    right: 12px;
    top: 0;
    bottom: 0;
    margin: auto;
    width: 22px;
    height: 20px;
  }
  .loginBtn{
    width: 100%;
    border-radius: 12px;
    outline:none;
    background-color:#F2462F;
    height:56px;
    font-size:16px;
    font-weight:600;
    line-height:24px;
    color:white;
    border:none;
    margin-top:30px;
  }
  .passwordInput{
    margin-top:0px
  }
`;
export default LoginStyle;
