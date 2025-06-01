import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Label } from "recharts";
import styled from "styled-components";
import { zones } from "../dummy";
import { useQuery } from "@tanstack/react-query";
import { getGraphToday } from "../api/sectionApi";

const GraphDiv = styled.div`
  width: 90%;
  display: flex;
  flex-direction: column;
  margin: auto;
  justify-content: center;
  align-items: center;
`;

const DateDiv = styled.div`
  margin: 20px auto;
  font-size: 22px;
  font-weight: 500;
`;

const SectionGraph = () => {
  const {
    data: graphData,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["graph"],
    queryFn: getGraphToday,
  });

  if (isPending) {
    return <h2>Loading...</h2>;
  }
  if (isError) {
    return <h2>Error fetching posts</h2>;
  }

  if (graphData) {
    console.log(graphData);
  }

  const month = new Date().getMonth() + 1;
  const day = new Date().getDate();

  return (
    <GraphDiv>
      <DateDiv>{`${month}월 ${day}일`}</DateDiv>
      <LineChart width={1400} height={600} margin={{ top: 5, right: 40, bottom: 5, left: 40 }} data={zones}>
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
