import "./App.css";
import Header from "./components/Header";
import {Routes,React, Route} from 'react-router-dom';
import Swap from './components/Swap'
import Tokens from './components/Tokens'
import {MetaMaskConnector} from'wagmi/connectors/metaMask';
import { useAccount, useConnect } from "wagmi";



function App() {
  const{address,isConnected}=useAccount();
  const {connect}=useConnect({
    connector: new MetaMaskConnector(),
  })
  return(
    <div className="App">
      <Header connect={connect} isConnected={isConnected} address={address}/>
      <div className="mainWindow">
        <Routes>
          <Route path="/" element={<Swap isConnected={isConnected} address={address} />}></Route>
          <Route path="/tokens" element={<Tokens/>}></Route>
        </Routes>
      </div>
    </div>
  )
}

export default App;
