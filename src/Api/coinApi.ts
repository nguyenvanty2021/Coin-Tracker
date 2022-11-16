import axiosClient from "./axiosClient";
const coinApi = {
  getAllCoin(
    coin: string,
    currencyChange: string,
    timeFilter: string
  ): Promise<any> {
    const url = `/coins/${coin}/market_chart?vs_currency=${currencyChange}&days=${timeFilter}`;
    return axiosClient.get(url);
  },
  getAllMarkets(): Promise<any> {
    const url = `/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=1h`;
    return axiosClient.get(url);
  },
};
export default coinApi;
