import styled from "styled-components";

const Style = styled.div`
  .container {
    padding-right: 15px;
    padding-left: 15px;
    margin-right: auto;
    margin-left: auto;
    width: 1400px;
  }
  .inner-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .display-block {
    display: block;
  }
  .left-side: {
    display: flex;
    align-items: center;
  }
  .df {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .circle {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background-color: #f4f4f4;
    display: flex;
    justify-content: center;
    align-items: center;
    
    color: #3C3F47;
    text-align: center;
    font-variant-numeric: lining-nums tabular-nums stacked-fractions;
    font-feature-settings: 'clig' off, 'liga' off;
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    line-height: 18px; /* 150% */
  }
  .textMain {
    color:  #3c3f47;
    text-align: center;
    font-variant-numeric: lining-nums tabular-nums stacked-fractions;
    font-feature-settings: "clig" off, "liga" off;
    margin-left:12px;
    font-size: 14px;
    font-style: normal;
    font-weight: 500;
    line-height: 20px; /* 142.857% */
  }
  .main {
    padding: 19px 0;
    border-bottom: 1px solid #e9e9e9;
  }
  .topLogo {
    width: 98px;
    height: 28px;
  }
`;
export default Style;
