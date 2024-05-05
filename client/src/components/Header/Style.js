import styled from 'styled-components';

const Style = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  .topLogo {
    width: 50px;
  }
  .mainMenu {
    li {
      display: inline;
      margin: 0 10px;
      padding: 0;
      .btn {
        margin: 0;
        background-color: #ffffff;
        border: none;
        padding: 7px 20px;
        border-radius: 10px;
        -webkit-box-shadow: -2px 0px 35px -10px rgba(0, 0, 0, 0.4);
        -moz-box-shadow: -2px 0px 35px -10px rgba(0, 0, 0, 0.4);
        box-shadow: -2px 0px 35px -10px rgba(0, 0, 0, 0.4);
      }
    }
  }
`;
export default Style;
