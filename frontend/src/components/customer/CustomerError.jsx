import styled from "styled-components";

const TableDiv = styled.div`
  width: 80%;
  margin: 40px auto;
  display: flex;
  flex-direction: column;
`;

const TitleH2 = styled.h2`
  display: flex;
  gap: 15px;
  margin-bottom: 10px;
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

const MessageH2 = styled.h2`
  margin: 40px auto;
  font-size: 20px;
  font-weight: 500;
`;

const CustomerError = ({ month, day, message }) => {
  return (
    <TableDiv>
      <TitleH2>
        <Box />
        고객별 추적 기록
      </TitleH2>
      <DateDiv>{`${month}월 ${day}일`}</DateDiv>
      <MessageH2>{message}</MessageH2>
    </TableDiv>
  );
};

export default CustomerError;
