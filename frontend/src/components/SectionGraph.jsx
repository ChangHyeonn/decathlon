import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import styled from "styled-components";
import { graphData } from "../dummy";

const GraphDiv = styled.div`
  width: 90%;
  display: flex;
  margin: auto;
  justify-content: center;
`;

const SectionGraph = () => {
  return (
    <GraphDiv>
      <LineChart width={1250} height={600} data={graphData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <Line type="monotone" dataKey="비율" stroke="#394DBF" />
        <CartesianGrid stroke="#A5AEE1" strokeDasharray="5 5" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
      </LineChart>
    </GraphDiv>
  );
};
export default SectionGraph;
