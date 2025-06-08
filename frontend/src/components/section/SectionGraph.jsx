import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Label } from "recharts";
import styled from "styled-components";
import { useQuery } from "@tanstack/react-query";
import { getGraphToday, getGraphWeekly, getGraphMonthly } from "../../api/sectionApi";
import { useEffect, useState } from "react";
import { salesData } from "../../dummy";

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
      if (nowDate === "일간") return getGraphToday();
      if (nowDate === "주간") return getGraphWeekly();
      if (nowDate === "월간") return getGraphMonthly();
    },
  });

  const [mergedZones, setMergedZones] = useState([]);

  useEffect(() => {
    if (graphData && graphData.zones) {
      const totalStayTime = graphData.zones
        .filter((zone) => zone.zone_name !== "zone_checkout" && zone.zone_name !== "zone_entrance")
        .reduce((acc, zone) => acc + zone.total_stay_time_seconds, 0);

      const newZones = graphData.zones
        .map((zone) => {
          if (zone.zone_name !== "zone_checkout" && zone.zone_name !== "zone_entrance") {
            const dateSetting =
              nowDate === "일간" ? "Today" : nowDate === "주간" ? "Weekly" : nowDate === "월간" ? "Monthly" : "";
            const salesObj = salesData[`sales${dateSetting}Data`].find((s) => s.zone_name === zone.zone_name);
            return {
              ...zone,
              sales: salesObj ? salesObj.sales : 0,
              stay_time_percent:
                totalStayTime > 0 ? Math.round((zone.total_stay_time_seconds / totalStayTime) * 1000) / 10 : 0, // 백분율 계산
            };
          }
        })
        .filter(Boolean);
      setMergedZones(newZones);
    }
  }, [graphData, nowDate]);

  if (isPending) {
    return <MessageH2>Loading...</MessageH2>;
  }
  if (isError) {
    return <MessageH2>Error fetching posts</MessageH2>;
  }

  return (
    <GraphDiv>
      <LineChart width={1400} height={600} margin={{ top: 5, right: 40, bottom: 5, left: 40 }} data={mergedZones}>
        <Line type="monotone" yAxisId="left" dataKey="stay_time_percent" name="체류 시간" stroke="#394DBF" />
        <Line type="monotone" yAxisId="right" dataKey="sales" name="매출" stroke="#ff7f0e" />
        <CartesianGrid stroke="#A5AEE1" strokeDasharray="5 5" />
        <XAxis dataKey="zone_name" />
        <YAxis yAxisId="left">
          <Label
            value="체류 시간 (%)"
            position="insideLeft"
            angle={0}
            dx={0}
            dy={20}
            style={{ textAnchor: "middle" }}
          />
        </YAxis>
        <YAxis yAxisId="right" orientation="right">
          <Label
            value="매출 (만원)"
            position="insideRight"
            angle={0}
            dx={-10}
            dy={20}
            style={{ textAnchor: "middle" }}
          />
        </YAxis>
        <Tooltip
          formatter={(value, name) => {
            if (name === "체류 시간") {
              return [`${value} %`, name];
            }
            if (name === "매출") {
              return [`${value} 만원`, name];
            }
            return [value, name];
          }}
        />
      </LineChart>
    </GraphDiv>
  );
};
export default SectionGraph;
