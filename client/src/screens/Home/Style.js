import styled from "styled-components";

const Style = styled.div`

  li{
    list-style: none;
  }

  .container {
    padding-right: 15px;
    padding-left: 15px;
    margin-right: auto;
    margin-left: auto;
    width: 1400px;
  }

  .left-title {
    color: #3c3f47;
    font-feature-settings: "clig" off, "liga" off;
    font-size: 20px;
    font-style: normal;
    font-weight: 700;
    line-height: 24px; /* 120% */
  }

  .right-inp{
    border-radius: 8px;
    background:  #F7F8F9;
    width: 219px;
    padding:10px 16px 10px 46px;
    outline:none;
    border:none;
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
  .head{
    display:flex;
    align-items:center;
    justify-content: space-between;
    margin:24px 0;
  }
  .right-head{
    display:flex;
    align-items:center;
  }
  .btn-head{
    width: 121px;
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
  .right-filter{
    outline:none;
    border:none;
    width:36px;
    height:36px;
    background:  #F7F8F9;
    border-radius: 8px;
    margin:0 6px;
  }
  .right-limit{
    position:relative;
    margin-right: 12px;
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
  .display-n{
    display:none;
  }
  .display-b{
    display:block;
  }
  .up-arrow{
    transform: rotate(180deg);
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
    margin: 0 12px;
    width: 130px;
  }
  .opcity-5{
    opacity:0.5;
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
  .m-right-16{
    margin-right:16px;
  }

  .table-body-text{
    color:  #3C3F47;
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
  }
  .table-head-list{
    padding:16px;
    border-left: 1px solid transparent;
    border-right: 1px solid transparent;
  }
  .table-body-item{
    border-left: 1px solid transparent;
    border-right: 1px solid transparent;
  }
  
  .table-item-head{
    border-top: 1px solid #E9E9E9;
    padding:0 16px;
  }
  
  .active-table{
    border-left: 1px solid #E9E9E9;
    border-right: 1px solid #E9E9E9;
    background: #F7F8F9; 
    .table-item-foot{
      padding:16px;
      display:flex;
      border-top: 1px solid #E9E9E9;
    }
  }

  .table-item-foot{
    display:none;
  }
  .table-head-item{
    color:  #585858;
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
    width: 100%;
  }
  .p-16{
    padding:16px 0;
  }
 
  .table-item-btn{
    border-radius: 8px;
    border: 1px solid  #E9E9E9;
    background: #FFF;
    padding:2px 12px;
    margin-right:12px;
  }
`;
export default Style;
