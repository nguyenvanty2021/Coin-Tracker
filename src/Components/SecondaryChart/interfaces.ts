import { DataProps } from "../PrimaryChart/interfaces";

export interface SecondaryChartProps {
  data: DataProps[];
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
}
