import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Label } from "recharts";
import styled from "styled-components";
import { useQuery } from "@tanstack/react-query";
import { getGraphToday, getGraphWeekly, getGraphMonthly } from "../../api/sectionApi";

const GraphDiv = styled.div`
  width: 90%;
  display: flex;
  flex-direction: column;
  margin: auto;
  justify-content: center;
  align-items: center;
`;

const MessageH2 = styled.h2`
  margin: 40px auto;
  font-size: 20px;
  font-weight: 500;
`;

const SectionGraph = ({ nowDate }) => {
  const {
    data: graphData,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["graph", nowDate],
    queryFn: () => {
      // nowDate 값에 따라 다른 API 함수 호출
      if (nowDate === "일간") return getGraphToday();
      if (nowDate === "주간") return getGraphWeekly();
      if (nowDate === "월간") return getGraphMonthly();
    },
  });

  if (isPending) {
    return <MessageH2>Loading...</MessageH2>;
  }
  if (isError) {
    return <MessageH2>Error fetching posts</MessageH2>;
  }

  return (
    <GraphDiv>
      <LineChart width={1400} height={600} margin={{ top: 5, right: 40, bottom: 5, left: 40 }} data={graphData.zones}>
        <Line type="monotone" yAxisId="left" dataKey="total_stay_time_seconds" name="체류 시간" stroke="#394DBF" />
        <Line type="monotone" yAxisId="right" dataKey="score" name="점수" stroke="#ff7f0e" />
        <CartesianGrid stroke="#A5AEE1" strokeDasharray="5 5" />
        <XAxis dataKey="zone_name" />
        <YAxis yAxisId="left">
          <Label
            value="체류 시간 (초)"
            position="insideLeft"
            angle={0}
            dx={0}
            dy={20}
            style={{ textAnchor: "middle" }}
          />
        </YAxis>
        <YAxis yAxisId="right" orientation="right">
          <Label value="점수" position="insideRight" angle={0} dx={-10} dy={20} style={{ textAnchor: "middle" }} />
        </YAxis>
        <Tooltip />
      </LineChart>
    </GraphDiv>
  );
};
export default SectionGraph;
