import { HeartFilled, HeartOutlined } from "@ant-design/icons";
import { Radio } from "antd";
import styles from "./styles.module.scss";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import coinApi from "../../Api/coinApi";
import { listTimeRange, ListWatchedProps, TimePeriod } from "../../App";
import { DataProps } from "../../Components/PrimaryChart/interfaces";
import { Status } from "../../Constants/enum";
import { createChart, ColorType } from "lightweight-charts";
import { getQueryParam, updateUrl } from "../../Utils/query";
import Loading from "../../Components/Loading";
import { useParams } from "react-router-dom";
import { notify } from "../../Utils/notification";
import numeral from "numeral";
import moment from "moment";
// var formatters: any = {
//   Dollar: function (price: any): any {
//     return "$" + price.toFixed(4);
//   },
//   Pound: function (price: any): any {
//     return "\u00A3" + price.toFixed(4);
//   },
// };
const handleFormatCoin = (coin: number) => {
  return coin < 0.01 ? 0.000001 : coin < 0.1 ? 0.00001 : coin < 10 ? 0.0001 : 1;
};
// const formatterNames = Object.keys(formatters);
const ChartComponent = (props: any) => {
  const { data } = props;
  const colors: any = {
    backgroundColor: "white",
    lineColor: "#2962FF",
    textColor: "black",
    areaTopColor: "#2962FF",
    areaBottomColor: "rgba(41, 98, 255, 0.28)",
  };
  const chartContainerRef: any = useRef();
  const priceFirst = data[0][1];
  useEffect(() => {
    const handleResize = () => {
      chart.applyOptions({
        width: chartContainerRef.current.clientWidth,
      });
    };
    const chart: any = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: colors.backgroundColor },
        textColor: colors.textColor,
      },
      // handleScroll: {
      //   vertTouchDrag: false,
      // },
      // rightPriceScale: {
      //   scaleMargins: {
      //     top: 0.3,
      //     bottom: 0.25,
      //   },
      //   borderVisible: false,
      //   // width: 50,
      // },
      timeScale: {
        // rightOffset: 12,
        // barSpacing: 3,
        // fixLeftEdge: true,
        // lockVisibleTimeRangeOnResize: true,
        // rightBarStaysOnScroll: true,
        // borderVisible: false,
        // borderColor: "#fff000",
        // visible: true,

        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time: any) => {
          // console.log(time);
          const dateString = moment.unix(time).format("YYYY/MM/DD HH:MM");
          // console.log(dateString);
          // const date = new Date(time.year, time.month, time.day);
          return dateString;
        },
      },
      // grid: {
      //   vertLines: {
      //     color: "rgba(70, 130, 180, 0.5)",
      //     style: 1, // 1.Solid; 2.Dotted; 3.Dashed; 4.LargeDashed; 5.SparseDotted
      //     visible: true,
      //   },
      //   horzLines: {
      //     color: "rgba(70, 130, 180, 0.5);",
      //     style: 1, // 1.Solid; 2.Dotted; 3.Dashed; 4.LargeDashed; 5.SparseDotted
      //     visible: true,
      //   },
      // },
      // watermark: {
      //   horzAlign: "center",
      //   vertAlign: "top",
      // },

      // localization: {
      //   dateFormat: "MM/dd/yy",
      //   locale: "en-US",
      // },
      width: chartContainerRef.current.clientWidth,
      height: 300,
    });
    chart.timeScale().fitContent();
    let newSeries = chart.addAreaSeries({
      priceFormat: {
        type: "price",
        precision:
          data?.length > 0
            ? priceFirst < 0.01
              ? 6
              : priceFirst < 0.1
              ? 5
              : priceFirst < 10
              ? 4
              : 0
            : 0,
        minMove: handleFormatCoin(priceFirst),
      },
      // crosshairMarkerVisible: false,
      // crosshairMarkerRadius: 3,
      lineWidth: 2,
      // lineType: 6,
      lineColor: colors.lineColor,
      topColor: colors.areaTopColor,
      bottomColor: colors.areaBottomColor,
    });

    // export const handleFormatCoin = (coin: number) => {
    //   return coin < 0.01
    //     ? "0,0.000000"
    //     : coin < 0.1
    //     ? "0,0.00000"
    //     : coin < 10
    //     ? "0,0.0000"
    //     : "0,0.000";
    // };
    // var volumeSeries = chart.addHistogramSeries({
    //   color: "#26a69a",
    //   priceFormat: {
    //     type: "volume",
    //   },
    //   priceScaleId: "",
    //   scaleMargins: {
    //     top: 0.8,
    //     bottom: 0,
    //   },
    // });
    // newSeries = chart.addLineSeries({
    //   // or right
    //   priceScaleId: "left",
    //   // chart title
    //   title: "Series title example",
    //   // top & bottom margins
    //   scaleMargins: {
    //     top: 0.1,
    //     bottom: 0.3,
    //   },
    //   // overrides autoscale
    //   autoscaleInfoProvider: () => {
    //     return {
    //       priceRange: {
    //         minValue: 0,
    //         maxValue: 100,
    //       },
    //     };
    //   },
    // });
    newSeries.setData(data);

    // const barsInfo = newSeries.barsInLogicalRange(
    //   chart.timeScale().getVisibleLogicalRange()
    // );
    // console.log(barsInfo);
    // // take a screenshot
    // chart.takeScreenshot();
    // // two functions to access this price scale implicitly
    // const coordinate = newSeries.priceToCoordinate(100.5);
    // const price = newSeries.coordinateToPrice(324);
    // volumeSeries.setData(data);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [
    data,
    colors.backgroundColor,
    colors.lineColor,
    colors.textColor,
    colors.areaTopColor,
    colors.areaBottomColor,
  ]);

  return <div className={styles.chart} ref={chartContainerRef} />;
};
const ChartComponentHOC = memo(ChartComponent);
function debounce(fn: any, wait?: number) {
  let timerId: any, lastArguments: any, lastThis: any;
  return (...args: any) => {
    timerId && clearTimeout(timerId);
    lastArguments = args;
    //@ts-ignore
    lastThis = this;
    timerId = setTimeout(function () {
      fn.apply(lastThis, lastArguments);
      timerId = null;
    }, wait || 400);
  };
}
const Coins = () => {
  const params = useParams();
  const { from, to }: any = params;
  // const [idCoinCommon, setIdCoinCommon] = useState<{
  //   from: string;
  //   to: string;
  // }>({
  //   from: "",
  //   to: "",
  // });
  const queryParam = getQueryParam<any>();
  const local: any = localStorage?.getItem("listWatched");
  const [listWatchedState, setListWatchedState] = useState<ListWatchedProps[]>(
    local ? JSON.parse(local) : []
  );
  const indexHeart =
    listWatchedState?.length > 0
      ? listWatchedState.findIndex(
          (values) => `${values.coinFrom}${values.coinTo}` === `${from}${to}`
        )
      : -1;
  const [statusHeart, setStatusHeart] = useState<boolean>(
    indexHeart > -1 ? listWatchedState[indexHeart].watched : false
  );
  const [listChartModal, setListChartModal] = useState<DataProps[]>([]);
  const indexRange = Object.keys(TimePeriod).findIndex(
    (values) => values === queryParam["range"]
  );
  const gridItemRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState<boolean>(false);
  // const indexRange = Object.keys(TimePeriod).findIndex(
  //   (values) => values === queryParam["range"]
  // );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleCoupleCoin = useCallback(
    debounce(async (range: string) => {
      try {
        const listRespon = await Promise.all([
          coinApi.getAllCoinCouple(from.toLowerCase(), range),
          coinApi.getAllCoinCouple(to.toLowerCase(), range),
        ]);
        if (
          listRespon.length === 2 &&
          listRespon?.[0]?.data?.prices?.length > 0 &&
          listRespon?.[1]?.data?.prices?.length > 0
        ) {
          let listCoinFrom = listRespon?.[0]?.data?.prices;
          let listCoinTo = listRespon?.[1]?.data?.prices;
          if (listCoinFrom?.length > listCoinTo?.length) {
            // listCoinFrom.length = listCoinTo.length;
            const result = listCoinFrom.slice(
              listCoinFrom.length - listCoinTo.length - 1,
              -1
            );
            result.push(listCoinFrom[listCoinFrom.length - 1]);
            result.shift();
            const listTemp: any = [];
            result?.forEach((v: any, index: number) => {
              listTemp.push({
                time: moment(v?.[0]).unix(),
                value:
                  parseFloat(v?.[1]) / parseFloat(listCoinTo?.[index]?.[1]),
              });
              // console.log("coin1: ", parseFloat(v?.[1]));
              // console.log("coin2: ", parseFloat(listCoinTo?.[index]?.[1]));
              // console.log(
              //   "result: ",
              //   parseFloat(v?.[1]) / parseFloat(listCoinTo?.[index]?.[1])
              // );
            });
            setListChartModal([...listTemp]);

            handleSetLocalStorage();
          } else if (listCoinFrom?.length < listCoinTo?.length) {
            // listCoinTo.length = listCoinFrom.length;
            const result = listCoinTo.slice(
              listCoinTo.length - listCoinFrom.length - 1,
              -1
            );
            result.push(listCoinTo[listCoinTo.length - 1]);
            result.shift();
            const listTemp: any = [];
            listCoinFrom?.forEach((v: any, index: number) => {
              listTemp.push({
                time: moment(v?.[0]).unix(),
                value: parseFloat(v?.[1]) / parseFloat(result?.[index]?.[1]),
              });
              // console.log("coin1: ", parseFloat(v?.[1]));
              // console.log("coin2: ", parseFloat(listCoinTo?.[index]?.[1]));
              // console.log(
              //   "result: ",
              //   parseFloat(v?.[1]) / parseFloat(listCoinTo?.[index]?.[1])
              // );
            });
            setListChartModal([...listTemp]);

            handleSetLocalStorage();
          } else {
            const listTemp: any = [];
            listCoinFrom?.forEach((v: any, index: number) => {
              listTemp.push({
                time: moment(v?.[0]).unix(),
                value:
                  parseFloat(v?.[1]) / parseFloat(listCoinTo?.[index]?.[1]),
              });
              // console.log("coin1: ", parseFloat(v?.[1]));
              // console.log("coin2: ", parseFloat(listCoinTo?.[index]?.[1]));
              // console.log(
              //   "result: ",
              //   parseFloat(v?.[1]) / parseFloat(listCoinTo?.[index]?.[1])
              // );
            });
            setListChartModal([...listTemp]);

            handleSetLocalStorage();
          }
        } else {
          notify("error", "Pair of Coins is not valid!", 1500);
        }
      } catch (error) {
        notify("error", "Error!", 1500);
      } finally {
        setLoading(false);
      }
    }, 500),
    []
  );
  const localAAA = localStorage.getItem("aaa");
  const aaa = localAAA && JSON.parse(localAAA);
  // const handleCoupleCoin = useCallback(
  //   debounce(async (range: string) => {
  //     try {
  //       const listRespon = await Promise.all([
  //         coinApi.getAllCoinCouple(from.toLowerCase(), range),
  //         coinApi.getAllCoinCouple(to.toLowerCase(), range),
  //       ]);
  //       if (
  //         listRespon.length === 2 &&
  //         listRespon[0]?.data?.prices?.length > 0 &&
  //         listRespon[1]?.data?.prices?.length > 0
  //       ) {
  //         const listTemp: any = [];
  //         listRespon[0].data.prices.forEach((v: any, index: number) => {
  //           listTemp.push({
  //             date: new Date(v[0]),
  //             price:
  //               parseFloat(v[1]) /
  //               parseFloat(listRespon[1].data.prices[index][1]),
  //           });
  //         });
  //         // setIdCoinCommon({
  //         //   ...idCoinCommon,
  //         //   from: from,
  //         //   to: nameCoinTo,
  //         // });
  //         setListChartModal([...listTemp]);
  //         handleSetLocalStorage();
  //       } else {
  //         notify("error", "Pair of Coins is not valid!", 1500);
  //       }
  //     } catch (error) {
  //       notify("error", "Error!", 1500);
  //     } finally {
  //       setLoading(false);
  //     }
  //   }, 500),
  //   []
  // );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // const handleGetAllCoin = useCallback(
  //   debounce(async (idCoinFrom: string, nameCoinTo: string, value: string) => {
  //     try {
  //       const res = await coinApi.getAllCoin(
  //         idCoinFrom,
  //         nameCoinTo.toLowerCase(),
  //         value
  //       );
  //       if (res.status === Status.SUCCESS) {

  //         const result =
  //           res?.data?.prices?.length > 0
  //             ? res.data.prices.map((values: number[]) => {
  //                 return {
  //                   date: new Date(values[0]),
  //                   price: values[1],
  //                 };
  //               })
  //             : [];

  //       }
  //     } catch (error) {
  //       notify("error", "Error!", 1500);
  //     } finally {
  //       setLoading(false);
  //     }
  //   }, 500),
  //   []
  // );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSetLocalStorage = useCallback(
    debounce(async () => {
      if (listWatchedState?.length === 0) {
        try {
          const res = await coinApi.getAllMarkets();
          if (res.status === Status.SUCCESS) {
            let priceCoinFrom = "";
            let priceCoinTo = "";
            res?.data?.length > 0 &&
              res.data.forEach((values: any) => {
                if (values.id === from.toLowerCase()) {
                  priceCoinFrom = numeral(values.current_price).format(
                    "0.00000"
                  );
                }
                if (values.id === to.toLowerCase()) {
                  priceCoinTo = numeral(values.current_price).format("0.00000");
                }
              });
            const listTemp = [
              {
                coinFrom: from,
                coinTo: to,
                idCoinFrom: from,
                watched: false,
                priceCoinFrom,
                priceCoinTo,
              },
            ];
            setListWatchedState(listTemp);
            localStorage.setItem("listWatched", JSON.stringify(listTemp));
          }
        } catch (error) {
          notify("error", "Error!", 1500);
        }
      }
    }, 500),
    []
  );
  const handleUpdateStatusHeart = () => {
    setStatusHeart(!statusHeart);
    const listTemp = [...listWatchedState];
    listTemp[indexHeart].watched = !statusHeart;
    localStorage.setItem("listWatched", JSON.stringify(listTemp));
  };
  // // eslint-disable-next-line react-hooks/exhaustive-deps
  // const handleCheckCoin = useCallback(
  //   debounce(async () => {
  //     try {
  //       const listRespon = await Promise.all([
  //         coinApi.getCoinByName(from.toLowerCase()),
  //         coinApi.getCoinByName(to.toLowerCase()),
  //       ]);
  //       if (
  //         listRespon.length === 2 &&
  //         listRespon[0]?.data?.coins?.length > 0 &&
  //         listRespon[1]?.data?.coins?.length > 0
  //       ) {
  //         handleGetAllCoin(
  //           listRespon[0].data.coins[0].id,
  //           listRespon[1].data.coins[0].symbol,
  //           Object.values(TimePeriod)[indexRange]
  //         );
  //         handleSetLocalStorage();
  //       } else {
  //         notify("error", "Pair of Coins is not valid!", 1500);
  //         setLoading(false);
  //       }
  //     } catch (error) {
  //       notify("error", "Error!", 1500);
  //       setLoading(false);
  //     }
  //   }, 500),
  //   []
  // );
  useEffect(() => {
    setLoading(true);
    // handleCheckCoin();
    handleCoupleCoin(Object.values(TimePeriod)[indexRange]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className={styles.coins} ref={gridItemRef}>
      {loading && <Loading />}
      {listChartModal?.length > 0 && (
        <>
          <div className={styles.range}>
            <Radio.Group
              onChange={(e) => {
                const { value } = e.target;
                const indexRange = Object.values(TimePeriod).findIndex(
                  (values) => values === value
                );
                updateUrl(
                  "range",
                  indexRange > -1 ? Object.keys(TimePeriod)[indexRange] : "1D"
                );
                setLoading(true);
                handleCoupleCoin(Object.values(TimePeriod)[indexRange]);
              }}
              defaultValue={
                indexRange > -1 ? Object.values(TimePeriod)[indexRange] : "1"
              }
              buttonStyle="solid"
            >
              {listTimeRange?.length > 0 &&
                listTimeRange.map((values) => {
                  return (
                    <Radio.Button key={values.id} value={values.value}>
                      {values.key}
                    </Radio.Button>
                  );
                })}
            </Radio.Group>
          </div>
          <div className={styles.coins__title}>
            <h3>
              <b>
                {from && to && `${from.toUpperCase()} to ${to.toUpperCase()}`}{" "}
              </b>
              Pair Chart
            </h3>
            {statusHeart ? (
              <HeartFilled
                onClick={handleUpdateStatusHeart}
                className={styles.chart__heart}
              />
            ) : (
              <HeartOutlined
                onClick={handleUpdateStatusHeart}
                className={styles.chart__heart}
              />
            )}
          </div>
          <div className={styles.chart}>
            {/* <PrimaryChart
              data={listChartModal}
              height={Math.floor(height * 0.4)}
              width={boxWidth}
              margin={{
                top: 16,
                right: 16,
                bottom: 40,
                left: 48,
              }}
            /> */}
          </div>
          <ChartComponentHOC
            data={listChartModal?.length > 0 ? listChartModal : []}
          ></ChartComponentHOC>
        </>
      )}
    </div>
  );
};
export default Coins;
