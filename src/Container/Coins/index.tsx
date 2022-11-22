import { HeartFilled, HeartOutlined } from "@ant-design/icons";
import { Radio } from "antd";
import styles from "./styles.module.scss";
import { useCallback, useEffect, useRef, useState } from "react";
import coinApi from "../../Api/coinApi";
import { listTimeRange, ListWatchedProps, TimePeriod } from "../../App";
import PrimaryChart from "../../Components/PrimaryChart";
import { DataProps } from "../../Components/PrimaryChart/interfaces";
import { Status } from "../../Constants/enum";
import useWindowDimensions from "../../hooks/useWindowDimensions";
import { getQueryParam, updateUrl } from "../../Utils/query";
import Loading from "../../Components/Loading";
import { useParams } from "react-router-dom";
import { notify } from "../../Utils/notification";
import numeral from "numeral";
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
  const queryParam = getQueryParam<any>();
  const local: any = localStorage?.getItem("listWatched");
  const listWatched: ListWatchedProps[] = local ? JSON.parse(local) : [];
  const indexHeart =
    listWatched?.length > 0
      ? listWatched.findIndex(
          (values) => `${values.coinFrom}${values.coinTo}` === `${from}${to}`
        )
      : -1;
  const [statusHeart, setStatusHeart] = useState<boolean>(
    indexHeart > -1 ? listWatched[indexHeart].watched : false
  );
  const [listChartModal, setListChartModal] = useState<DataProps[]>([]);
  const indexRange = Object.keys(TimePeriod).findIndex(
    (values) => values === queryParam["range"]
  );
  const gridItemRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [boxWidth, setBoxWidth] = useState<number>(0);
  const { height } = useWindowDimensions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleGetAllCoin = useCallback(
    debounce(async (value: string) => {
      try {
        const res = await coinApi.getAllCoin(from, to || "", value);
        if (res.status === Status.SUCCESS) {
          const result =
            res?.data?.prices?.length > 0
              ? res.data.prices.map((values: number[]) => {
                  return {
                    date: new Date(values[0]),
                    price: values[1],
                  };
                })
              : [];
          setListChartModal([...result]);
        }
      } catch (error) {
        notify("error", "Error!", 1500);
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 250);
      }
    }, 500),
    []
  );
  const handleSetLocalStorage = useCallback(
    debounce(async () => {
      if (listWatched?.length === 0) {
        try {
          const res = await coinApi.getAllMarkets();
          if (res.status === Status.SUCCESS) {
            let priceCoinFrom = "";
            let priceCoinTo = "";
            res?.data?.length > 0 &&
              res.data.forEach((values: any) => {
                if (values.id === from) {
                  priceCoinFrom = numeral(values.current_price).format(
                    "0.0.00"
                  );
                }
                if (values.symbol === to.toLowerCase()) {
                  priceCoinTo = numeral(values.current_price).format("0.0.00");
                }
              });
            localStorage.setItem(
              "listWatched",
              JSON.stringify([
                {
                  coinFrom: from,
                  coinTo: to,
                  idCoinFrom: from,
                  watched: false,
                  priceCoinFrom: priceCoinFrom,
                  priceCoinTo: priceCoinTo,
                },
              ])
            );
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
    listWatched[indexHeart].watched = !statusHeart;
    localStorage.setItem("listWatched", JSON.stringify(listWatched));
  };
  useEffect(() => {
    const indexRange = Object.keys(TimePeriod).findIndex(
      (values) => values === queryParam["range"]
    );
    setLoading(true);
    handleGetAllCoin(Object.values(TimePeriod)[indexRange]);
    handleSetLocalStorage();
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
                handleGetAllCoin(value);
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
              {from &&
                to &&
                `${from.toUpperCase()} to ${to.toUpperCase()} Price Chart`}
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
            <PrimaryChart
              data={listChartModal}
              height={Math.floor(height * 0.4)}
              width={boxWidth}
              margin={{
                top: 16,
                right: 16,
                bottom: 40,
                left: 48,
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};
export default Coins;
