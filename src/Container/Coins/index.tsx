import { HeartFilled, HeartOutlined } from "@ant-design/icons";
import { PageHeader, Radio } from "antd";
import styles from "./styles.module.scss";
import { useEffect, useRef, useState } from "react";
import coinApi from "../../Api/coinApi";
import { useNavigate } from "react-router-dom";
import { listTimeRange, TimePeriod } from "../../App";
import PrimaryChart from "../../Components/PrimaryChart";
import { DataProps } from "../../Components/PrimaryChart/interfaces";
import SecondaryChart from "../../Components/SecondaryChart";
import { Status } from "../../Constants/enum";
import useWindowDimensions from "../../hooks/useWindowDimensions";
import { getQueryParam, updateUrl } from "../../Utils/query";
import Loading from "../../Components/Loading";

const Coins = () => {
  const queryParam = getQueryParam<any>();
  const local: any = localStorage?.getItem("listWatched");
  const listWatched: {
    coinFrom: string;
    coinTo: string;
    idCoinFrom: string;
    watched: boolean;
  }[] = local && JSON.parse(local);
  const indexHeart =
    listWatched?.length > 0
      ? listWatched.findIndex(
          (values) =>
            `${values.coinFrom}${values.coinTo}` ===
            `${queryParam["coinFrom"]}${queryParam["coinTo"]}`
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
  let navigate = useNavigate();
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
  const handleGetAllCoin = async (value: string) => {
    try {
      setLoading(true);
      const res = await coinApi.getAllCoin(
        queryParam["id"],
        queryParam["coinTo"],
        value
      );
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
      console.log(error);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 250);
    }
  };
  const handleUpdateStatusHeart = () => {
    setStatusHeart(!statusHeart);
    listWatched[indexHeart].watched = !statusHeart;
    localStorage.setItem("listWatched", JSON.stringify(listWatched));
  };
  useEffect(() => {
    const indexRange = Object.keys(TimePeriod).findIndex(
      (values) => values === queryParam["range"]
    );
    handleGetAllCoin(Object.values(TimePeriod)[indexRange]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className={styles.coins} ref={gridItemRef}>
      {loading && <Loading />}
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
        <h3>{`${queryParam["coinFrom"].toUpperCase()} to ${queryParam[
          "coinTo"
        ].toUpperCase()} Price Chart`}</h3>
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
      {listChartModal?.length > 0 && (
        <>
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
          {/* <SecondaryChart
            data={listChartModal}
            height={Math.floor(height * 0.1)}
            width={boxWidth}
            margin={{
              top: 0,
              right: 16,
              bottom: 24,
              left: 48,
            }}
          /> */}
        </>
      )}
    </div>
  );
};
export default Coins;
