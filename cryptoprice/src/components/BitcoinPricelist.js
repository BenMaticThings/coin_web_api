import React, { Component } from 'react';
import * as SignalR from '@aspnet/signalr';
import 'fontsource-roboto';
import { Line } from "react-chartjs-2";


export class BitcoinPricelist extends Component {
  constructor(props) {
    super(props);

    this.state = {
      prices: [],
      hubConnection: null,
      date: new Date().toLocaleString(),
      date_arr: [],
      price_data: [],
      price_new: [],


    }
  }

  componentDidMount = async () => {
    const prices = await this.LoadInitialValues();

    prices.forEach(recievedPrice => {
      const price_nzd = `${parseFloat(recievedPrice.value_nzd).toFixed(2)}`;
      const price_eth = parseFloat(price_nzd / `${parseFloat(recievedPrice.value_eth).toFixed(2)}`).toFixed(2);
      const date = this.state.date
      const prices = this.state.prices;
      prices.push([price_nzd, date, price_eth]);
      this.setState({ prices: prices });
      // 
    });
    this.InitialiseHub();
    this.interval = setInterval(() => this.setState({ date_arr: this.state.date_arr.concat(new Date().toLocaleString()) }), 10000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  LoadInitialValues = async () => {
    const response = await fetch("https://localhost:5001/Coinbase", {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      redirect: 'follow', // manual, *follow, error
      referrerPolicy: 'no-referrer', // no-referrer, *client
    });

    return await response.json();
  };

  InitialiseHub = () => {
    const hubConnection = new SignalR.HubConnectionBuilder().withUrl("https://localhost:5001/btchub").build();
    this.setState({ hubConnection }, () => {
      this.state.hubConnection
        .start()
        .then(() => console.log('Connection started!'))
        .catch(err => console.log('Error while establishing connection :('));

      this.state.hubConnection.on('ReceivePrice', (recievedPrice) => {
        const price_nzd = `${parseFloat(recievedPrice.value_nzd).toFixed(2)}`;
        const price_eth = parseFloat(price_nzd / `${parseFloat(recievedPrice.value_eth).toFixed(2)}`).toFixed(2);
        const date = this.state.date
        const prices = this.state.prices;

        if (prices.length === 1) {
          prices.shift();
        }

        prices.push([price_nzd, date, price_eth]);
        this.setState({ prices: prices })
        this.setState({ price_new: this.state.price_new.concat(prices) })
      })
    })
  }

  render() {

    const data1_btc = this.state.price_new.slice().reverse().map((price, index) => (price[0]))
    const data2_eth = this.state.price_new.slice().reverse().map((price, index) => (price[2]))
    const labels_date = this.state.date_arr;


    const data = {
      labels: labels_date,
      datasets: [
        {
          label: "Bitcoin",
          data: data1_btc,
          fill: false,
          backgroundColor: "#FF0000",
          pointBorderWidth: 5,
          pointHoverRadius: 5,

        },
        {
          label: "Ethereum",
          data: data2_eth,
          fill: false,
          borderColor: "#742774",
          pointBorderWidth: 5,
          pointHoverRadius: 5,

        }
      ]
    };

    return (

      <div className='container'>
        <div style={{
          display: 'flex', justifyContent: 'center',
          margin: '0 auto'
        }}>

          {this.state.prices.slice().reverse().map((price, index) => (

            <h1 key={index}>
              <p>1 Bitcoin = {`${price[0]}`} $NZD</p>
              <p>1 Ethereum = {price[2]} $NZD</p>
            </h1>

          ))}

        </div>

        <div style={{
          display: 'flex', justifyContent: 'center',
          width: 1000,
          height: 500,
          margin: '0 auto'
        }}>

          <Line data={data}
            width={600}
            height={300} />
        </div>

      </div>


    )
  }
}
