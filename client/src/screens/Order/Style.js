import styled from "styled-components";

const Style = styled.div`
.container {
    padding-right: 15px;
    padding-left: 15px;
    margin-right: auto;
    margin-left: auto;
    width: 1400px;
  }
  .btn-head{
    width:121px;
    padding: 9px 12px;
    border-radius:  8px;
    background:  #F2462F;

    color:  #FFF;
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    line-height: 18px;
    text-align:center;
    outline:none;
    border:none;
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
  .order-main{
    margin:24px 0;
  }
  .display-n{
    display:none;
  }
  .display-b{
    display:block;
  }
  .d-flex{
    display:flex;
  }

  .align{
    align-items:center;
  }

  .justify{
    justify-content:space-between;
  }
  .w-100{
    width:100%;
  }

  .order-inp{
    border-radius: 8px;
    background:  #F7F8F9;
    width: 219px;
    padding:  10px 16px ;
    outline:none;
    border:none;
    border: 1px solid #E9E9E9;
    width:24%;
  }
  .order-inp::-webkit-input-placeholder {
    color: #3C3F47;
    font-variant-numeric: lining-nums tabular-nums stacked-fractions;
    font-feature-settings: 'clig' off, 'liga' off;
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    line-height: 24px;
  }


  .right-head{
    display:flex;
    align-items:center;
    justify-content: end;
  }
  .right-inp{
    border-radius: 8px;
    background:  #F7F8F9;
    width: 219px;
    padding:10px 16px 10px 46px;
    outline:none;
    border:none;
    border: 1px solid #E9E9E9;
  }
  .right-input{
    position:relative;
    display:inline-block;
  }
  .right-input-img{
    position:absolute;
    top: 0;
    bottom: 0;
    margin: auto;
    left: 16px;
  }
  .right-inp::-webkit-input-placeholder {
    color: #3C3F47;
    font-variant-numeric: lining-nums tabular-nums stacked-fractions;
    font-feature-settings: 'clig' off, 'liga' off;
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    line-height: 24px;
  }
  .right-filter{
    outline:none;
    border:none;
    width:36px;
    height:36px;
    background:  #F7F8F9;
    border-radius: 8px;
    margin:0 6px;
    border: 1px solid #E9E9E9;

  }
  .right-limit{
    position:relative;
  }
  .right-limit-text{
    color:  #3C3F47;
    font-variant-numeric: lining-nums tabular-nums stacked-fractions;
    font-feature-settings: 'clig' off, 'liga' off;
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    line-height: 24px; 
  }
  .right-dropdown{
    outline:none;
    border:none;
    width:98px;
    height:36px;
    background:  #F7F8F9;
    border-radius: 8px;
    display:flex;
    align-items:center;
    justify-content: space-between;
    padding:0 16px;
    border: 1px solid  #E9E9E9;

  }
  .dropdown-menu{
    position:absolute;
    width:100%;
    
    box-shadow: 2px 2px 2px 1px rgba(0, 0, 0, 0.2);
    top: 38px;
    border-radius: 4px;
  }
  .dropdown-item{
    color:  #3C3F47;
    font-variant-numeric: lining-nums tabular-nums stacked-fractions;
    font-feature-settings: 'clig' off, 'liga' off;
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    line-height: 24px; 
   text-decoration:none;
   padding:0 16px;
  }
  .dropdown-li{
    list-style:none;
    background:  #F7F8F9;
  }
  .dropdown-li:hover{
    background:  #dadcde;
  }

  .dropdown-active{
    background:  #dadcde;
  }
  .right-pagination{
    display:flex;
    align-items:center;
  }
  .pagination-button{
    border-radius: 12px;
    border: 1px solid  #E9E9E9;
    background: #FFF;
    width: 36px;
    height: 36px;
    padding: 8px;
    margin-left: 6px;
  }
  .left-pagination{
    transform: rotate(180deg);
  }
  .pagination-text{
    color: var(--Grey-Grey--500, #A4A4A4);
    font-variant-numeric: lining-nums tabular-nums stacked-fractions;
    font-feature-settings: 'clig' off, 'liga' off;
    font-family: "Inter Tight";
    font-size: 14px;
    font-style: normal;
    font-weight: 500;
    line-height: 20px; 
    margin-right: 12px;
    width:130px;
    text-align: end;
  }
  .opcity-5{
    opacity:0.5;
  }
  .order-head-filter{
    margin:24px 0;
  }
  .margin-right{
    margin-right:12px;
  }
`;
export default Style;
