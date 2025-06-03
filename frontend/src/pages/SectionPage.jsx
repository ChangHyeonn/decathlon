import styled from "styled-components";
import TheHeader from "../layout/TheHeader";
import SectionGraph from "../components/SectionGraph";
import { useState } from "react";

const GraphDiv = styled.div`
  width: 80%;
  margin: 40px auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const GraphH2 = styled.h2`
  display: flex;
  gap: 15px;
  font-size: 24px;
  font-weight: 500;
`;

const Box = styled.div`
  width: 20px;
  height: 30px;
  background-color: #272757;
`;

const DateDiv = styled.div`
  margin: 20px auto;
  font-size: 22px;
  font-weight: 500;
`;

const SelectDateDiv = styled.div`
  width: 90%;
  font-size: 14px;
  text-align: right;
`;
const Button = styled.button`
  border: 0;
  background-color: transparent;
  font-weight: ${({ selected }) => (selected ? "bold" : "normal")};
  cursor: pointer;
`;

const SectionPage = () => {
  const [nowDate, setNowDate] = useState("일간");

  const month = new Date().getMonth() + 1;
  const day = new Date().getDate();

  return (
    <>
      <TheHeader />
      <GraphDiv>
        <GraphH2>
          <Box />
          섹션별 체류 시간
        </GraphH2>
        <DateDiv>{`${month}월 ${day}일`}</DateDiv>
        <SelectDateDiv>
          <Button selected={nowDate === "일간"} onClick={() => setNowDate("일간")}>
            일간
          </Button>{" "}
          /{" "}
          <Button selected={nowDate === "주간"} onClick={() => setNowDate("주간")}>
            주간
          </Button>{" "}
          /{" "}
          <Button selected={nowDate === "월간"} onClick={() => setNowDate("월간")}>
            월간
          </Button>
        </SelectDateDiv>
        <SectionGraph nowDate={nowDate} />
      </GraphDiv>
    </>
  );
};

export default SectionPage;
