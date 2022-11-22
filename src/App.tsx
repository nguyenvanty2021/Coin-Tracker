import { Button, Col, Row, Drawer, Table } from "antd";
import styles from "./App.module.scss";
import InputComponent from "./Components/Input/index";
import { yupResolver } from "@hookform/resolvers/yup";
import { Link } from "react-router-dom";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import * as yup from "yup";
import numeral from "numeral";
import SelectComponent from "./Components/Select";
import { Status, TimeFilters } from "./Constants/enum";
import { deleteUrl, getQueryParam, updateUrl } from "./Utils/query";
import coinApi from "./Api/coinApi";
import { notify } from "./Utils/notification";
import Loading from "./Components/Loading";
import { useState } from "react";
import { DataProps } from "./Components/PrimaryChart/interfaces";
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
  priceCoinFrom: string;
  priceCoinTo: string;
}
export const TimePeriod: {
  [key: string]: TimeFilters;
} = {
  "1D": TimeFilters.P1D,
  "7D": TimeFilters.P7D,
  "1M": TimeFilters.P1M,
  "3M": TimeFilters.P3M,
  "1Y": TimeFilters.P1Y,
  ALL: TimeFilters.ALL,
};
export const listTimeRange: TimeRangeProps<string>[] = [
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
  const handleFormatCoin = (coin: number) =>
    coin < 0.001 ? 6 : coin < 0.01 ? 5 : coin < 10 ? 4 : 0;
  const columns: ColumnsType<ListWatchedProps> = [
    {
      title: "Pair",
      dataIndex: "pairOfCoins",
      key: "pairOfCoins",
      render: (_, record) => (
        <div>{`${record.coinFrom}/${record.coinTo}`.toUpperCase()}</div>
      ),
    },
    {
      title: "Current",
      dataIndex: "currentPrice",
      key: "currentPrice",
      render: (_, record) => {
        const total =
          parseFloat(record.priceCoinFrom) / parseFloat(record.priceCoinTo);
        return <p>{`${total.toFixed(handleFormatCoin(total))}`}</p>;
      },
    },
    {
      title: "Link",
      dataIndex: "link",
      key: "link",
      render: (_, record) => (
        <Link
          to={{
            pathname: `/coins/${record.coinFrom}/${record.coinTo}`,
            search: `?range=1D`,
          }}
        >
          Link
        </Link>
      ),
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
        dataSource={list?.length > 0 ? list.filter((v) => v.watched) : []}
      />
    </Drawer>
  );
};
function App() {
  const queryParam = getQueryParam<any>();
  const [listChart, setListChart] = useState<DataProps[]>([]);
  const [openWatchList, setOpenWatchList] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [coin, setCoin] = useState<string>("");
  const local: any = localStorage?.getItem("listWatched");
  const [idCommon, setIdCommon] = useState<{
    idCoinFromState: string;
  }>({
    idCoinFromState: "",
  });
  const listWatched: ListWatchedProps[] = local && JSON.parse(local);
  const indexRange = Object.keys(TimePeriod).findIndex(
    (values) => values === queryParam["range"]
  );
  const objectCoin: any =
    listWatched?.length > 0 &&
    listWatched.find((v) => `${v.coinFrom}${v.coinTo}` === coin);
  const defaultValues: FormProps<string> = {
    pairOfCoin:
      objectCoin && objectCoin["coinFrom"] && objectCoin["coinTo"]
        ? `${objectCoin["coinFrom"]}/${objectCoin["coinTo"]}`
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
    timeRange: string,
    priceCoinFrom: string,
    priceCoinTo: string
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
        setCoin(`${coinFrom}${coinTo}`);
        updateUrl("range", listKeys[index]);
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
          const founded = listWatched.every(
            (el) => `${el.coinFrom}${el.coinTo}` !== `${coinFrom}${coinTo}`
          );
          if (founded) {
            listWatched.push({
              coinFrom,
              coinTo,
              idCoinFrom,
              watched: false,
              priceCoinFrom,
              priceCoinTo,
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
                priceCoinFrom,
                priceCoinTo,
              },
            ])
          );
        }
        notify("success", "Generate URL Successfully!", 2000);
      } else {
        notify("warning", "Pair of Coins is not valid!", 2000);
      }
    } catch (error) {
      notify("warning", "Pair of Coins is not valid!", 2000);
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
        let priceCoinFrom = "";
        let priceCoinTo = "";
        res?.data?.length > 0 &&
          res.data.forEach((values: any) => {
            if (values.symbol === result[0].toLowerCase()) {
              idCoinFrom = values.id;
              priceCoinFrom = numeral(values.current_price).format("0.0.00");
            }
            if (values.symbol === result[1].toLowerCase()) {
              priceCoinTo = numeral(values.current_price).format("0.0.00");
            }
          });
        const [idCoinFromV1]: any = await Promise.all([
          coinApi.getCoinByName(result[0]),
          handleGetAllCoin(
            result,
            idCoinFrom,
            object.timeRange,
            priceCoinFrom,
            priceCoinTo
          ),
        ]);
        setIdCommon({
          ...idCommon,
          idCoinFromState:
            idCoinFromV1?.data?.coins?.length > 0
              ? idCoinFromV1.data.coins[0].id
              : "",
        });
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
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
                  // <Button
                  //   // onClick={() => {
                  //   //   history.push({
                  //   //     pathname: `/coins/${queryParam["coinFrom"]}/${queryParam["coinTo"]}`,
                  //   //     search: queryParam,
                  //   //   });
                  //   // }}
                  //   type="link"
                  // >
                  //   Generated Link
                  // </Button>
                  <Link
                    to={{
                      pathname: `/coins/${idCommon.idCoinFromState}/${objectCoin["coinTo"]}`,
                      search: `?range=${queryParam["range"]}`,
                    }}
                  >
                    Generated Link
                  </Link>
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
