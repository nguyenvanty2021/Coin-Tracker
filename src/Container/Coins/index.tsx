import { HeartFilled, HeartOutlined } from "@ant-design/icons";
import { Radio } from "antd";
import styles from "./styles.module.scss";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import coinApi from "../../Api/coinApi";
import {
  DrawerComponent,
  handleFormatCoinPrice,
  listTimeRange,
  ListWatchedProps,
  notifyTime,
  TimePeriod,
} from "../../App";
import { Status } from "../../Constants/enum";
import { createChart, ColorType } from "lightweight-charts";
import { getQueryParam, updateUrl } from "../../Utils/query";
import Loading from "../../Components/Loading";
import { useParams } from "react-router-dom";
import { notify } from "../../Utils/notification";
import numeral from "numeral";
import moment from "moment";
import SecondaryChart from "../../Components/SecondaryChart";
import useWindowDimensions from "../../hooks/useWindowDimensions";
const handleFormatCoin = (coin: number) => {
  return coin < 0.01
    ? 0.000001
    : coin < 0.1
    ? 0.00001
    : coin < 10
    ? 0.0001
    : 0.01;
};
const timeDebounce = 400;
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
    }, wait || timeDebounce);
  };
}
const ChartComponent = (props: any) => {
  const { data, range } = props;
  const heightDefault = 300;
  const colors: any = {
    backgroundColor: "white",
    lineColor: "#2962FF",
    textColor: "black",
    areaTopColor: "#2962FF",
    areaBottomColor: "rgba(41, 98, 255, 0.28)",
  };
  const formatDate = (time: number, type: string) =>
    moment.unix(time).format(type);
  const chartContainerRef: any = useRef();
  const priceFirst = data[0].value;
  useEffect(() => {
    const handleResize = () => {
      chart.applyOptions({
        width: chartContainerRef.current.clientWidth,
      });
    };
    const element: any = document.getElementById("container");
    const chart: any = createChart(element, {
      layout: {
        background: { type: ColorType.Solid, color: colors.backgroundColor },
        textColor: colors.textColor,
      },
      rightPriceScale: {
        scaleMargins: {
          top: 0.3,
          bottom: 0.25,
        },
      },
      grid: {
        vertLines: {
          visible: false,
        },
        horzLines: {
          visible: false,
        },
      },
      timeScale: {
        tickMarkFormatter: (time: any) => {
          return range !== "1D"
            ? formatDate(time, "DD/MM/YYYY")
            : data[0].time === time || data[data.length - 1].time === time
            ? formatDate(time, "DD/MM/YYYY HH:MM:ss")
            : new Date(
                dateToString(time, "MM/DD/YYYY HH:MM:ss")
              ).toLocaleString("en-US", {
                hour: "numeric",
                minute: "numeric",
                second: "numeric",
                hour12: true,
              });
        },
      },
      width: chartContainerRef.current.clientWidth,
      height: heightDefault,
    });
    chart.timeScale().fitContent();
    let newSeries = chart.addAreaSeries({
      priceFormat: {
        type: "price",
        precision: data?.length > 0 ? handleFormatCoinPrice(priceFirst) : 0,
        minMove: handleFormatCoin(priceFirst),
      },
      lineWidth: 2,
      crossHairMarkerVisible: false,
      lineColor: colors.lineColor,
      topColor: colors.areaTopColor,
      bottomColor: colors.areaBottomColor,
    });
    newSeries.setData(data);
    const container: any = document.getElementById("container");
    function dateToString(date: any, type: string) {
      const dateString = moment.unix(date).format(type);
      return dateString;
    }
    const toolTipWidth = 160;
    const toolTipHeight = 0;
    const toolTipMargin = 0;
    // Create and style the tooltip html element
    const toolTip: any = document.createElement("div");
    toolTip.style = `width: 200px; height: 65px; position: absolute; display: none; padding: 8px; box-sizing: border-box; font-size: 12px; text-align: left; z-index: 1000; top: 12px; left: 12px; pointer-events: none; border: 1px solid; border-radius: 2px;font-family: 'Trebuchet MS', Roboto, Ubuntu, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;`;
    toolTip.style.background = "white";
    toolTip.style.color = "black";
    toolTip.style.borderColor = "rgba( 38, 166, 154, 1)";
    container.appendChild(toolTip);
    // update tooltip
    chart.subscribeCrosshairMove((param: any) => {
      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > container.clientWidth ||
        param.point.y < 0 ||
        param.point.y > container.clientHeight
      ) {
        toolTip.style.display = "none";
      } else {
        toolTip.style.display = "block";
        const price = param.seriesPrices.get(newSeries);
        toolTip.innerHTML = `<div style="display:flex; justify-content:space-between;" >
          <b style="font-size:0.85rem;color:black;" >${dateToString(
            param.time,
            "DD/MM/YYYY"
          )}</b>
          <b style="color: #A0A7B5;font-size: 0.75rem;" >${new Date(
            dateToString(param.time, "MM/DD/YYYY HH:MM:ss")
          ).toLocaleString("en-US", {
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            hour12: true,
          })}</b>
        </div>
        <div style="display:flex;margin: 4px 0px;justify-content:flex-start;align-items:center;" >
          <b style="color: #A0A7B5;font-size:0.85rem;" >Price:</b>
          <b style="color: black;font-size: 1rem;margin-left: 0.25rem;">
        $${price.toFixed(
          price < 0.01 ? 7 : price < 0.1 ? 5 : price < 10 ? 3 : 3
        )}
        </b>
        </div>
        `;
        const y = param.point.y;
        let left = param.point.x + toolTipMargin;
        if (left > container.clientWidth - toolTipWidth) {
          left = param.point.x - toolTipMargin - toolTipWidth;
        }
        let top = y + toolTipMargin;
        if (top > container.clientHeight - toolTipHeight) {
          top = y - toolTipHeight - toolTipMargin;
        }
        toolTip.style.left = left + "px";
        toolTip.style.top = top + "px";
      }
    });
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    data,
    colors.backgroundColor,
    colors.lineColor,
    colors.textColor,
    colors.areaTopColor,
    colors.areaBottomColor,
  ]);

  return (
    <div className={styles.chart} id="container" ref={chartContainerRef} />
  );
};
const ChartComponentHOC = memo(ChartComponent);
const Coins = () => {
  const [boxWidth, setBoxWidth] = useState<number>(0);
  const params = useParams();
  const [openWatchList, setOpenWatchList] = useState<boolean>(false);
  const { height } = useWindowDimensions();
  const { from, to }: any = params;
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
  const [listChartModal, setListChartModal] = useState<any[]>([]);
  const indexRange = Object.keys(TimePeriod).findIndex(
    (values) => values === queryParam["range"]
  );
  const [secondList, setSecondList] = useState<any>([]);
  const gridItemRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState<boolean>(false);
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
            const listSecondTemp: any = [];
            const listTemp: any = [];
            result?.forEach((v: any, index: number) => {
              listTemp.push({
                time: moment(v?.[0]).unix(),
                value:
                  parseFloat(v?.[1]) / parseFloat(listCoinTo?.[index]?.[1]),
              });
              listSecondTemp.push({
                date: new Date(v?.[0]),
                price:
                  parseFloat(v?.[1]) / parseFloat(listCoinTo?.[index]?.[1]),
              });
            });
            setSecondList([...listSecondTemp]);
            setListChartModal([...listTemp]);
            handleSetLocalStorage();
          } else if (listCoinFrom?.length < listCoinTo?.length) {
            const result = listCoinTo.slice(
              listCoinTo.length - listCoinFrom.length - 1,
              -1
            );
            result.push(listCoinTo[listCoinTo.length - 1]);
            result.shift();
            const listSecondTemp: any = [];
            const listTemp: any = [];
            listCoinFrom?.forEach((v: any, index: number) => {
              listTemp.push({
                time: moment(v?.[0]).unix(),
                value: parseFloat(v?.[1]) / parseFloat(result?.[index]?.[1]),
              });
              listSecondTemp.push({
                date: new Date(v?.[0]),
                price: parseFloat(v?.[1]) / parseFloat(result?.[index]?.[1]),
              });
            });
            setSecondList([...listSecondTemp]);
            setListChartModal([...listTemp]);
            handleSetLocalStorage();
          } else {
            const listTemp: any = [];
            const listSecondTemp: any = [];
            listCoinFrom?.forEach((v: any, index: number) => {
              listTemp.push({
                time: moment(v?.[0]).unix(),
                value:
                  parseFloat(v?.[1]) / parseFloat(listCoinTo?.[index]?.[1]),
              });
              listSecondTemp.push({
                date: new Date(v?.[0]),
                price:
                  parseFloat(v?.[1]) / parseFloat(listCoinTo?.[index]?.[1]),
              });
            });
            setSecondList([...listSecondTemp]);
            setListChartModal([...listTemp]);
            handleSetLocalStorage();
          }
        } else {
          notify("error", "Pair of Coins is not valid!", notifyTime);
        }
      } catch (error) {
        notify("error", "Error!", notifyTime);
      } finally {
        setLoading(false);
      }
    }, timeDebounce),
    []
  );
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
          notify("error", "Error!", notifyTime);
        }
      }
    }, timeDebounce),
    []
  );
  const handleUpdateStatusHeart = () => {
    setStatusHeart(!statusHeart);
    const listTemp = [...listWatchedState];
    listTemp[indexHeart].watched = !statusHeart;
    localStorage.setItem("listWatched", JSON.stringify(listTemp));
  };
  const handleCloseDrawer = (status: boolean) => setOpenWatchList(status);
  useEffect(() => {
    setLoading(true);
    // handleCheckCoin();
    handleCoupleCoin(Object.values(TimePeriod)[indexRange]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const handleResize = (width?: number) => {
      setBoxWidth(width || 0);
    };
    handleResize(gridItemRef.current?.clientWidth || 0);
    window.addEventListener("resize", () =>
      handleResize(gridItemRef?.current?.clientWidth || 0)
    );
    return () => {
      window.removeEventListener("resize", () => handleResize());
    };
  }, [gridItemRef]);
  return (
    <div className={styles.coins} ref={gridItemRef}>
      {loading && <Loading />}
      {listChartModal?.length > 0 && (
        <>
          <div className={styles.range}>
            {/* <Button
              className={styles.range__btn}
              onClick={() => setOpenWatchList(!openWatchList)}
              type="primary"
            >
              My Watchlist
            </Button> */}
            <Radio.Group
              className={styles.range__btn}
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
              <b style={{ marginRight: "0.35rem" }}>
                {from && to && `${from.toUpperCase()} to ${to.toUpperCase()}`}
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
          <ChartComponentHOC
            from={from}
            to={to}
            range={queryParam["range"]}
            data={listChartModal?.length > 0 ? listChartModal : []}
          />
          <SecondaryChart
            data={secondList?.length > 0 ? secondList : []}
            height={Math.floor(height * 0.05)}
            width={boxWidth}
            setListChartModal={setListChartModal}
            margin={{
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
            }}
          />
          <h3 className={styles.title}>My Watchlist</h3>
          <DrawerComponent
            coinCurrent={
              from && to && `${from.toUpperCase()}/${to.toUpperCase()}`
            }
            priceCurrent={
              listChartModal?.length > 0
                ? listChartModal[listChartModal.length - 1].value
                : 0
            }
            handleCloseDrawer={handleCloseDrawer}
            list={listWatchedState}
          />
        </>
      )}
    </div>
  );
};
export default Coins;
