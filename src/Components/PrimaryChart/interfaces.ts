export interface DataProps {
  date: string;
  price: number;
}
export interface PrimaryChartProps {
  data: DataProps[];
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
}
export type TooltipData = DataProps;
