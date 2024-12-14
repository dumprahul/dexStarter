import React,{useEffect, useState} from 'react';
import{Input, Modal, Popover,Radio} from 'antd'
import {ArrowDownOutlined, DownOutlined, SettingOutlined} from '@ant-design/icons';
import tokenlist from"../tokenList.json";
import axios from 'axios';
import { useSendTransaction,useWaitForTransaction } from 'wagmi';

function Swap(props) {
  const{address,isConnected}=props;

  const[slippage,setSlippage]=useState(2.5);
  const[tokenOneAmount,settokenOneAmount]=useState(null);
  const[tokenTwoAmount,settokenTwoAmount]=useState(null);
  const[tokenOne,settokenOne]=useState(tokenlist[0]);
  const[tokenTwo,settokenTwo]=useState(tokenlist[1]);
  const[isOpen,setIsOpen]=useState(false);
  const[changeToken,setchangeToken]=useState(1);
  const[prices,setPrices]=useState(null);
  const[txDetails,setTxDetails]=useState({
    to:null,
    data:null,
    value:null,
  })

  const{data,sendTransaction}=useSendTransaction({
    request:{
      from:address,
      to: String(txDetails.to),
      data: String(txDetails.data),
      value: String(txDetails.value),
    }
  })


  function handleSlippageChange(e){
    setSlippage(e.target.value);
  }
  function changeAmount(e){

    settokenOneAmount(e.target.value);
    if(e.target.value&&prices){
      settokenTwoAmount((e.target.value*prices.ratio).toFixed(2));
    }else{
      settokenTwoAmount(null);
    }
  }
  function switchTokens(){
    setPrices(null);
    settokenOneAmount(null);
    settokenTwoAmount(null);
    const one=tokenOne;
    const two=tokenTwo;
    settokenOne(two);
    settokenTwo(one);
    settokenOne(two);
    settokenTwo(one);
    fetchPrices(two.address,one.address);
  }

  function openModel(asset){
    setchangeToken(asset);
    setIsOpen(true);
  }

  function modifyToken(i){
    setPrices(null);
    settokenOneAmount(null);
    settokenTwoAmount(null);
    if (changeToken===1){
      settokenOne(tokenlist[i]);
      fetchPrices(tokenlist[i].address,tokenTwo.address);
    }else{
      settokenTwo(tokenlist[i]);
      fetchPrices(tokenOne.address,tokenlist[i].address);
    }
    setIsOpen(false);
  };

  async function fetchPrices(one,two){
    const res= await axios.get(`http://localhost:3004/tokenPrice`,{
      params:{addressOne:one,addressTwo:two}
    });
    setPrices(res.data);
  }

  async function fetchDexSwap(){
    const allowance = await axios.get(`https://api.1inch.io/v5.0/1/approve/allowance?tokenAddress=${tokenOne.address}&walletAddress=${address}`)
  
    if(allowance.data.allowance === "0"){

      const approve = await axios.get(`https://api.1inch.io/v5.0/1/approve/transaction?tokenAddress=${tokenOne.address}`)

      setTxDetails(approve.data);
      console.log("not approved")
      return

    }

    const tx = await axios.get(
      `https://api.1inch.io/v5.0/1/swap?fromTokenAddress=${tokenOne.address}&toTokenAddress=${tokenTwo.address}&amount=${tokenOneAmount.padEnd(tokenOne.decimals+tokenOneAmount.length, '0')}&fromAddress=${address}&slippage=${slippage}`
    )

    let decimals = Number(`1E${tokenTwo.decimals}`)
    settokenTwoAmount((Number(tx.data.toTokenAmount)/decimals).toFixed(2));

    setTxDetails(tx.data.tx);
  }

  useEffect(()=>{
    fetchPrices(tokenlist[0].address,tokenlist[1].address);
  },[]);

  useEffect(()=>{
    if(txDetails.to && isConnected){
      sendTransaction();
    }
  },[txDetails])

  const settings=(
    <>
      <div>Slippage</div>
      <div>
        <Radio.Group value={slippage} onChange={handleSlippageChange}>
          <Radio.Button value={0.5}>0.5</Radio.Button>
          <Radio.Button value={2.5}>2.5</Radio.Button>
          <Radio.Button value={5}>5</Radio.Button>
        </Radio.Group>
      </div>
    </>
  );

  return (
    <>
    <Modal
      open={isOpen}
      footer={null}
      onCancel={()=>setIsOpen(false)}
      title="Select a Token"
    >
      <div className='modalContent'>
        {tokenlist?.map((e,i)=>{
          return (
            <div
              className='tokenChoice'
              key={i}
              onClick={()=> modifyToken(i)}
            >
              <img src={e.img} alt={e.ticker} className='tokenLogo'/>
              <div className='tokenChoicNames'>
                <div className='tokenName'>{e.name}</div>
                <div className='tokenTicker'>{e.ticker}</div>
              </div>
            </div>
          )
        })}
      </div>
    </Modal>
    <div className='tradeBox'>
      <div className='tradeBoxHeader'>
        <h4>Swap</h4>
        <Popover
          content={settings}
          title="Settings"
          trigger="click"
          placement="bottomRight" 
        >
          <SettingOutlined className="cog"/>
        </Popover>
      </div>
      <div className='inputs'>
        <Input placeholder='0' value={tokenOneAmount} onChange={changeAmount} disabled={!prices}></Input>
        <Input placeholder='0' value={tokenTwoAmount} disabled={true}></Input>
        <div className='switchButton' onClick={switchTokens}>
          <ArrowDownOutlined className='switchArrow'/>
        </div>
        <div className='assetOne' onClick={()=>openModel(1)}>
        <img src={tokenOne.img} alt='assetOneLogo' className='assetLogo'></img>
        {tokenOne.ticker}
        <DownOutlined/>
        </div>
        <div className='assetTwo'onClick={()=>openModel(2)}>
        <img src={tokenTwo.img} alt='assetOneLogo' className='assetLogo'></img>
        {tokenTwo.ticker}
        <DownOutlined/>
        </div>
      </div>
      <div className='swapButton' disabled={!tokenOneAmount || !isConnected}>Swap</div>
    </div>
    </>
  )
}

export default Swap;
