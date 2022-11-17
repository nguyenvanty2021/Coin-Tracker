import { Button, Col, Modal, Row, Radio, Drawer, Table } from "antd";
import styles from "./App.module.scss";
import InputComponent from "./Components/Input/index";
import { yupResolver } from "@hookform/resolvers/yup";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import * as yup from "yup";
import SelectComponent from "./Components/Select";
import { Status, TimeFilters } from "./Constants/enum";
import { deleteUrl, getQueryParam, updateUrl } from "./Utils/query";
import coinApi from "./Api/coinApi";
import { notify } from "./Utils/notification";
import Loading from "./Components/Loading";
import { useEffect, useRef, useState } from "react";
import PrimaryChart from "./Components/PrimaryChart";
import useWindowDimensions from "./hooks/useWindowDimensions";
import { DataProps } from "./Components/PrimaryChart/interfaces";
import SecondaryChart from "./Components/SecondaryChart";
import { HeartFilled, HeartOutlined } from "@ant-design/icons";
import { ColumnsType } from "antd/lib/table";
interface FormProps<T> {
  pairOfCoin: T;
  timeRange: T;
}
export interface TimeRangeProps<T> {
  id: T;
  value: T;
  key: T;
}
interface ListWatchedProps {
  coinFrom: string;
  coinTo: string;
  idCoinFrom: string;
  watched: boolean;
}
interface DataType {
  key: string;
  name: string;
  age: number;
  address: string;
  tags: string[];
}
const TimePeriod: {
  [key: string]: TimeFilters;
} = {
  "1D": TimeFilters.P1D,
  "7D": TimeFilters.P7D,
  "1M": TimeFilters.P1M,
  "3M": TimeFilters.P3M,
  "1Y": TimeFilters.P1Y,
  ALL: TimeFilters.ALL,
};
const listTimeRange: TimeRangeProps<string>[] = [
  {
    id: "1",
    key: "1D",
    value: TimeFilters.P1D,
  },
  {
    id: "2",
    key: "7D",
    value: TimeFilters.P7D,
  },
  {
    id: "3",
    key: "1M",
    value: TimeFilters.P1M,
  },
  {
    id: "4",
    key: "3M",
    value: TimeFilters.P3M,
  },
  {
    id: "5",
    key: "1Y",
    value: TimeFilters.P1Y,
  },
  {
    id: "6",
    key: "ALL",
    value: TimeFilters.ALL,
  },
];
const DrawerComponent = ({
  open,
  list,
  setOpen,
}: {
  open: boolean;
  list: ListWatchedProps[];
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const columns: ColumnsType<ListWatchedProps> = [
    {
      title: "Pair of Coins",
      dataIndex: "pairOfCoins",
      key: "pairOfCoins",
      render: (_, record) => (
        <div>{`${record.coinFrom}/${record.coinTo}`.toUpperCase()}</div>
      ),
    },
    {
      title: "Current Price",
      dataIndex: "currentPrice",
      key: "currentPrice",
    },
    {
      title: "Link",
      dataIndex: "link",
      key: "link",
    },
  ];
  return (
    <Drawer
      width="100%"
      title="My Watchlist"
      placement="right"
      onClose={() => setOpen(false)}
      open={open}
    >
      <Table
        columns={columns}
        bordered
        dataSource={list.filter((v) => v.watched)}
      />
    </Drawer>
  );
};
const ModalComponent = ({
  open,
  listChart,
}: {
  open: boolean;
  listChart: DataProps[];
}) => {
  const queryParam = getQueryParam<any>();
  const local: any = localStorage?.getItem("listWatched");
  const listWatched: {
    coinFrom: string;
    coinTo: string;
    idCoinFrom: string;
    watched: boolean;
  }[] = local && JSON.parse(local);
  const indexHeart = listWatched.findIndex(
    (values) =>
      `${values.coinFrom}${values.coinTo}` ===
      `${queryParam["coinFrom"]}${queryParam["coinTo"]}`
  );
  const [statusHeart, setStatusHeart] = useState<boolean>(
    indexHeart > -1 ? listWatched[indexHeart].watched : false
  );
  const [listChartModal, setListChartModal] = useState<DataProps[]>(listChart);
  const indexRange = Object.keys(TimePeriod).findIndex(
    (values) => values === queryParam["range"]
  );
  const gridItemRef = useRef<HTMLDivElement>(null);
  const [boxWidth, setBoxWidth] = useState<number>(0);
  const { height } = useWindowDimensions();
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
    }
  };
  const handleUpdateStatusHeart = () => {
    setStatusHeart(!statusHeart);
    listWatched[indexHeart].watched = !statusHeart;
    localStorage.setItem("listWatched", JSON.stringify(listWatched));
  };
  return (
    <Modal
      width="100%"
      bodyStyle={{ height: 600 }}
      title={`${queryParam["coinFrom"].toUpperCase()} to ${queryParam[
        "coinTo"
      ].toUpperCase()} Price Chart`}
      centered
      visible={open}
      onOk={() => {
        window.location.reload();
      }}
      onCancel={() => {
        window.location.reload();
      }}
    >
      <div ref={gridItemRef}>
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
        <div className={styles.chart}>
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

          <PrimaryChart
            data={listChartModal ?? []}
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
        <SecondaryChart
          data={listChartModal ?? []}
          height={Math.floor(height * 0.1)}
          width={boxWidth}
          margin={{
            top: 0,
            right: 16,
            bottom: 24,
            left: 48,
          }}
        />
      </div>
    </Modal>
  );
};
function App() {
  const queryParam = getQueryParam<any>();
  const [openGeneratedLink, setOpenGeneratedLink] = useState<boolean>(false);
  const [listChart, setListChart] = useState<DataProps[]>([]);
  const [openWatchList, setOpenWatchList] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const local: any = localStorage?.getItem("listWatched");
  const listWatched: ListWatchedProps[] = local && JSON.parse(local);
  const indexRange = Object.keys(TimePeriod).findIndex(
    (values) => values === queryParam["range"]
  );
  const defaultValues: FormProps<string> = {
    pairOfCoin:
      queryParam["coinFrom"] && queryParam["coinTo"]
        ? `${queryParam["coinFrom"]}/${queryParam["coinTo"]}`
        : "",
    timeRange:
      indexRange > -1
        ? Object.values(TimePeriod)[indexRange]
        : listTimeRange?.length > 0
        ? listTimeRange[0].value
        : "1",
  };
  const yupSchemaFindNewCV = yup.object().shape({
    pairOfCoin: yup.string().required("You have not entered pair of coin"),
    timeRange: yup.string().required("You have not entered time range"),
  });
  const methods = useForm<FormProps<string>>({
    mode: "onTouched",
    criteriaMode: "firstError",
    reValidateMode: "onChange",
    defaultValues: defaultValues,
    resolver: yupResolver(yupSchemaFindNewCV),
  });
  const handleGetAllCoin = async (
    result: string[],
    idCoinFrom: string,
    timeRange: string
  ) => {
    const listKeys = Object.keys(TimePeriod);
    const coinFrom = result[0].toLowerCase();
    const coinTo = result[1].toLowerCase();
    const index = Object.values(TimePeriod).findIndex(
      (values) => values === timeRange
    );
    try {
      setLoading(true);
      const res = await coinApi.getAllCoin(idCoinFrom, coinTo, timeRange);
      if (
        res.status === Status.SUCCESS &&
        result.length === 2 &&
        index > -1 &&
        res?.data?.prices?.length > 0
      ) {
        const result = res.data.prices.map((values: number[]) => {
          return {
            date: new Date(values[0]),
            price: values[1],
          };
        });
        setListChart(result);
        updateUrl("coinFrom", coinFrom);
        updateUrl("coinTo", coinTo);
        updateUrl("range", listKeys[index]);
        updateUrl("id", idCoinFrom);
        // localStorage.setItem(
        //   "listWatched",
        //   JSON.stringify([
        //     {
        //       coinFrom,
        //       coinTo,
        //       idCoinFrom,
        //       watched: false,
        //     },
        //   ])
        // );
        if (listWatched?.length > 0) {
          console.log(listWatched);
          console.log(idCoinFrom);
          const founded = listWatched.every(
            (el) => `${el.coinFrom}${el.coinTo}` !== `${coinFrom}${coinTo}`
          );
          console.log(founded);
          if (founded) {
            listWatched.push({
              coinFrom,
              coinTo,
              idCoinFrom,
              watched: false,
            });
            localStorage.setItem("listWatched", JSON.stringify(listWatched));
          }
        } else {
          localStorage.setItem(
            "listWatched",
            JSON.stringify([
              {
                coinFrom,
                coinTo,
                idCoinFrom,
                watched: false,
              },
            ])
          );
        }
        notify("success", "Generate URL Successfully!", 3000);
      } else {
        notify("warning", "Pair of Coins is not valid!", 3000);
      }
    } catch (error) {
      notify("warning", "Pair of Coins is not valid!", 3000);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 250);
    }
  };
  const onSubmit: SubmitHandler<FormProps<string>> = async (
    object: FormProps<string>
  ) => {
    try {
      setLoading(true);
      const res = await coinApi.getAllMarkets();
      if (res.status === Status.SUCCESS) {
        const result = object.pairOfCoin.split("/");
        let idCoinFrom = "";
        res?.data?.length > 0 &&
          res.data.forEach((values: any) => {
            if (values.symbol === result[0].toLowerCase()) {
              idCoinFrom = values.id;
            }
          });
        await handleGetAllCoin(result, idCoinFrom, object.timeRange);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 250);
    }
  };
  return (
    <div className={styles.container}>
      {loading && <Loading />}
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <Row className={styles.container__title}>
            <Col xs={24} sm={11} md={11} lg={11} xl={11}>
              <h2>Generate chart too</h2>
            </Col>
            <Col xs={24} sm={11} md={11} lg={11} xl={11}>
              <div className={styles.container__title__button}>
                <Button
                  onClick={() => setOpenWatchList(!openWatchList)}
                  type="primary"
                >
                  My Watchlist
                </Button>
                {openWatchList && (
                  <DrawerComponent
                    list={listWatched}
                    setOpen={setOpenWatchList}
                    open={openWatchList}
                  />
                )}
              </div>
            </Col>
          </Row>
          <Row className={styles.container__item}>
            <Col xs={24} sm={24} md={2} lg={2} xl={2}>
              <h3>Pair of Coins:</h3>
            </Col>
            <Col xs={24} sm={24} md={22} lg={22} xl={22}>
              <InputComponent
                type="text"
                name="pairOfCoin"
                placeholder="Example: btc/bnb"
              />
            </Col>
          </Row>
          <Row className={styles.container__item}>
            <Col xs={24} sm={24} md={2} lg={2} xl={2}>
              <h3>Time range: </h3>
            </Col>
            <Col xs={24} sm={24} md={22} lg={22} xl={22}>
              <SelectComponent
                data={listTimeRange}
                name="timeRange"
                placeholder="Select time range"
              />
            </Col>
          </Row>
          <Row className={styles.container__item}>
            <Col xs={24} sm={24} md={24} lg={2} xl={2}></Col>
            <Col xs={24} sm={22} md={22} lg={22} xl={22}>
              <Row className={styles.container__item__submit}>
                <div>
                  <Button
                    onClick={() => {
                      deleteUrl("coinFrom");
                      deleteUrl("coinTo");
                      deleteUrl("range");
                      deleteUrl("id");
                      methods.reset({
                        ...defaultValues,
                        pairOfCoin: "",
                        timeRange: TimePeriod["1D"],
                      });
                      setListChart([]);
                    }}
                    type="primary"
                    danger
                  >
                    Reset
                  </Button>
                </div>
                <div>
                  <button
                    className={styles.container__item__submit__generate}
                    type="submit"
                  >
                    Generate URL
                  </button>
                </div>
                {listChart?.length > 0 && (
                  <Button
                    onClick={() => setOpenGeneratedLink(!openGeneratedLink)}
                    type="link"
                  >
                    Generated Link
                  </Button>
                )}
                {openGeneratedLink && (
                  <ModalComponent
                    listChart={listChart}
                    open={openGeneratedLink}
                  />
                )}
              </Row>
            </Col>
          </Row>
        </form>
      </FormProvider>
    </div>
  );
}

export default App;
