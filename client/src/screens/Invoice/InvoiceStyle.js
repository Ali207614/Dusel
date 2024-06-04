import styled from "styled-components";

const ConsignmentStyle = styled.div`
  .invoice {
    padding: 20px;
}
.container {
    padding-right: 15px;
    padding-left: 15px;
    margin-right: auto;
    margin-left: auto;
    width: 1400px;
  }
.order-main{
    margin:24px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
.btn-back{
    border-radius:  8px;
    background:  #F4F4F4;
    padding: 9px 12px;

    color:  #1C1C1C;
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    line-height: 18px;
    text-align:center;
    outline:none;
    border:none;
  }

h2 {
    text-align: center;
}

p {
    margin: 5px 0;
    color: #0D0D12;
/* Body/large/medium */
font-family: "Inter Tight";
font-size: 16px;
font-style: normal;
font-weight: 500;
line-height: 150%; /* 24px */
letter-spacing: 0.32px;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
}

table, th, td {
    border: 1px solid #000;
}

th, td {
    padding: 10px;
    text-align: center;
}

th {
    background-color: #e0e0e0;
}

tfoot {
    background-color: #e0e0e0;
}

tfoot td {
    font-weight: bold;
}
.invoice-info{
    display: flex;
    align-items: center;
    justify-content: space-between;
}
`;
export default ConsignmentStyle;
